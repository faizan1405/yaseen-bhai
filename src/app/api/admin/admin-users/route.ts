import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { requireSuperAdmin, authFail, getRequestMeta } from '@/lib/adminAuth';
import { logAdminAction } from '@/lib/adminAudit';
import { sanitizeErrorMessage } from '@/lib/profileStore';
import {
  ADMIN_ROLES,
  ALL_PERMISSION_KEYS,
  getEffectivePermissions,
  isSuperAdminRole,
  ADMIN_ROLE_LABELS,
  type AdminRole,
} from '@/lib/permissions';

// Only these User fields are ever exposed by this endpoint. Auth secrets
// (accounts, sessions, tokens) are NEVER selected or returned.
const SAFE_SELECT = {
  id: true,
  name: true,
  email: true,
  image: true,
  role: true,
  adminRole: true,
  adminPermissions: true,
  adminActive: true,
  adminCreatedById: true,
  adminUpdatedById: true,
  adminCreatedAt: true,
  adminUpdatedAt: true,
  lastLoginAt: true,
  accountStatus: true,
  createdAt: true,
} as const;

class GuardError extends Error {
  status: number;
  constructor(message: string, status = 409) {
    super(message);
    this.status = status;
  }
}

function isActiveSuperAdmin(u: { role: string; adminActive: boolean | null; adminRole: AdminRole | null }): boolean {
  return u.role === 'ADMIN' && u.adminActive !== false && isSuperAdminRole(u.adminRole);
}

async function otherActiveSuperAdminsExist(excludeUserId: string): Promise<boolean> {
  const count = await prisma.user.count({
    where: {
      id: { not: excludeUserId },
      role: 'ADMIN',
      NOT: { adminActive: false },
      OR: [{ adminRole: 'SUPER_ADMIN' }, { adminRole: null }],
    },
  });
  return count > 0;
}

/**
 * Enforce the invariant: the system must always keep at least one active Super
 * Admin. Throws GuardError when a change would remove the last one.
 */
async function assertKeepsSuperAdmin(
  target: { id: string; role: string; adminActive: boolean | null; adminRole: AdminRole | null },
  resulting: { role: string; adminActive: boolean | null; adminRole: AdminRole | null },
): Promise<void> {
  if (!isActiveSuperAdmin(target)) return; // not touching an active super admin
  const resultingActiveSuper =
    resulting.role === 'ADMIN' && resulting.adminActive !== false && isSuperAdminRole(resulting.adminRole);
  if (resultingActiveSuper) return; // still an active super admin
  if (!(await otherActiveSuperAdminsExist(target.id))) {
    throw new GuardError(
      'The system must always keep at least one active Super Admin. Assign another Super Admin before changing this one.',
    );
  }
}

function validatePermissions(input: unknown): string[] {
  if (!Array.isArray(input)) return [];
  const valid = new Set<string>(ALL_PERMISSION_KEYS);
  return Array.from(new Set(input.filter((p): p is string => typeof p === 'string' && valid.has(p))));
}

function shapeAdmin(
  u: {
    id: string; name: string | null; email: string | null; image: string | null;
    role: string; adminRole: AdminRole | null; adminPermissions: string[]; adminActive: boolean | null;
    adminCreatedById: string | null; adminUpdatedById: string | null;
    adminCreatedAt: Date | null; adminUpdatedAt: Date | null; lastLoginAt: Date | null;
    accountStatus: string; createdAt: Date;
  },
  nameLookup: Map<string, string>,
) {
  const effectiveRole: AdminRole = (u.adminRole ?? 'SUPER_ADMIN') as AdminRole;
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    image: u.image,
    role: u.role,
    adminRole: u.adminRole,
    effectiveRole,
    effectiveRoleLabel: ADMIN_ROLE_LABELS[effectiveRole],
    isLegacyAdmin: u.role === 'ADMIN' && u.adminRole == null,
    customPermissions: u.adminPermissions ?? [],
    permissions: getEffectivePermissions({
      role: u.role,
      adminRole: u.adminRole,
      adminPermissions: u.adminPermissions,
      adminActive: u.adminActive,
    }),
    active: u.adminActive !== false,
    createdBy: u.adminCreatedById ? (nameLookup.get(u.adminCreatedById) ?? 'Unknown') : null,
    updatedBy: u.adminUpdatedById ? (nameLookup.get(u.adminUpdatedById) ?? 'Unknown') : null,
    adminCreatedAt: u.adminCreatedAt,
    adminUpdatedAt: u.adminUpdatedAt,
    lastLoginAt: u.lastLoginAt,
    accountCreatedAt: u.createdAt,
    accountStatus: u.accountStatus,
  };
}

