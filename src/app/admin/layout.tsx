import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import AdminLayoutClient from './AdminLayoutClient';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  // In a demo deployment the admin dashboard is part of the showcase, so any
  // visitor may open it. We cannot gate this on the `x-simulator-admin` header
  // because a client-side navigation (router.push('/admin')) does not send
  // custom headers — that header check made the route always redirect to "/".
  // Real production deployments set NEXT_PUBLIC_DEMO_MODE="false", where access
  // still requires a genuine ADMIN session, so real admin auth is unchanged.
  const isAdmin = session?.user?.role === 'ADMIN' || isDemoMode;

  if (!isAdmin) {
    redirect('/');
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
