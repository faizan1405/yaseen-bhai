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

interface ReceivedInterestItem {
  id: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN';
  message: string | null;
  sentAt: string;
  respondedAt: string | null;
  profile: DashboardListProfile;
}

export default function ReceivedInterestsPage() {
  const router = useRouter();
  const { items, loading, error, hasMore, total, loadMore, setItems } = useDashboardList<ReceivedInterestItem>(
    '/api/interests/received',
  );
  const [busyId, setBusyId] = useState<string | null>(null);

  const respond = async (id: string, action: 'ACCEPT' | 'REJECT') => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/interests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      if (res.ok) {
        const data = await res.json();
        setItems((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: data.interest.status, respondedAt: data.interest.respondedAt } : item)),
        );
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--deep-maroon)', fontWeight: 700, margin: 0 }}>
          Interests Received
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {total > 0 ? `${total} interest request${total === 1 ? '' : 's'} received.` : 'Interest requests from other members will appear here.'}
        </p>
      </div>

      {error && <p style={{ color: 'red', fontSize: '13px' }}>{error}</p>}

      {!loading && items.length === 0 ? (
        <EmptyState
          icon="📥"
          title="No interest requests received yet"
          body="When another member sends you an interest request, it will appear here."
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
                    Received {new Date(item.sentAt).toLocaleDateString()}
                  </div>
                  {item.message && (
                    <div style={{ fontSize: '12.5px', color: 'var(--text-dark)', marginTop: '4px', fontStyle: 'italic' }}>
                      &ldquo;{item.message}&rdquo;
                    </div>
                  )}
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
                    <>
                      <button
                        onClick={() => respond(item.id, 'ACCEPT')}
                        disabled={busyId === item.id}
                        className="btn btn-gold"
                        style={{ padding: '7px 14px', fontSize: '12px' }}
                      >
                        {busyId === item.id ? '…' : 'Accept'}
                      </button>
                      <button
                        onClick={() => respond(item.id, 'REJECT')}
                        disabled={busyId === item.id}
                        className="btn btn-secondary"
                        style={{ padding: '7px 14px', fontSize: '12px' }}
                      >
                        Decline
                      </button>
                    </>
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
