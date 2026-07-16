'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '../../../context/AppContext';

interface Story {
  id: string;
  coupleNames: string;
  location: string | null;
  story: string;
  imageUrl: string | null;
  marriageDate: string | null;
  displayOrder: number;
  isFeatured: boolean;
  isPublished: boolean;
}

const emptyForm = {
  id: '',
  coupleNames: '',
  location: '',
  story: '',
  imageUrl: '',
  marriageDate: '',
  displayOrder: 0,
  isFeatured: false,
  isPublished: true,
};

export default function AdminSuccessStoriesPage() {
  const { getRequestHeaders } = useApp();
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...emptyForm });
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/admin/success-stories', { headers: getRequestHeaders() })
      .then((res) => res.json())
      .then((data) => setStories(Array.isArray(data.stories) ? data.stories : []))
      .catch(() => setStories([]))
      .finally(() => setLoading(false));
  }, [getRequestHeaders]);

  useEffect(() => { load(); }, [load]);

  const notify = (msg: string, type: 'success' | 'error') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 3500);
  };

  const resetForm = () => { setForm({ ...emptyForm }); setEditing(false); };

  const startEdit = (s: Story) => {
    setEditing(true);
    setForm({
      id: s.id,
      coupleNames: s.coupleNames,
      location: s.location || '',
      story: s.story,
      imageUrl: s.imageUrl || '',
      marriageDate: s.marriageDate ? new Date(s.marriageDate).toISOString().substring(0, 10) : '',
      displayOrder: s.displayOrder,
      isFeatured: s.isFeatured,
      isPublished: s.isPublished,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch('/api/admin/success-stories', {
        method,
        headers: getRequestHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        notify(editing ? 'Story updated.' : 'Story created.', 'success');
        resetForm();
        load();
      } else {
        notify(data.error || 'Save failed.', 'error');
      }
    } catch (err: any) {
      notify(err.message || 'Save failed.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const togglePublish = async (s: Story) => {
    try {
      const res = await fetch('/api/admin/success-stories', {
        method: 'PUT',
        headers: getRequestHeaders(),
        body: JSON.stringify({ ...s, isPublished: !s.isPublished }),
      });
      if (res.ok) { notify(!s.isPublished ? 'Published.' : 'Unpublished.', 'success'); load(); }
      else { const d = await res.json(); notify(d.error || 'Update failed.', 'error'); }
    } catch { notify('Update failed.', 'error'); }
  };

  const remove = async (s: Story) => {
    if (!confirm(`Delete the success story for "${s.coupleNames}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/success-stories?id=${encodeURIComponent(s.id)}`, {
        method: 'DELETE',
        headers: getRequestHeaders(),
      });
      if (res.ok) { notify('Story deleted.', 'success'); load(); }
      else { const d = await res.json(); notify(d.error || 'Delete failed.', 'error'); }
    } catch { notify('Delete failed.', 'error'); }
  };

  const input: React.CSSProperties = {
    width: '100%', padding: '9px 13px', border: '1.5px solid var(--border-color)',
    borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', background: 'var(--white)',
  };
  const label: React.CSSProperties = { display: 'block', fontSize: '12.5px', fontWeight: 'bold', color: 'var(--deep-maroon)', marginBottom: '6px' };

  return (
    <div style={{ paddingBottom: '60px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-dark)', marginBottom: '8px' }}>💍 Success Stories</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '14.5px', marginBottom: '24px' }}>
        Create and manage the couples featured on the public Success Stories page. Only <strong>published</strong> stories appear on the website.
      </p>

      {message && (
        <div style={{
          padding: '12px 18px', marginBottom: '20px', borderRadius: '8px', fontSize: '13.5px',
          backgroundColor: messageType === 'success' ? 'rgba(18,46,34,0.08)' : 'rgba(220,53,69,0.08)',
          color: messageType === 'success' ? '#155724' : '#dc3545',
          border: `1px solid ${messageType === 'success' ? 'rgba(18,46,34,0.2)' : 'rgba(220,53,69,0.2)'}`,
        }}>
          {messageType === 'success' ? '✅' : '⚠️'} {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card-theme-wrapper" style={{ marginBottom: '32px' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-dark)', marginBottom: '16px' }}>
          {editing ? 'Edit Story' : 'Add New Story'}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }} className="grid-mobile-1">
          <div>
            <label style={label}>Couple Names *</label>
            <input style={input} value={form.coupleNames} onChange={(e) => setForm({ ...form, coupleNames: e.target.value })} placeholder="Ahmed & Fatima" required />
          </div>
          <div>
            <label style={label}>Location</label>
            <input style={input} value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Mumbai, Maharashtra" />
          </div>
          <div>
            <label style={label}>Marriage Date</label>
            <input type="date" style={input} value={form.marriageDate} onChange={(e) => setForm({ ...form, marriageDate: e.target.value })} />
          </div>
          <div>
            <label style={label}>Display Order</label>
            <input type="number" style={input} value={form.displayOrder} onChange={(e) => setForm({ ...form, displayOrder: parseInt(e.target.value) || 0 })} />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={label}>Couple Photo URL (optional)</label>
            <input style={input} value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://...blob.vercel-storage.com/couple.jpg" />
          </div>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={label}>Story *</label>
            <textarea style={{ ...input, minHeight: '110px', resize: 'vertical' }} value={form.story} onChange={(e) => setForm({ ...form, story: e.target.value })} maxLength={4000} required />
          </div>
        </div>
        <div style={{ display: 'flex', gap: '24px', marginTop: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} />
            <span>Published</span>
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13.5px', cursor: 'pointer' }}>
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })} />
            <span>Featured</span>
          </label>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            {editing && <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>}
            <button type="submit" className="btn btn-gold" disabled={saving}>{saving ? 'Saving…' : editing ? 'Update Story' : 'Add Story'}</button>
          </div>
        </div>
      </form>

      <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-dark)', marginBottom: '12px' }}>All Stories ({stories.length})</h3>
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
      ) : stories.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>No stories yet. Add your first success story above.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {stories.map((s) => (
            <div key={s.id} className="card-theme-wrapper" style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: '240px' }}>
                <div style={{ fontWeight: 700, color: 'var(--deep-maroon)' }}>
                  {s.coupleNames}
                  {s.isFeatured && <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--gold-accent)' }}>★ Featured</span>}
                  <span style={{ marginLeft: 8, fontSize: 11, color: s.isPublished ? '#2e7d32' : '#b26a00' }}>
                    {s.isPublished ? '● Published' : '○ Draft'}
                  </span>
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--text-muted)', margin: '2px 0 6px' }}>
                  {s.location || '—'} · order {s.displayOrder}{s.marriageDate ? ` · ${new Date(s.marriageDate).toLocaleDateString()}` : ''}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-dark)' }}>{s.story.length > 160 ? s.story.slice(0, 160) + '…' : s.story}</div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => startEdit(s)}>Edit</button>
                <button className="btn btn-secondary" style={{ fontSize: 12, padding: '6px 12px' }} onClick={() => togglePublish(s)}>{s.isPublished ? 'Unpublish' : 'Publish'}</button>
                <button className="btn" style={{ fontSize: 12, padding: '6px 12px', color: '#dc3545', border: '1px solid #dc3545' }} onClick={() => remove(s)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
