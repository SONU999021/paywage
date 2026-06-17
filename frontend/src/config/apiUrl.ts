/** Railway production API — direct calls (e.g. Railway-hosted frontend). */
export const PRODUCTION_API_URL = 'https://backend-production-fa482.up.railway.app/api';

function isLocalHost(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

function isVercelHost(hostname: string): boolean {
  return hostname.endsWith('.vercel.app');
}

function isMisconfiguredApiUrl(url: string): boolean {
  try {
    const parsed = new URL(url, window.location.origin);
    return (
      parsed.hostname.endsWith('.vercel.app') ||
      parsed.hostname === window.location.hostname
    );
  } catch {
    return url.startsWith('/');
  }
}

function shouldUseSameOriginProxy(hostname: string): boolean {
  if (isLocalHost(hostname) || isVercelHost(hostname)) {
    return true;
  }
  // Railway-hosted frontend (server.mjs proxies /api → backend)
  if (hostname.endsWith('.up.railway.app') && !hostname.startsWith('backend')) {
    return true;
  }
  return false;
}

/**
 * Resolve API base URL at runtime.
 * On Vercel/Railway frontend we use same-origin /api (proxied to Railway backend).
 */
export function resolveApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const { hostname } = window.location;

    if (shouldUseSameOriginProxy(hostname)) {
      return '/api';
    }
  }

  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) {
    const normalized = fromEnv.replace(/\/$/, '');

    if (typeof window !== 'undefined' && isMisconfiguredApiUrl(normalized)) {
      console.warn('[PayWager] VITE_API_URL points at the frontend; using /api proxy instead.');
      return '/api';
    }

    return normalized;
  }

  if (import.meta.env.PROD) {
    return PRODUCTION_API_URL;
  }

  return '/api';
}
