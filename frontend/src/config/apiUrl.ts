/**
 * API base URL resolution.
 * - Vercel: same-origin /api → serverless proxy (no CORS, no dead hardcoded domains)
 * - Local dev: /api → Vite proxy
 * - Railway frontend: /api → server.mjs proxy
 */
export function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;

    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.vercel.app') ||
      (hostname.endsWith('.up.railway.app') && !hostname.includes('backend'))
    ) {
      return '/api';
    }
  }

  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv && fromEnv !== '/api') {
    return fromEnv.replace(/\/$/, '');
  }

  return '/api';
}
