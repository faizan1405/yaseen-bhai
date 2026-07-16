// =============================================================================
// Centralised admin audit logging.
//
// Writes to the existing AuditLog collection (extended with previousValue /
// newValue / ipAddress / userAgent). It NEVER stores secrets, passwords,
// payment signatures or identity documents — callers must pass already-safe,
// redacted values. Failures are swallowed so a logging outage can never block
// the underlying admin action, but they are reported to the server console.
// =============================================================================

import { prisma } from './db';
import { getValidObjectId, isFallbackAllowed, sanitizeErrorMessage, testDbConnection } from './profileStore';

// Keys that must never be persisted into audit metadata, even if a caller
// accidentally includes them. Matched case-insensitively against object keys.
const FORBIDDEN_KEYS = [
  'password', 'secret', 'token', 'signature', 'sig', 'apikey', 'api_key',
  'authorization', 'sessiontoken', 'session_state', 'refresh_token', 'access_token',
  'id_token', 'razorpaysignature', 'razorpay_signature', 'aadhaar', 'aadhar', 'pan',
  'cardnumber', 'cvv', 'iddocument', 'idproof',
];

function isForbiddenKey(key: string): boolean {
  const k = key.toLowerCase().replace(/[^a-z0-9]/g, '');
  return FORBIDDEN_KEYS.some((f) => k.includes(f.replace(/[^a-z0-9]/g, '')));
}

/** Recursively strip forbidden keys and cap size before persisting. */
export function sanitizeAuditValue(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  try {
    const redact = (v: unknown): unknown => {
      if (v === null || typeof v !== 'object') return v;
      if (Array.isArray(v)) return v.map(redact);
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
        out[k] = isForbiddenKey(k) ? '[redacted]' : redact(val);
      }
      return out;
    };
    const safe = typeof value === 'string' ? value : redact(value);
    const str = typeof safe === 'string' ? safe : JSON.stringify(safe);
    // Hard cap to keep audit rows small.
    return str.length > 4000 ? str.slice(0, 4000) + '…' : str;
  } catch {
    return null;
  }
}

export interface AdminAuditInput {
  actorUserId?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  metadata?: unknown;
  previousValue?: unknown;
  newValue?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Persist a single admin audit-log entry. Best-effort: never throws.
 * Returns true on success, false if it could not be written.
 */
export async function logAdminAction(input: AdminAuditInput): Promise<boolean> {
  const data = {
    actorUserId: input.actorUserId ? safeObjectId(input.actorUserId) : null,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId ?? null,
    metadata: input.metadata !== undefined ? sanitizeAuditValue(input.metadata) : null,
    previousValue: input.previousValue !== undefined ? sanitizeAuditValue(input.previousValue) : null,
    newValue: input.newValue !== undefined ? sanitizeAuditValue(input.newValue) : null,
    ipAddress: input.ipAddress ?? null,
    userAgent: input.userAgent ? input.userAgent.slice(0, 400) : null,
  };

  try {
    const isDb = await testDbConnection();
    if (isDb) {
      await prisma.auditLog.create({ data });
      return true;
    }
  } catch (e) {
    console.error('Failed to write admin audit log:', sanitizeErrorMessage(e instanceof Error ? e.message : String(e)));
  }

  // Fallback: mirror into the in-memory audit log so the Activity Logs view still
  // reflects the action when the database is unavailable (dev / fallback only).
  if (isFallbackAllowed()) {
    try {
      const g = globalThis as unknown as { inMemoryLogs?: Array<Record<string, unknown>> };
      if (Array.isArray(g.inMemoryLogs)) {
        g.inMemoryLogs.unshift({
          id: `log-${Date.now()}`,
          ...data,
          createdAt: new Date(),
        });
        return true;
      }
    } catch {
      /* ignore */
    }
  }
  return false;
}

// ObjectId coercion that never throws (mirrors profileStore.getValidObjectId but
// tolerant of non-hex actor ids such as "system").
function safeObjectId(id: string): string | null {
  try {
    return getValidObjectId(id);
  } catch {
    return null;
  }
}
