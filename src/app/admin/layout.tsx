import React from 'react';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { headers } from 'next/headers';
import AdminLayoutClient from './AdminLayoutClient';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const headersList = await headers();
  const isDemoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';
  const simulatedAdmin = isDemoMode && headersList.get('x-simulator-admin') === 'true';

  const isAdmin = session?.user?.role === 'ADMIN' || simulatedAdmin;
  
  if (!isAdmin) {
    redirect('/');
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>;
}
