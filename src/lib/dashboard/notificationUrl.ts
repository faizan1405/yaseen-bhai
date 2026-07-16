/**
 * Notification `actionUrl` values are ultimately rendered as `<Link href=...>`
 * in the client. Since the title/message/actionUrl of a notification can
 * originate from data influenced by another user (e.g. a display name), the
 * URL is always re-validated server-side before being stored — never trust it
 * to already be safe just because the call site is internal.
 *
 * Only same-origin, relative paths are allowed: no `scheme://`, no
 * protocol-relative `//host` links, no backslashes (which some browsers treat
 * as path separators, enabling `/\evil.com` style tricks).
 */

const SAFE_RELATIVE_PATH_RE = /^\/(?!\/)[A-Za-z0-9\-_/.,?=&%#]*$/;
const MAX_URL_LENGTH = 300;

export function sanitizeActionUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_URL_LENGTH) return null;
  if (trimmed.includes('://') || trimmed.includes('\\')) return null;
  if (!SAFE_RELATIVE_PATH_RE.test(trimmed)) return null;
  return trimmed;
}
