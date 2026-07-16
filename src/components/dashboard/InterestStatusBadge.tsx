'use client';

import React from 'react';

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  PENDING: { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  ACCEPTED: { bg: '#d1fae5', color: '#065f46', label: 'Accepted' },
  REJECTED: { bg: '#fee2e2', color: '#991b1b', label: 'Declined' },
  WITHDRAWN: { bg: '#e5e7eb', color: '#374151', label: 'Withdrawn' },
};

export const InterestStatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES.PENDING;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '3px 10px',
        borderRadius: '20px',
        fontSize: '11.5px',
        fontWeight: 700,
        background: style.bg,
        color: style.color,
      }}
    >
      {style.label}
    </span>
  );
};

export default InterestStatusBadge;
