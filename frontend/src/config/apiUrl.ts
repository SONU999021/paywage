/** Railway production API — used for Vercel and direct production calls. */
export const PRODUCTION_API_URL = 'https://backend-production-fa482.up.railway.app/api';

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function isRailwayFrontend(hostname: string): boolean {
  return hostname.endsWith('.up.railway.app') && !hostname.includes('backend');
}

/**
 * Vercel cannot reliably proxy POST /api via static rewrites alone.
 * On Vercel we call Railway directly (backend CORS allows *.vercel.app).
 * Local dev and Railway-hosted frontend still use same-origin /api proxy.
 */
export function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;

    if (isLocalHost(hostname) || isRailwayFrontend(hostname)) {
      return '/api';
    }
  }

  return PRODUCTION_API_URL;
}
