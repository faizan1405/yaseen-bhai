'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardList } from '../../../hooks/useDashboardList';
import { DashboardCard, type DashboardListProfile } from '../../../components/dashboard/DashboardCard';
import { EmptyState } from '../../../components/dashboard/EmptyState';
import { LoadMoreButton } from '../../../components/dashboard/LoadMoreButton';

interface ViewedProfileItem {
  viewId: string;
  viewCount: number;
  firstViewedAt: string;
  lastViewedAt: string;
  profile: DashboardListProfile;
}

function formatRelativeDate(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 30) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

export default function ViewedProfilesPage() {
  const router = useRouter();
  const { items, loading, error, hasMore, total, loadMore, reload, removeItem } = useDashboardList<ViewedProfileItem>(
    '/api/user/viewed-profiles',
  );
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const handleRemove = async (viewId: string) => {
    setRemovingId(viewId);
    try {
      const res = await fetch(`/api/user/viewed-profiles/${viewId}`, { method: 'DELETE' });
      if (res.ok) {
        removeItem((item) => item.viewId === viewId);
      }
    } finally {
      setRemovingId(null);
    }
  };

  const handleClearAll = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setClearing(true);
    try {
      const res = await fetch('/api/user/viewed-profiles', { method: 'DELETE' });
      if (res.ok) {
        reload();
      }
    } finally {
      setClearing(false);
      setConfirmClear(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--deep-maroon)', fontWeight: 700, margin: 0 }}>
            Viewed Profiles
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {total > 0 ? `${total} profile${total === 1 ? '' : 's'} you've viewed, most recent first.` : 'Profiles you open will appear here.'}
          </p>
        </div>
        {items.length > 0 && (
          <button onClick={handleClearAll} disabled={clearing} className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '12.5px' }}>
            {clearing ? 'Clearing…' : confirmClear ? 'Click again to confirm' : 'Clear history'}
          </button>
        )}
      </div>

      {error && <p style={{ color: 'red', fontSize: '13px' }}>{error}</p>}

      {!loading && items.length === 0 ? (
        <EmptyState
          icon="👁️"
          title="No viewed profiles yet"
          body="When you open another member's profile, it will show up here so you can find it again easily."
          actionHref="/search"
          actionLabel="Browse Profiles"
        />
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {items.map((item) => (
              <DashboardCard
                key={item.viewId}
                profile={item.profile}
                metaLine={`Viewed ${formatRelativeDate(item.lastViewedAt)}${item.viewCount > 1 ? ` · ${item.viewCount} times` : ''}`}
                onView={item.profile.profileId ? () => router.push(`/search?profile=${item.profile.profileId}`) : undefined}
                onRemove={() => handleRemove(item.viewId)}
                removing={removingId === item.viewId}
              />
            ))}
          </div>
          <LoadMoreButton hasMore={hasMore} loading={loading} onClick={loadMore} />
        </>
      )}
    </div>
  );
}
