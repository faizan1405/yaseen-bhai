'use client';

import React from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?: string;
  title: string;
  body: string;
  actionHref?: string;
  actionLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = '🌙', title, body, actionHref, actionLabel }) => (
  <div
    style={{
      maxWidth: '480px',
      margin: '48px auto',
      textAlign: 'center',
      padding: '44px 28px',
      background: 'var(--white)',
      borderRadius: '20px',
      border: '1px solid rgba(184,146,74,0.15)',
      boxShadow: '0 4px 24px rgba(4,120,87,0.06)',
    }}
  >
    <div style={{ fontSize: '42px', marginBottom: '14px' }}>{icon}</div>
    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '19px', color: 'var(--deep-maroon)', marginBottom: '8px', fontWeight: 700 }}>
      {title}
    </h3>
    <p style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.6, marginBottom: actionHref ? '22px' : 0 }}>{body}</p>
    {actionHref && actionLabel && (
      <Link
        href={actionHref}
        style={{
          display: 'inline-block',
          padding: '10px 22px',
          background: 'linear-gradient(135deg,var(--deep-maroon),var(--color-primary-dark))',
          color: '#fff',
          borderRadius: '10px',
          fontSize: '13px',
          fontWeight: 700,
          textDecoration: 'none',
        }}
      >
        {actionLabel}
      </Link>
    )}
  </div>
);

export default EmptyState;
