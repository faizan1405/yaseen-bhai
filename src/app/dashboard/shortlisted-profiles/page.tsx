'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardList } from '../../../hooks/useDashboardList';
import { DashboardCard, type DashboardListProfile } from '../../../components/dashboard/DashboardCard';
import { EmptyState } from '../../../components/dashboard/EmptyState';
import { LoadMoreButton } from '../../../components/dashboard/LoadMoreButton';

interface ShortlistItem {
  shortlistId: string;
  createdAt: string;
  profile: DashboardListProfile;
}

export default function ShortlistedProfilesPage() {
  const router = useRouter();
  const { items, loading, error, hasMore, total, loadMore, removeItem } = useDashboardList<ShortlistItem>(
    '/api/user/shortlist',
  );
  const [removingId, setRemovingId] = useState<string | null>(null);

  const handleRemove = async (shortlistId: string) => {
    setRemovingId(shortlistId);
    try {
      const res = await fetch('/api/user/shortlist', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ shortlistId }),
      });
      if (res.ok) {
        removeItem((item) => item.shortlistId === shortlistId);
      }
    } finally {
      setRemovingId(null);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--deep-maroon)', fontWeight: 700, margin: 0 }}>
          Shortlisted Profiles
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          {total > 0 ? `${total} profile${total === 1 ? '' : 's'} you've shortlisted.` : 'Profiles you shortlist will appear here.'}
        </p>
      </div>

      {error && <p style={{ color: 'red', fontSize: '13px' }}>{error}</p>}

      {!loading && items.length === 0 ? (
        <EmptyState
          icon="❤️"
          title="No shortlisted profiles yet"
          body="Tap the heart icon on a profile card to save it here for quick access later."
          actionHref="/search"
          actionLabel="Browse Profiles"
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {items.map((item) => (
              <DashboardCard
                key={item.shortlistId}
                profile={item.profile}
                metaLine={`Shortlisted ${new Date(item.createdAt).toLocaleDateString()}`}
                onView={item.profile.profileId ? () => router.push(`/search?profile=${item.profile.profileId}`) : undefined}
                onRemove={() => handleRemove(item.shortlistId)}
                removing={removingId === item.shortlistId}
              />
            ))}
          </div>
          <LoadMoreButton hasMore={hasMore} loading={loading} onClick={loadMore} />
        </>
      )}
    </div>
  );
}
