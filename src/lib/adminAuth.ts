// =============================================================================
// Reusable server-side authorization helpers for the admin panel.
//
// Every admin API route, server action and protected server component should
// gate through one of these. They NEVER expose session secrets — only the safe,
// already-public identity fields the session callback attaches.
// =============================================================================

import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import {
  type AdminRole,
  isSuperAdminRole,
  permissionListAllows,
} from './permissions';

export interface AdminSessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  role: 'USER' | 'ADMIN';
  adminRole: AdminRole | null;
  adminActive: boolean;
  permissions: string[];
}

export type AuthResult =
  | { ok: true; user: AdminSessionUser }
  | { ok: false; status: 401 | 403; message: string };

// Generic, non-leaky messages. We never reveal *why* internally (e.g. which
// permission), only the category, so probing the API yields no schema details.
const MSG_UNAUTHENTICATED = 'Authentication required.';
const MSG_NOT_ADMIN = 'Admin access required.';
const MSG_DEACTIVATED = 'Your admin access has been deactivated.';
const MSG_FORBIDDEN = 'You do not have permission to perform this action.';

function readSessionUser(sessionUser: Record<string, unknown> | undefined): AdminSessionUser | null {
  if (!sessionUser || typeof sessionUser.id !== 'string') return null;
  return {
    id: sessionUser.id as string,
    name: (sessionUser.name as string | null | undefined) ?? null,
    email: (sessionUser.email as string | null | undefined) ?? null,
    image: (sessionUser.image as string | null | undefined) ?? null,
    role: (sessionUser.role as 'USER' | 'ADMIN') ?? 'USER',
    adminRole: (sessionUser.adminRole as AdminRole | null | undefined) ?? null,
    adminActive: sessionUser.adminActive !== false,
    permissions: Array.isArray(sessionUser.permissions) ? (sessionUser.permissions as string[]) : [],
  };
}

/** Require any active admin. */
export async function requireAdmin(): Promise<AuthResult> {
  const session = await auth();
  const user = readSessionUser(session?.user as Record<string, unknown> | undefined);
  if (!user) return { ok: false, status: 401, message: MSG_UNAUTHENTICATED };
  if (user.role !== 'ADMIN') return { ok: false, status: 403, message: MSG_NOT_ADMIN };
  if (!user.adminActive) return { ok: false, status: 403, message: MSG_DEACTIVATED };
  return { ok: true, user };
}

/** Require an active Super Admin (only role that may manage other admins). */
export async function requireSuperAdmin(): Promise<AuthResult> {
  const base = await requireAdmin();
  if (!base.ok) return base;
  if (!isSuperAdminRole(base.user.adminRole)) {
    return { ok: false, status: 403, message: MSG_FORBIDDEN };
  }
  return base;
}

/** Require an active admin holding a specific granular permission. */
export async function requirePermission(permission: string): Promise<AuthResult> {
  const base = await requireAdmin();
  if (!base.ok) return base;
  if (!permissionListAllows(base.user.permissions, permission)) {
    return { ok: false, status: 403, message: MSG_FORBIDDEN };
  }
  return base;
}

/** Turn a failed AuthResult into a JSON NextResponse with the right status. */
export function authFail(result: Extract<AuthResult, { ok: false }>): NextResponse {
  return NextResponse.json({ error: result.message }, { status: result.status });
}

/**
 * Extract best-effort request metadata for audit logs. Never throws.
 * IP is derived from standard proxy headers; user-agent from the UA header.
 */
export function getRequestMeta(req: Request): { ipAddress: string | null; userAgent: string | null } {
  try {
    const fwd = req.headers.get('x-forwarded-for');
    const ipAddress =
      (fwd ? fwd.split(',')[0].trim() : null) ||
      req.headers.get('x-real-ip') ||
      null;
    const userAgent = req.headers.get('user-agent') || null;
    return { ipAddress, userAgent };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}
