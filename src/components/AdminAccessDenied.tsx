import React from 'react';
import Link from 'next/link';

/**
 * Access-denied state shown when an authenticated admin opens a section they
 * lack permission for. Rendered server-side by the admin layout so direct URL
 * access is blocked before any page code runs. No client hooks — safe to render
 * from a server component.
 */
export default function AdminAccessDenied({ section }: { section?: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '24px',
      }}
      className="font-sans"
    >
      <div
        className="card-theme-wrapper"
        style={{
          maxWidth: '460px',
          width: '100%',
          textAlign: 'center',
          padding: '40px 32px',
          border: '1.5px solid var(--gold-accent)',
        }}
      >
        <div style={{ fontSize: '44px', marginBottom: '12px' }}>🔒</div>
        <h1
          style={{
            fontFamily: 'var(--font-serif)',
            color: 'var(--deep-maroon)',
            fontSize: '22px',
            marginBottom: '10px',
          }}
        >
          Access Restricted
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: '22px' }}>
          Your admin role does not include access to{' '}
          <strong>{section || 'this section'}</strong>. If you believe you need
          access, please ask a Super Admin to update your permissions.
        </p>
        <Link href="/admin" className="btn btn-gold" style={{ fontSize: '13px' }}>
          ← Back to Overview
        </Link>
      </div>
    </div>
  );
}
