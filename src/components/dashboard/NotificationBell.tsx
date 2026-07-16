'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
}

const POLL_INTERVAL_MS = 45_000;

function isSafeInternalUrl(url: string | null): url is string {
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//');
}

export const NotificationBell: React.FC = () => {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count');
      if (res.ok) {
        const data = await res.json();
        setUnreadCount(data.count || 0);
      }
    } catch {
      // ignore — bell just keeps its last known count
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const openDropdown = async () => {
    const next = !open;
    setOpen(next);
    if (next) {
      setLoading(true);
      try {
        const res = await fetch('/api/notifications?pageSize=6');
        if (res.ok) {
          const data = await res.json();
          setItems(data.items || []);
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      setItems((prev) => prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
      try {
        await fetch(`/api/notifications/${item.id}`, { method: 'PATCH' });
      } catch {
        // best-effort — count will self-correct on next poll
      }
    }
    setOpen(false);
    if (isSafeInternalUrl(item.actionUrl)) {
      router.push(item.actionUrl);
    } else {
      router.push('/dashboard/notifications');
    }
  };

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        onClick={openDropdown}
        aria-label="Notifications"
        style={{
          position: 'relative',
          width: '38px',
          height: '38px',
          borderRadius: '50%',
          border: '1px solid var(--border-color)',
          background: 'var(--white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              background: 'var(--deep-maroon)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '0 4px',
            }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '8px',
            width: '320px',
            maxHeight: '420px',
            overflowY: 'auto',
            background: 'var(--white)',
            border: '1px solid var(--border-color)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-toast)',
            zIndex: 300,
          }}
        >
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)', fontWeight: 700, fontSize: '13.5px', color: 'var(--deep-maroon)' }}>
            Notifications
          </div>

          {loading ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>Loading…</div>
          ) : items.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: '13px', color: 'var(--text-muted)' }}>
              You&apos;re all caught up.
            </div>
          ) : (
            items.map((item) => (
              <button
                key={item.id}
                onClick={() => handleItemClick(item)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  padding: '12px 16px',
                  border: 'none',
                  borderBottom: '1px solid var(--border-color)',
                  background: item.isRead ? 'transparent' : 'var(--soft-cream)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-dark)' }}>{item.title}</div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{item.message}</div>
              </button>
            ))
          )}

          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            style={{
              display: 'block',
              textAlign: 'center',
              padding: '10px',
              fontSize: '12.5px',
              fontWeight: 700,
              color: 'var(--deep-maroon)',
              textDecoration: 'none',
            }}
          >
            View all notifications
          </Link>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
