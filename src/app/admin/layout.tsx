import React from 'react';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { auth } from '@/auth';
import AdminLayoutClient from './AdminLayoutClient';
import AdminAccessDenied from '../../components/AdminAccessDenied';
import { requiredPermissionForPath, permissionListAllows, RESOURCE_LABELS, type Resource } from '../../lib/permissions';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const h = await headers();
  const pathname = h.get('x-pathname') || '';

  // Login page must be accessible without a session — render it bare (no sidebar).
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const session = await auth();

  // A genuine, ACTIVE ADMIN session is required to access the admin panel.
  // `session.user.role` already reflects deactivation (see src/auth.ts session
  // callback), so a deactivated admin lands here as role "USER" and is bounced
  // to the login screen immediately — no separate check needed.
  const isAdmin = session?.user?.role === 'ADMIN';

  if (!isAdmin) {
    redirect('/admin/login');
  }

  // Per-route permission gate. Enforced here (server component) so direct URL
  // access is blocked even if the sidebar hides the link — the sidebar's
  // hiding is a UX convenience only, this is the real gate.
  const requiredPerm = requiredPermissionForPath(pathname);
  const permissions = session!.user.permissions || [];
  const allowed = !requiredPerm || permissionListAllows(permissions, requiredPerm);

  if (!allowed) {
    const resource = requiredPerm!.split(':')[0] as Resource;
    return (
      <AdminLayoutClient>
        <AdminAccessDenied section={RESOURCE_LABELS[resource]} />
      </AdminLayoutClient>
    );
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
