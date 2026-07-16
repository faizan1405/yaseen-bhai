import { NextResponse } from 'next/server';
import { requireAdmin, authFail } from '@/lib/adminAuth';
import { ADMIN_ROLE_LABELS, type AdminRole } from '@/lib/permissions';

// Returns the CURRENT admin's safe identity + effective permissions so the
// client sidebar can hide sections the admin cannot access. Never returns
// secrets. Menu hiding is cosmetic only — every route/API enforces server-side.
export async function GET() {
  const gate = await requireAdmin();
  if (!gate.ok) return authFail(gate);

  const { user } = gate;
  const effectiveRole: AdminRole = (user.adminRole ?? 'SUPER_ADMIN') as AdminRole;

  return NextResponse.json({
    id: user.id,
    name: user.name ?? null,
    email: user.email ?? null,
    role: user.role,
    adminRole: user.adminRole,
    effectiveRole,
    effectiveRoleLabel: ADMIN_ROLE_LABELS[effectiveRole],
    isSuperAdmin: user.adminRole == null || user.adminRole === 'SUPER_ADMIN',
    active: user.adminActive,
    permissions: user.permissions,
  });
}
