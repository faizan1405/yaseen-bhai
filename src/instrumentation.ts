/**
 * Next.js instrumentation — runs once when a server instance boots, before it
 * handles any request. We use it to validate environment variables up front so
 * a misconfigured production deployment fails fast instead of erroring later
 * mid-request. See: node_modules/next/dist/docs/.../instrumentation.md
 */
export async function register() {
  // Env validation touches Node-only APIs; skip the Edge runtime pass.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;

  const { validateEnv } = await import('./lib/env');
  validateEnv();
}
