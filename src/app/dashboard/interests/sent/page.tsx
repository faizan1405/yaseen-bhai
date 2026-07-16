'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useDashboardList } from '../../../../hooks/useDashboardList';
import type { DashboardListProfile } from '../../../../components/dashboard/DashboardCard';
import { EmptyState } from '../../../../components/dashboard/EmptyState';
import { LoadMoreButton } from '../../../../components/dashboard/LoadMoreButton';
import { InterestStatusBadge } from '../../../../components/dashboard/InterestStatusBadge';
import { getProfileImage } from '../../../../lib/helpers';

interface SentInterestItem {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  message: string | null;
  sentAt: string;
  respondedAt: string | null;
  withdrawnAt: string | null;
  profile: DashboardListProfile;
}

export default function SentInterestsPage() {
  const router = useRouter();
  const { items, loading, error, hasMore, total, loadMore, setItems } = useDashboardList<SentInterestItem>(
    '/api/interests/sent',
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleWithdraw = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/interests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'WITHDRAW' }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) => prev.map((item) => (item.id === id ? { ...item, status: data.interest.status, withdrawnAt: data.interest.withdrawnAt } : item)));
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--deep-maroon)', fontWeight: 700, margin: 0 }}>
          Interests Sent
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {total > 0 ? `${total} interest request${total === 1 ? '' : 's'} you've sent.` : 'Interest requests you send will appear here.'}
        </p>
      </div>

      {error && <p style={{ color: 'red', fontSize: '13px' }}>{error}</p>}

      {!loading && items.length === 0 ? (
        <EmptyState
          icon="📤"
          title="No interest requests sent yet"
          body="When you send an interest request to a profile, you can track its status here."
          actionHref="/search"
          actionLabel="Browse Profiles"
        />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  background: 'white',
                  borderRadius: '14px',
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-card)',
                  padding: '14px 18px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ position: 'relative', width: '52px', height: '52px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, background: 'var(--cream-bg)' }}>
                  <Image
                    src={item.profile.profileImageUrl || getProfileImage(item.profile.gender || 'female', 0)}
                    alt={item.profile.fullName || 'Profile'}
                    fill
                    style={{ objectFit: 'cover' }}
                    sizes="52px"
                  />
                </div>
                <div style={{ flex: 1, minWidth: '160px' }}>
                  <div style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--deep-maroon)' }}>
                    {item.profile.available ? item.profile.fullName : 'Profile unavailable'}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Sent {new Date(item.sentAt).toLocaleDateString()}
                  </div>
                </div>
                <InterestStatusBadge status={item.status} />
                <div style={{ display: 'flex', gap: '8px' }}>
                  {item.profile.profileId && (
                    <button
                      onClick={() => router.push(`/search?profile=${item.profile.profileId}`)}
                      className="btn btn-secondary"
                      style={{ padding: '7px 14px', fontSize: '12px' }}
                    >
                      View
                    </button>
                  )}
                  {item.status === 'PENDING' && (
                    <button
                      onClick={() => handleWithdraw(item.id)}
                      disabled={busyId === item.id}
                      className="btn btn-secondary"
                      style={{ padding: '7px 14px', fontSize: '12px' }}
                    >
                      {busyId === item.id ? '…' : 'Withdraw'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
          <LoadMoreButton hasMore={hasMore} loading={loading} onClick={loadMore} />
        </>
      )}
    </div>
  );
}
