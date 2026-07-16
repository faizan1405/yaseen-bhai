/**
 * Small, dependency-free helpers for working with MongoDB ObjectId strings.
 *
 * The user-dashboard features only ever write rows against REAL Mongo ObjectIds
 * that came from the authenticated session or from a profile that genuinely
 * exists in the database. Sample/fallback profiles carry non-ObjectId ids, so a
 * quick shape check lets the write services skip them instead of polluting the
 * collection with rows that reference nothing (see the "do not depend on the DB
 * fallback for writes" project rule).
 */

const OBJECT_ID_RE = /^[0-9a-fA-F]{24}$/;

/** True when `id` is a 24-character hex string (a real Mongo ObjectId). */
export function isRealObjectId(id: unknown): id is string {
  return typeof id === 'string' && OBJECT_ID_RE.test(id);
}
