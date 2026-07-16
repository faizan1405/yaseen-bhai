'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import Navbar from '../../components/Navbar';
import { PremiumFooter } from '../../components/NikahComponents';

interface DashboardCounts {
  shortlisted: number;
  pendingReceived: number;
  pendingSent: number;
  unreadNotifications: number;
}

const TABS = [
  { href: '/dashboard/viewed-profiles', label: 'Viewed Profiles', icon: '👁️', countKey: null as keyof DashboardCounts | null },
  { href: '/dashboard/shortlisted-profiles', label: 'Shortlisted', icon: '❤️', countKey: 'shortlisted' as const },
  { href: '/dashboard/interests/received', label: 'Interests Received', icon: '📥', countKey: 'pendingReceived' as const },
  { href: '/dashboard/interests/sent', label: 'Interests Sent', icon: '📤', countKey: 'pendingSent' as const },
  { href: '/dashboard/notifications', label: 'Notifications', icon: '🔔', countKey: 'unreadNotifications' as const },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useApp();
  const router = useRouter();
  const pathname = usePathname();
  const [counts, setCounts] = useState<DashboardCounts>({
    shortlisted: 0,
    pendingReceived: 0,
    pendingSent: 0,
    unreadNotifications: 0,
  });

  useEffect(() => {
    if (!isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  useEffect(() => {
    if (!isLoggedIn) return;
    let cancelled = false;

    async function loadCounts() {
      try {
        const [shortlistRes, interestRes, unreadRes] = await Promise.all([
          fetch('/api/user/shortlist?page=1&pageSize=1'),
          fetch('/api/interests/counts'),
          fetch('/api/notifications/unread-count'),
        ]);
        if (cancelled) return;

        const next: DashboardCounts = { shortlisted: 0, pendingReceived: 0, pendingSent: 0, unreadNotifications: 0 };
        if (shortlistRes.ok) {
          const data = await shortlistRes.json();
          next.shortlisted = data.meta?.total ?? 0;
        }
        if (interestRes.ok) {
          const data = await interestRes.json();
          next.pendingReceived = data.pendingReceived ?? 0;
          next.pendingSent = data.pendingSent ?? 0;
        }
        if (unreadRes.ok) {
          const data = await unreadRes.json();
          next.unreadNotifications = data.count ?? 0;
        }
        if (!cancelled) setCounts(next);
      } catch {
        // counts are a nice-to-have — silently keep previous values
      }
    }

    loadCounts();
    const interval = setInterval(loadCounts, 60_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isLoggedIn, pathname]);

  if (!isLoggedIn) {
    return (
      <>
        <Navbar />
        <main className="flex-grow flex items-center justify-center min-h-[50vh]">
          <p>Loading…</p>
        </main>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="flex-grow">
        <div className="container font-sans" style={{ padding: '32px 0 80px 0' }}>
          <nav
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              paddingBottom: '8px',
              marginBottom: '28px',
              borderBottom: '1px solid var(--border-color)',
            }}
          >
            {TABS.map((tab) => {
              const active = pathname.startsWith(tab.href);
              const count = tab.countKey ? counts[tab.countKey] : 0;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '10px 16px',
                    borderRadius: '10px 10px 0 0',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    color: active ? 'var(--deep-maroon)' : 'var(--text-muted)',
                    backgroundColor: active ? 'var(--soft-cream)' : 'transparent',
                    borderBottom: active ? '2px solid var(--gold-accent)' : '2px solid transparent',
                  }}
                >
                  <span>{tab.icon}</span>
                  {tab.label}
                  {count > 0 && (
                    <span
                      style={{
                        background: 'var(--deep-maroon)',
                        color: '#fff',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        minWidth: '18px',
                        height: '18px',
                        borderRadius: '9px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '0 4px',
                      }}
                    >
                      {count > 99 ? '99+' : count}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {children}
        </div>
      </main>
      <PremiumFooter onNavigate={(view) => router.push(`/${view === 'home' ? '' : view}`)} />
    </>
  );
}
