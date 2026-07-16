/**
 * Central environment-variable validation for Asan Nikah.
 *
 * SERVER-ONLY. This module is imported by `src/instrumentation.ts` (which runs
 * once when the server boots) and may be imported by server route handlers that
 * want a typed, validated view of the environment. Do NOT import it into a
 * client component — it inspects server secrets.
 *
 * Behaviour by environment:
 *  - Production runtime: missing/invalid CRITICAL vars throw and block startup
 *    (fail fast & safe) rather than run a half-configured site.
 *  - Development: the same problems only print warnings so local work is never
 *    blocked, and optional integrations (email, AI, uploads) warn clearly when
 *    they will silently fall back to mock/offline behaviour.
 *
 * The variable NAMES below are the exact names read elsewhere via `process.env`.
 */

type Severity = 'fatal' | 'warn';

const isProd = process.env.NODE_ENV === 'production';
// During `next build`, static generation may boot a server instance. We never
// want a missing secret to break the build itself — only the running server.
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';

// Substrings that indicate a value is still a placeholder, not a real secret.
const PLACEHOLDER_HINTS = [
  'dummy',
  'your-',
  'your_',
  'changeme',
  'change-me',
  'replace',
  'example',
  'placeholder',
  '<',
  'xxxx',
];

/** True when a value is empty, unset, or an obvious placeholder. */
function isPlaceholder(value?: string | null): boolean {
  if (!value) return true;
  const v = value.trim().toLowerCase();
  if (v === '') return true;
  return PLACEHOLDER_HINTS.some((hint) => v.includes(hint));
}

export interface EnvIssue {
  key: string;
  severity: Severity;
  message: string;
}

/**
 * Inspect the current environment and return every problem found, categorised
 * as `fatal` (must be fixed for production) or `warn` (degrades gracefully).
 */
export function collectEnvIssues(): EnvIssue[] {
  const issues: EnvIssue[] = [];

  const requireVar = (key: string, message: string) => {
    if (isPlaceholder(process.env[key])) {
      issues.push({ key, severity: 'fatal', message });
    }
  };

  const warnVar = (key: string, message: string) => {
    if (isPlaceholder(process.env[key])) {
      issues.push({ key, severity: 'warn', message });
    }
  };

  // --- Critical: database + authentication (fatal in production) -----------
  requireVar(
    'DATABASE_URL',
    'MongoDB connection string is missing — the app cannot reach the database.'
  );
  requireVar(
    'AUTH_SECRET',
    'Auth.js session secret is missing — generate one with: openssl rand -base64 32'
  );
  requireVar(
    'AUTH_GOOGLE_ID',
    'Google OAuth client ID is missing — Google sign-in (and admin access) will fail.'
  );
  requireVar(
    'AUTH_GOOGLE_SECRET',
    'Google OAuth client secret is missing — Google sign-in (and admin access) will fail.'
  );

  // --- Payments: Razorpay (fatal in production) ----------------------------
  const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
  const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
  if (isPlaceholder(razorpayKeyId) || isPlaceholder(razorpayKeySecret)) {
    issues.push({
      key: 'RAZORPAY_KEY_ID',
      severity: 'fatal',
      message: 'Razorpay live keys are missing — paid packages cannot be sold.',
    });
  } else if (isProd && razorpayKeyId!.startsWith('rzp_test_')) {
    // Guard: never let Razorpay TEST mode (sandbox / ₹1 test charges) run in
    // production. Live traffic must use rzp_live_ keys.
    issues.push({
      key: 'RAZORPAY_KEY_ID',
      severity: 'fatal',
      message:
        'Razorpay TEST keys (rzp_test_) detected in production. Use live keys (rzp_live_) so real payments are processed instead of ₹1 test-mode charges.',
    });
  }

  // The ₹1 test charge is force-disabled in production by the order route, but
  // flag a leftover RAZORPAY_TEST_MODE=true so operators notice and remove it.
  if (isProd && process.env.RAZORPAY_TEST_MODE === 'true') {
    issues.push({
      key: 'RAZORPAY_TEST_MODE',
      severity: 'warn',
      message:
        'Set to "true" in production — the ₹1 test charge is ignored in prod, but unset this variable to avoid confusion.',
    });
  }

  // Razorpay webhook secret authenticates server-to-server payment callbacks.
  // Without it the webhook rejects everything; client-side verify still works,
  // so this is recommended-but-not-fatal.
  warnVar(
    'RAZORPAY_WEBHOOK_SECRET',
    'Not set — the Razorpay webhook rejects all callbacks; payments confirm only via the browser-side verify call.'
  );

  // --- Optional integrations (warn only — the app degrades gracefully) -----
  warnVar(
    'NEXT_PUBLIC_SITE_URL',
    'Not set — SEO metadata, sitemap.xml and robots.txt fall back to https://asannikah.com.'
  );
  warnVar(
    'RESEND_API_KEY',
    'Not set — transactional emails are mocked (logged to the console, not delivered).'
  );
  warnVar(
    'BLOB_READ_WRITE_TOKEN',
    'Not set — profile photo uploads (Vercel Blob) will be rejected.'
  );
  warnVar(
    'AI_CHATBOT_API_KEY',
    'Not set — the AI assistant serves built-in fallback answers instead of live AI replies.'
  );

  return issues;
}

/**
 * Validate the environment. Called once at server startup from
 * `src/instrumentation.ts`. Throws in production when critical variables are
 * missing/invalid; only warns in development and during the build phase.
 */
export function validateEnv(): void {
  const issues = collectEnvIssues();

  if (issues.length === 0) {
    console.info('[env] Environment variables validated — all good.');
    return;
  }

  const fatals = issues.filter((i) => i.severity === 'fatal');
  const warns = issues.filter((i) => i.severity === 'warn');

  for (const w of warns) {
    console.warn(`[env] ⚠ ${w.key}: ${w.message}`);
  }

  if (fatals.length > 0) {
    const lines = fatals.map((f) => `  ✖ ${f.key}: ${f.message}`).join('\n');

    if (isProd && !isBuildPhase) {
      // Fail fast & safe: block a misconfigured production server from booting.
      throw new Error(
        `[env] Missing or invalid critical environment variables:\n${lines}\n\n` +
          'Set these in your production environment and redeploy.'
      );
    }

    // Development / build: warn loudly but let the server boot.
    console.warn(
      `\n[env] The following CRITICAL variables are missing or use placeholders.\n` +
        `      This only warns in development — it will BLOCK startup in production:\n${lines}\n`
    );
  }
}
