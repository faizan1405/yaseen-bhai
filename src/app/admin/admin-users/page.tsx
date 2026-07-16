'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { SectionHeading, FloralCorner } from '../../../components/NikahComponents';
import {
  ADMIN_ROLES,
  ADMIN_ROLE_LABELS,
  PERMISSION_CATALOGUE,
  RESOURCE_LABELS,
  ROLE_PERMISSIONS,
  permissionsForResource,
  type AdminRole,
  type Resource,
} from '../../../lib/permissions';

interface AdminRow {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  role: string;
  adminRole: AdminRole | null;
  effectiveRole: AdminRole;
  effectiveRoleLabel: string;
  isLegacyAdmin: boolean;
  customPermissions: string[];
  permissions: string[];
  active: boolean;
  createdBy: string | null;
  updatedBy: string | null;
  adminCreatedAt: string | null;
  adminUpdatedAt: string | null;
  lastLoginAt: string | null;
  accountCreatedAt: string | null;
  accountStatus: string;
}

const RESOURCES = Object.keys(PERMISSION_CATALOGUE) as Resource[];

function fmtDate(d: string | null): string {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date.getTime()) ? '—' : date.toLocaleString();
}

export default function AdminUsersPage() {
  const [admins, setAdmins] = useState<AdminRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Promote form
  const [promoteEmail, setPromoteEmail] = useState('');
  const [promoteRole, setPromoteRole] = useState<AdminRole>('SUPPORT_MANAGER');
  const [promoteBusy, setPromoteBusy] = useState(false);
  const [promoteMsg, setPromoteMsg] = useState('');

  // Manage modal
  const [selected, setSelected] = useState<AdminRow | null>(null);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const q = new URLSearchParams();
      if (search) q.set('search', search);
      if (roleFilter) q.set('role', roleFilter);
      if (statusFilter) q.set('status', statusFilter);
      const res = await fetch(`/api/admin/admin-users?${q}`);
      const data = await res.json();
      if (res.ok) {
        setAdmins(data.admins || []);
      } else {
        setError(data.error || 'Failed to load admin users.');
      }
    } catch {
      setError('Network error loading admin users.');
    } finally {
      setLoading(false);
    }
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const postAction = useCallback(async (payload: Record<string, unknown>): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/admin/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || 'Action failed.' };
      return { ok: true };
    } catch {
      return { ok: false, error: 'Network error.' };
    }
  }, []);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoteBusy(true);
    setPromoteMsg('');
    const result = await postAction({
      action: 'promote',
      email: promoteEmail.trim(),
      adminRole: promoteRole,
    });
    setPromoteBusy(false);
    if (result.ok) {
      setPromoteMsg('✓ User promoted to admin.');
      setPromoteEmail('');
      fetchAdmins();
      setTimeout(() => setPromoteMsg(''), 3000);
    } else {
      setPromoteMsg(result.error || 'Failed.');
    }
  };

  return (
    <div style={{ padding: '20px 0 60px' }} className="font-sans">
      <SectionHeading
        title="Admin-User Management"
        subtitle="Promote users, assign roles and granular permissions, and control admin access. Only Super Admins can manage other admins."
        scriptText="Administration"
      />

      {/* Promote a user to admin */}
      <div className="card-theme-wrapper" style={{ padding: '22px', marginBottom: '22px' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--gold-dark)', marginBottom: '6px', fontSize: '17px' }}>
          Promote an existing user to admin
        </h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '12.5px', marginBottom: '14px' }}>
          The person must have signed in with Google at least once. Promoting never
          creates a password — access stays on the existing Google login.
        </p>
        <form onSubmit={handlePromote} style={{ display: 'grid', gridTemplateColumns: '1fr 220px auto', gap: '12px', alignItems: 'end' }} className="grid-mobile-1">
          <div>
            <label className="form-label">User email</label>
            <input
              type="email"
              required
              className="form-control"
              placeholder="person@example.com"
              value={promoteEmail}
              onChange={(e) => setPromoteEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="form-label">Assign role</label>
            <select className="form-control" value={promoteRole} onChange={(e) => setPromoteRole(e.target.value as AdminRole)}>
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>{ADMIN_ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn btn-gold" disabled={promoteBusy} style={{ height: '42px', whiteSpace: 'nowrap' }}>
            {promoteBusy ? 'Promoting…' : '➕ Promote'}
          </button>
        </form>
        {promoteMsg && (
          <div style={{ marginTop: '10px', fontSize: '13px', color: promoteMsg.startsWith('✓') ? 'green' : 'var(--deep-maroon)' }}>
            {promoteMsg}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="card-theme-wrapper" style={{ padding: '18px', marginBottom: '20px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px 200px', gap: '12px' }} className="grid-mobile-1">
          <div>
            <label className="form-label">Search</label>
            <input type="text" className="form-control" placeholder="Name, email, role…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div>
            <label className="form-label">Role</label>
            <select className="form-control" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
              <option value="">All roles</option>
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>{ADMIN_ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label">Status</label>
            <select className="form-control" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Deactivated</option>
            </select>
          </div>
        </div>
        <div style={{ marginTop: '10px', fontSize: '12.5px', color: 'var(--text-muted)' }}>
          {loading ? 'Loading…' : `${admins.length} admin${admins.length === 1 ? '' : 's'}`}
        </div>
      </div>

      {error && (
        <div style={{ background: '#fee2e2', color: '#991b1b', padding: '12px 16px', borderRadius: '8px', marginBottom: '16px', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Admin table */}
      <div className="card-theme-wrapper" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>Loading admins…</div>
        ) : admins.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No admin users found.</div>
        ) : (
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '760px' }}>
              <thead>
                <tr style={{ background: 'var(--soft-cream)', borderBottom: '2px solid var(--border-color)', color: 'var(--deep-maroon)', fontWeight: 'bold', height: '44px' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Admin</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Role</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Last Login</th>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Created</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {admins.map((a) => (
                  <tr key={a.id} style={{ borderBottom: '1px solid var(--border-color)' }} className="table-row-hover">
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{a.name || '—'}</div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>{a.email}</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 9px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                        background: a.effectiveRole === 'SUPER_ADMIN' ? '#fce7f3' : '#e0e7ff',
                        color: a.effectiveRole === 'SUPER_ADMIN' ? '#9d174d' : '#3730a3',
                      }}>
                        {a.effectiveRoleLabel}
                      </span>
                      {a.isLegacyAdmin && (
                        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '3px' }}>legacy admin</div>
                      )}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <span style={{
                        display: 'inline-block', padding: '3px 9px', borderRadius: '10px', fontSize: '11px', fontWeight: 600,
                        background: a.active ? '#d1fae5' : '#f3f4f6', color: a.active ? '#065f46' : '#6b7280',
                      }}>
                        {a.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>{fmtDate(a.lastLoginAt)}</td>
                    <td style={{ padding: '12px', fontSize: '12px', color: 'var(--text-muted)' }}>
                      {fmtDate(a.adminCreatedAt)}
                      {a.createdBy && <div style={{ fontSize: '10.5px' }}>by {a.createdBy}</div>}
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>
                      <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '11px' }} onClick={() => setSelected(a)}>
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && (
        <ManageAdminModal
          admin={selected}
          onClose={() => setSelected(null)}
          onChanged={() => { fetchAdmins(); }}
          postAction={postAction}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Manage modal
// ---------------------------------------------------------------------------
function ManageAdminModal({
  admin,
  onClose,
  onChanged,
  postAction,
}: {
  admin: AdminRow;
  onClose: () => void;
  onChanged: () => void;
  postAction: (payload: Record<string, unknown>) => Promise<{ ok: boolean; error?: string }>;
}) {
  const [role, setRole] = useState<AdminRole>(admin.effectiveRole);
  // Editable permission set. Super Admin implicitly has all, so we only edit for
  // non-super roles. Start from custom overrides if present, else role defaults.
  const initialPerms = admin.customPermissions.length > 0
    ? admin.customPermissions
    : (ROLE_PERMISSIONS[admin.effectiveRole as Exclude<AdminRole, 'SUPER_ADMIN'>] ?? []);
  const [perms, setPerms] = useState<Set<string>>(new Set(initialPerms));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const isSuper = role === 'SUPER_ADMIN';

  const togglePerm = (key: string) => {
    setPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const loadRoleDefaults = () => {
    if (isSuper) return;
    setPerms(new Set(ROLE_PERMISSIONS[role as Exclude<AdminRole, 'SUPER_ADMIN'>] ?? []));
  };

  const run = async (payload: Record<string, unknown>, successMsg: string) => {
    setBusy(true);
    setMsg('');
    const result = await postAction({ userId: admin.id, ...payload });
    setBusy(false);
    if (result.ok) {
      setMsg('✓ ' + successMsg);
      onChanged();
      setTimeout(() => setMsg(''), 2500);
    } else {
      setMsg(result.error || 'Action failed.');
    }
  };

  const saveRole = () => run({ action: 'updateRole', adminRole: role }, 'Role updated.');
  const savePermissions = () => run({ action: 'updatePermissions', permissions: Array.from(perms) }, 'Permissions updated.');
  const toggleActive = () => run({ action: 'setActive', active: !admin.active }, admin.active ? 'Admin deactivated.' : 'Admin activated.');
  const removeAccess = () => {
    if (!confirm('Remove admin access for this user? Their normal account and data are kept — only admin rights are revoked.')) return;
    run({ action: 'removeAdmin' }, 'Admin access removed.');
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="card-theme-wrapper"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '720px', width: '96%', margin: '20px', padding: '32px', border: '2px solid var(--gold-accent)', position: 'relative', maxHeight: '92vh', overflowY: 'auto' }}
      >
        <FloralCorner position="tl" color="var(--gold-accent)" />
        <FloralCorner position="tr" color="var(--gold-accent)" />
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, fontSize: 24, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>×</button>

        <h3 style={{ fontFamily: 'var(--font-serif)', color: 'var(--deep-maroon)', fontSize: '21px', marginBottom: '4px' }}>
          Manage Admin — {admin.name || admin.email}
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginBottom: '18px' }}>{admin.email}</p>

        {msg && (
          <div style={{ background: msg.startsWith('✓') ? '#d1fae5' : '#fee2e2', color: msg.startsWith('✓') ? '#065f46' : '#991b1b', padding: '8px 14px', borderRadius: '8px', fontSize: '12.5px', marginBottom: '16px' }}>
            {msg}
          </div>
        )}

        {/* Account details */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 18px', marginBottom: '20px', fontSize: '12.5px' }} className="grid-mobile-1">
          <Detail label="Status" value={admin.active ? 'Active' : 'Deactivated'} />
          <Detail label="Last login" value={fmtDate(admin.lastLoginAt)} />
          <Detail label="Admin since" value={fmtDate(admin.adminCreatedAt)} />
          <Detail label="Account created" value={fmtDate(admin.accountCreatedAt)} />
          <Detail label="Created by" value={admin.createdBy || '—'} />
          <Detail label="Last modified by" value={admin.updatedBy || '—'} />
        </div>

        <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0 20px' }} />

        {/* Role */}
        <div style={{ marginBottom: '20px' }}>
          <label className="form-label">Admin Role</label>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'end', flexWrap: 'wrap' }}>
            <select
              className="form-control"
              style={{ maxWidth: '260px' }}
              value={role}
              onChange={(e) => { const r = e.target.value as AdminRole; setRole(r); if (r !== 'SUPER_ADMIN') setPerms(new Set(ROLE_PERMISSIONS[r as Exclude<AdminRole, 'SUPER_ADMIN'>] ?? [])); }}
            >
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>{ADMIN_ROLE_LABELS[r]}</option>
              ))}
            </select>
            <button className="btn btn-secondary" style={{ fontSize: '12px' }} disabled={busy || role === admin.effectiveRole} onClick={saveRole}>
              Save role
            </button>
          </div>
          {isSuper && (
            <p style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '6px' }}>
              Super Admin has full access to every section — individual permissions are not editable.
            </p>
          )}
        </div>

        {/* Permissions */}
        {!isSuper && (
          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label className="form-label" style={{ margin: 0 }}>Custom Permissions</label>
              <button className="btn btn-secondary" style={{ fontSize: '11px', padding: '4px 10px' }} onClick={loadRoleDefaults}>
                Reset to role defaults
              </button>
            </div>
            <div style={{ border: '1px solid var(--border-color)', borderRadius: '10px', padding: '12px', maxHeight: '280px', overflowY: 'auto' }}>
              {RESOURCES.map((resource) => (
                <div key={resource} style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--deep-maroon)', marginBottom: '5px' }}>
                    {RESOURCE_LABELS[resource]}
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px' }}>
                    {permissionsForResource(resource).map((permKey) => {
                      const action = permKey.split(':')[1];
                      return (
                        <label key={permKey} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', cursor: 'pointer' }}>
                          <input type="checkbox" checked={perms.has(permKey)} onChange={() => togglePerm(permKey)} />
                          {action}
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button className="btn btn-gold" style={{ fontSize: '12.5px', marginTop: '10px' }} disabled={busy} onClick={savePermissions}>
              💾 Save permissions
            </button>
          </div>
        )}

        <hr style={{ borderColor: 'var(--border-color)', margin: '4px 0 18px' }} />

        {/* Danger / access controls */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" style={{ fontSize: '12.5px', color: 'var(--deep-maroon)' }} disabled={busy} onClick={removeAccess}>
            🚫 Remove admin access
          </button>
          <button
            className="btn"
            style={{ fontSize: '12.5px', background: admin.active ? '#fee2e2' : '#d1fae5', color: admin.active ? '#991b1b' : '#065f46' }}
            disabled={busy}
            onClick={toggleActive}
          >
            {admin.active ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ fontSize: '10.5px', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block' }}>{label}</span>
      <span style={{ fontWeight: 600 }}>{value}</span>
    </div>
  );
}
