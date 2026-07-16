'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '../context/AppContext';
import { ADMIN_NAV_ITEMS, permissionListAllows } from '../lib/permissions';

const SECTION_ORDER = ['Operations', 'Content', 'Logs & Settings', 'Administration'] as const;

export const AdminSidebar: React.FC = () => {
  const pathname = usePathname();
  const { referralRate, setReferralRate, isAdminMobileOpen, setIsAdminMobileOpen, getRequestHeaders } = useApp();
  const [referralSaveState, setReferralSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const referralLoadedRef = useRef(false);

  // This admin's effective permissions — drives which nav sections/links are
  // shown. This is a UX convenience only; the real gate is server-side in
  // admin/layout.tsx and each API route, so hiding a link here never
  // substitutes for actual protection.
  const [permissions, setPermissions] = useState<string[] | null>(null);

  useEffect(() => {
    fetch('/api/admin/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setPermissions(data?.permissions ?? []))
      .catch(() => setPermissions([]));
  }, []);

  const can = (perm: string) => permissions === null || permissionListAllows(permissions, perm);

  // Load the persisted referral commission once, so the slider reflects the
  // saved database value across refreshes, restarts and deployments.
  useEffect(() => {
    if (referralLoadedRef.current) return;
    referralLoadedRef.current = true;
    fetch('/api/admin/settings', { headers: getRequestHeaders() })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        const saved = data?.settings?.referralCommissionPercent;
        if (typeof saved === 'number') setReferralRate(Math.round(saved));
      })
      .catch(() => { /* keep default until DB is reachable */ });
  }, [getRequestHeaders, setReferralRate]);

  // Persist the referral commission when the admin releases the slider.
  const saveReferralRate = async (value: number) => {
    setReferralSaveState('saving');
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: getRequestHeaders(),
        body: JSON.stringify({ referralCommissionPercent: value }),
      });
      setReferralSaveState(res.ok ? 'saved' : 'error');
    } catch {
      setReferralSaveState('error');
    }
    if (referralSaveState !== 'error') {
      setTimeout(() => setReferralSaveState('idle'), 2500);
    }
  };

  const handleLinkClick = () => {
    setIsAdminMobileOpen(false);
  };

  const visibleBySection = SECTION_ORDER.map((section) => ({
    section,
    items: ADMIN_NAV_ITEMS.filter((item) => item.section === section && can(item.perm)),
  })).filter((group) => group.items.length > 0);

  return (
    <aside className={`admin-nav-list ${isAdminMobileOpen ? 'open' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', paddingLeft: '12px' }}>
        <Image
          src="/images/rishte-forever-logo.png"
          alt="Asan Nikah"
          width={150}
          height={57}
          style={{ height: '36px', width: 'auto', background: 'var(--white)', padding: '6px 8px', borderRadius: '8px' }}
        />
        <span style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-accent)', fontSize: '16px', fontWeight: 'bold' }}>Admin</span>
      </div>

      {visibleBySection.map((group) => (
        <React.Fragment key={group.section}>
          <div className="admin-nav-section-title">{group.section}</div>
          {group.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`admin-nav-link ${pathname === item.href ? 'active' : ''}`}
              onClick={handleLinkClick}
            >
              {item.icon} {item.label}
            </Link>
          ))}
        </React.Fragment>
      ))}

      {can('referral:edit') && (
        <div style={{ marginTop: 'auto', borderTop: '1px solid rgba(212,163,89,0.3)', paddingTop: '20px', padding: '0 12px' }}>
          <h4 style={{ color: 'var(--gold-accent)', fontSize: '13px', marginBottom: '8px' }}>Referral Rate Control</h4>
          <input
            type="range"
            min="20"
            max="23"
            value={referralRate}
            onChange={(e) => setReferralRate(parseInt(e.target.value))}
            onMouseUp={(e) => saveReferralRate(parseInt((e.target as HTMLInputElement).value))}
            onTouchEnd={(e) => saveReferralRate(parseInt((e.target as HTMLInputElement).value))}
            style={{ width: '100%', accentColor: 'var(--gold-accent)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', marginTop: '6px' }}>
            <span>Commission:</span>
            <strong>{referralRate}%</strong>
          </div>
          <div style={{ fontSize: '10.5px', marginTop: '4px', minHeight: '14px', color: referralSaveState === 'error' ? '#e57373' : 'var(--gold-accent)' }}>
            {referralSaveState === 'saving' && 'Saving…'}
            {referralSaveState === 'saved' && '✓ Saved to database'}
            {referralSaveState === 'error' && 'Save failed — try again'}
          </div>
        </div>
      )}
    </aside>
  );
};

export default AdminSidebar;
