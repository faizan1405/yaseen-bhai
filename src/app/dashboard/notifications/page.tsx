'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDashboardList } from '../../../hooks/useDashboardList';
import { EmptyState } from '../../../components/dashboard/EmptyState';
import { LoadMoreButton } from '../../../components/dashboard/LoadMoreButton';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

function isSafeInternalUrl(url: string | null): url is string {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');
}

export default function NotificationsPage() {
  const router = useRouter();
  const { items, loading, error, hasMore, total, loadMore, setItems, removeItem } = useDashboardList<NotificationItem>(
    '/api/notifications',
  );
  const [markingAll, setMarkingAll] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const markAllRead = async () => {
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_ALL_READ' }),
      });
      if (res.ok) {
        setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
      }
    } finally {
      setMarkingAll(false);
    }
  };

  const openNotification = async (item: NotificationItem) => {
    if (!item.isRead) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      fetch(`/api/notifications/${item.id}`, { method: 'PATCH' }).catch(() => {});
    }
    if (isSafeInternalUrl(item.actionUrl)) {
      router.push(item.actionUrl);
    }
  };

  const dismiss = async (id: string) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/notifications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        removeItem((item) => item.id === id);
      }
    } finally {
      setBusyId(null);
    }
  };

  const hasUnread = items.some((item) => !item.isRead);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--deep-maroon)', fontWeight: 700, margin: 0 }}>
            Notifications
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {total > 0 ? `${total} notification${total === 1 ? '' : 's'}.` : 'Activity on your account will appear here.'}
          </p>
        </div>
        {hasUnread && (
          <button onClick={markAllRead} disabled={markingAll} className="btn btn-secondary" style={{ padding: '8px 18px', fontSize: '12.5px' }}>
            {markingAll ? 'Marking…' : 'Mark all as read'}
          </button>
        )}
      </div>

      {error && <p style={{ color: 'red', fontSize: '13px' }}>{error}</p>}

      {!loading && items.length === 0 ? (
        <EmptyState icon="🔔" title="No notifications yet" body="You're all caught up. Updates about your profile, interests and membership will show up here." />
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '12px',
                  background: item.isRead ? 'white' : 'var(--soft-cream)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  padding: '14px 16px',
                }}
              >
                <button
                  onClick={() => openNotification(item)}
                  style={{
                    flex: 1,
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: isSafeInternalUrl(item.actionUrl) ? 'pointer' : 'default',
                    padding: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!item.isRead && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--deep-maroon)', flexShrink: 0 }} />}
                    <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-dark)' }}>{item.title}</span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>{item.message}</p>
                  <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </button>
                <button
                  onClick={() => dismiss(item.id)}
                  disabled={busyId === item.id}
                  aria-label="Dismiss notification"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', color: 'var(--text-muted)', flexShrink: 0 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <LoadMoreButton hasMore={hasMore} loading={loading} onClick={loadMore} />
        </>
      )}
    </div>
  );
}