// ---------------------------------------------------------------------------
// GET — list all admin users (Super Admin only)
// ---------------------------------------------------------------------------
export async function GET(req: NextRequest) {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return authFail(gate);

  try {
    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').toLowerCase().trim();
    const roleFilter = searchParams.get('role') || '';
    const statusFilter = searchParams.get('status') || ''; // 'active' | 'inactive'

    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' },
      select: SAFE_SELECT,
      orderBy: { adminCreatedAt: 'desc' },
    });

    // Resolve creator/updater display names in a single follow-up query.
    const refIds = new Set<string>();
    for (const a of admins) {
      if (a.adminCreatedById) refIds.add(a.adminCreatedById);
      if (a.adminUpdatedById) refIds.add(a.adminUpdatedById);
    }
    const nameLookup = new Map<string, string>();
    if (refIds.size > 0) {
      const refs = await prisma.user.findMany({
        where: { id: { in: Array.from(refIds) } },
        select: { id: true, name: true, email: true },
      });
      for (const r of refs) nameLookup.set(r.id, r.name || r.email || 'Unknown');
    }

    let shaped = admins.map((a) => shapeAdmin(a as Parameters<typeof shapeAdmin>[0], nameLookup));

    if (roleFilter) shaped = shaped.filter((a) => a.effectiveRole === roleFilter);
    if (statusFilter === 'active') shaped = shaped.filter((a) => a.active);
    if (statusFilter === 'inactive') shaped = shaped.filter((a) => !a.active);
    if (search) {
      shaped = shaped.filter(
        (a) =>
          (a.name || '').toLowerCase().includes(search) ||
          (a.email || '').toLowerCase().includes(search) ||
          a.effectiveRoleLabel.toLowerCase().includes(search),
      );
    }

    return NextResponse.json({ admins: shaped, total: shaped.length });
  } catch (error) {
    console.error('Admin-users GET failed:', sanitizeErrorMessage(error instanceof Error ? error.message : String(error)));
    return NextResponse.json({ error: 'Unable to load admin users. Check the database connection.' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — manage admins (Super Admin only)
// ---------------------------------------------------------------------------
export async function POST(req: NextRequest) {
  const gate = await requireSuperAdmin();
  if (!gate.ok) return authFail(gate);
  const actor = gate.user;
  const meta = getRequestMeta(req);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body.' }, { status: 400 });
  }

  const action = String(body.action || '');

  try {
    switch (action) {
      case 'promote':
        return await handlePromote(body, actor, meta);
      case 'updateRole':
        return await handleUpdateRole(body, actor, meta);
      case 'updatePermissions':
        return await handleUpdatePermissions(body, actor, meta);
      case 'setActive':
        return await handleSetActive(body, actor, meta);
      case 'removeAdmin':
        return await handleRemoveAdmin(body, actor, meta);
      default:
        return NextResponse.json({ error: 'Invalid action.' }, { status: 400 });
    }
  } catch (error) {
    if (error instanceof GuardError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Admin-users POST failed:', sanitizeErrorMessage(error instanceof Error ? error.message : String(error)));
    return NextResponse.json({ error: 'The admin action could not be completed.' }, { status: 500 });
  }
}

type Actor = { id: string; name?: string | null; email?: string | null };
type Meta = { ipAddress: string | null; userAgent: string | null };

async function findTargetByBody(body: Record<string, unknown>) {
  const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!userId && !email) throw new GuardError('A target user id or email is required.', 400);
  const target = userId
    ? await prisma.user.findUnique({ where: { id: userId }, select: SAFE_SELECT })
    : await prisma.user.findUnique({ where: { email }, select: SAFE_SELECT });
  return target;
}

async function handlePromote(body: Record<string, unknown>, actor: Actor, meta: Meta) {
  const adminRole = String(body.adminRole || '') as AdminRole;
  if (!ADMIN_ROLES.includes(adminRole)) {
    return NextResponse.json({ error: 'A valid admin role is required.' }, { status: 400 });
  }
  const target = await findTargetByBody(body);
  if (!target) {
    return NextResponse.json(
      { error: 'No matching user found. They must sign in with Google at least once before being promoted.' },
      { status: 404 },
    );
  }

  const permissions = validatePermissions(body.permissions);

  // Guard: promoting an existing last super admin down to a lesser role.
  await assertKeepsSuperAdmin(
    { id: target.id, role: target.role, adminActive: target.adminActive, adminRole: target.adminRole },
    { role: 'ADMIN', adminActive: true, adminRole },
  );

  const wasAdmin = target.role === 'ADMIN';
  const updated = await prisma.user.update({
    where: { id: target.id },
    data: {
      role: 'ADMIN',
      adminRole,
      adminActive: true,
      adminPermissions: permissions,
      adminUpdatedById: actor.id,
      adminUpdatedAt: new Date(),
      // Stamp creation only the first time this user becomes an admin.
      ...(target.adminCreatedAt ? {} : { adminCreatedById: actor.id, adminCreatedAt: new Date() }),
    },
    select: SAFE_SELECT,
  });

  await logAdminAction({
    actorUserId: actor.id,
    action: wasAdmin ? 'ADMIN_ROLE_CHANGE' : 'ADMIN_CREATE',
    targetType: 'User',
    targetId: target.id,
    previousValue: { role: target.role, adminRole: target.adminRole, active: target.adminActive !== false },
    newValue: { role: 'ADMIN', adminRole, active: true, permissions },
    metadata: { targetEmail: maskEmail(target.email), by: actor.email },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return NextResponse.json({ success: true, admin: shapeAdmin(updated as Parameters<typeof shapeAdmin>[0], new Map()) });
}

async function handleUpdateRole(body: Record<string, unknown>, actor: Actor, meta: Meta) {
  const adminRole = String(body.adminRole || '') as AdminRole;
  if (!ADMIN_ROLES.includes(adminRole)) {
    return NextResponse.json({ error: 'A valid admin role is required.' }, { status: 400 });
  }
  const target = await findTargetByBody(body);
  if (!target || target.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Target admin not found.' }, { status: 404 });
  }

  await assertKeepsSuperAdmin(
    { id: target.id, role: target.role, adminActive: target.adminActive, adminRole: target.adminRole },
    { role: 'ADMIN', adminActive: target.adminActive, adminRole },
  );

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { adminRole, adminUpdatedById: actor.id, adminUpdatedAt: new Date() },
    select: SAFE_SELECT,
  });

  await logAdminAction({
    actorUserId: actor.id,
    action: 'ADMIN_ROLE_CHANGE',
    targetType: 'User',
    targetId: target.id,
    previousValue: { adminRole: target.adminRole ?? 'SUPER_ADMIN(legacy)' },
    newValue: { adminRole },
    metadata: { targetEmail: maskEmail(target.email), by: actor.email },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return NextResponse.json({ success: true, admin: shapeAdmin(updated as Parameters<typeof shapeAdmin>[0], new Map()) });
}

async function handleUpdatePermissions(body: Record<string, unknown>, actor: Actor, meta: Meta) {
  const target = await findTargetByBody(body);
  if (!target || target.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Target admin not found.' }, { status: 404 });
  }
  const permissions = validatePermissions(body.permissions);

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { adminPermissions: permissions, adminUpdatedById: actor.id, adminUpdatedAt: new Date() },
    select: SAFE_SELECT,
  });

  await logAdminAction({
    actorUserId: actor.id,
    action: 'ADMIN_PERMISSION_CHANGE',
    targetType: 'User',
    targetId: target.id,
    previousValue: { permissions: target.adminPermissions ?? [] },
    newValue: { permissions },
    metadata: { targetEmail: maskEmail(target.email), by: actor.email },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return NextResponse.json({ success: true, admin: shapeAdmin(updated as Parameters<typeof shapeAdmin>[0], new Map()) });
}

async function handleSetActive(body: Record<string, unknown>, actor: Actor, meta: Meta) {
  const active = body.active === true || body.active === 'true';
  const target = await findTargetByBody(body);
  if (!target || target.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Target admin not found.' }, { status: 404 });
  }

  await assertKeepsSuperAdmin(
    { id: target.id, role: target.role, adminActive: target.adminActive, adminRole: target.adminRole },
    { role: 'ADMIN', adminActive: active, adminRole: target.adminRole },
  );

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { adminActive: active, adminUpdatedById: actor.id, adminUpdatedAt: new Date() },
    select: SAFE_SELECT,
  });

  await logAdminAction({
    actorUserId: actor.id,
    action: active ? 'ADMIN_ACTIVATED' : 'ADMIN_DEACTIVATED',
    targetType: 'User',
    targetId: target.id,
    previousValue: { active: target.adminActive !== false },
    newValue: { active },
    metadata: { targetEmail: maskEmail(target.email), by: actor.email },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return NextResponse.json({ success: true, admin: shapeAdmin(updated as Parameters<typeof shapeAdmin>[0], new Map()) });
}

async function handleRemoveAdmin(body: Record<string, unknown>, actor: Actor, meta: Meta) {
  const target = await findTargetByBody(body);
  if (!target || target.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Target admin not found.' }, { status: 404 });
  }

  await assertKeepsSuperAdmin(
    { id: target.id, role: target.role, adminActive: target.adminActive, adminRole: target.adminRole },
    { role: 'USER', adminActive: false, adminRole: null },
  );

  // Remove admin access but PRESERVE the underlying user account (profile,
  // memberships, payments, leads all remain untouched).
  const updated = await prisma.user.update({
    where: { id: target.id },
    data: {
      role: 'USER',
      adminRole: null,
      adminActive: false,
      adminPermissions: [],
      adminUpdatedById: actor.id,
      adminUpdatedAt: new Date(),
    },
    select: SAFE_SELECT,
  });

  await logAdminAction({
    actorUserId: actor.id,
    action: 'ADMIN_ACCESS_REMOVED',
    targetType: 'User',
    targetId: target.id,
    previousValue: { role: 'ADMIN', adminRole: target.adminRole ?? 'SUPER_ADMIN(legacy)' },
    newValue: { role: 'USER' },
    metadata: { targetEmail: maskEmail(target.email), by: actor.email, note: 'User account preserved' },
    ipAddress: meta.ipAddress,
    userAgent: meta.userAgent,
  });

  return NextResponse.json({ success: true, admin: shapeAdmin(updated as Parameters<typeof shapeAdmin>[0], new Map()) });
}

// Mask an email for audit metadata (avoid storing full PII unnecessarily).
function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const head = local.slice(0, 1);
  return `${head}***@${domain}`;
}
