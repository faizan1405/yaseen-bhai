'use client';

import React from 'react';
import Image from 'next/image';
import { getProfileImage } from '../../lib/helpers';
import type { DashboardProfileCard } from '../../lib/dashboard/dashboardProfileCard';

export interface DashboardListProfile {
  profileId: string | null;
  userId: string;
  available: boolean;
  unavailableReason: 'deleted' | 'blocked' | 'unavailable' | null;
  fullName: string | null;
  age: number | null;
  gender: string | null;
  city: string | null;
  state: string | null;
  maritalStatus: string | null;
  profileImageUrl: string | null;
  verificationStatus: string | null;
  compatibilityScore: number | null;
  isLockedCategory: string | null;
}

interface DashboardCardProps {
  profile: DashboardListProfile | DashboardProfileCard;
  metaLine?: string;
  onView?: () => void;
  onRemove?: () => void;
  removeLabel?: string;
  removing?: boolean;
  extraActions?: React.ReactNode;
}

const cardStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '16px',
  boxShadow: 'var(--shadow-card)',
  border: '1px solid var(--border-color)',
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
};

export const DashboardCard: React.FC<DashboardCardProps> = ({
  profile,
  metaLine,
  onView,
  onRemove,
  removeLabel = 'Remove',
  removing = false,
  extraActions,
}) => {
  if (!profile.available) {
    return (
      <div style={{ ...cardStyle, padding: '24px', alignItems: 'center', textAlign: 'center', gap: '10px' }}>
        <span style={{ fontSize: '28px' }}>🚫</span>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
          This profile is no longer available.
        </p>
        {onRemove && (
          <button onClick={onRemove} disabled={removing} className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '12.5px' }}>
            {removing ? 'Removing…' : removeLabel}
          </button>
        )}
      </div>
    );
  }

  const imgSrc = profile.profileImageUrl || getProfileImage(profile.gender || 'female', 0);

  return (
    <div style={cardStyle}>
      <div style={{ position: 'relative', width: '100%', height: '220px', backgroundColor: 'var(--cream-bg)' }}>
        <Image src={imgSrc} alt={profile.fullName || 'Profile'} fill style={{ objectFit: 'cover' }} sizes="(max-width: 640px) 100vw, 320px" />
        {profile.compatibilityScore !== null && (
          <span
            style={{
              position: 'absolute',
              top: '10px',
              right: '10px',
              background: 'rgba(4,120,87,0.92)',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 10px',
              borderRadius: '20px',
            }}
          >
            {profile.compatibilityScore}% match
          </span>
        )}
        {profile.isLockedCategory && (
          <span
            style={{
              position: 'absolute',
              bottom: '10px',
              left: '10px',
              background: 'rgba(0,0,0,0.55)',
              color: '#fff',
              fontSize: '11px',
              fontWeight: 600,
              padding: '3px 10px',
              borderRadius: '20px',
            }}
          >
            🔒 Package required
          </span>
        )}
      </div>

      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', flexGrow: 1, gap: '6px' }}>
        <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '17px', fontWeight: 700, color: 'var(--deep-maroon)', margin: 0 }}>
          {profile.fullName}
        </h4>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
          {[profile.age ? `${profile.age} yrs` : null, profile.maritalStatus, [profile.city, profile.state].filter(Boolean).join(', ')]
            .filter(Boolean)
            .join(' · ')}
        </p>
        {metaLine && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>{metaLine}</p>
        )}

        <div style={{ marginTop: 'auto', paddingTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onView && (
            <button onClick={onView} className="btn btn-gold" style={{ flex: 1, padding: '8px 14px', fontSize: '12.5px' }}>
              View Profile
            </button>
          )}
          {onRemove && (
            <button
              onClick={onRemove}
              disabled={removing}
              className="btn btn-secondary"
              style={{ flex: 1, padding: '8px 14px', fontSize: '12.5px' }}
            >
              {removing ? '…' : removeLabel}
            </button>
          )}
          {extraActions}
        </div>
      </div>
    </div>
  );
};

export default DashboardCard;
