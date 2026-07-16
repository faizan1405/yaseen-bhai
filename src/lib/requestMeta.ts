// Neutral, dependency-free helper for extracting request metadata (IP, user
// agent) for audit logging and rate limiting. Deliberately has NO imports from
// `@/auth` or `@/lib/adminAuth` so it can be safely imported by both without
// creating a circular dependency (auth.ts needs this for the Credentials
// provider's rate limiting; adminAuth.ts needs it for audit logging).
export function getRequestMeta(req: Request): { ipAddress: string | null; userAgent: string | null } {
  try {
    const fwd = req.headers.get('x-forwarded-for');
    const ipAddress =
      (fwd ? fwd.split(',')[0].trim() : null) ||
      req.headers.get('x-real-ip') ||
      null;
    const userAgent = req.headers.get('user-agent') || null;
    return { ipAddress, userAgent };
  } catch {
    return { ipAddress: null, userAgent: null };
  }
}
