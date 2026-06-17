/** Railway production API — used when VITE_API_URL is not set at build time. */
export const PRODUCTION_API_URL = 'https://backend-production-fa482.up.railway.app/api';

export function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  if (import.meta.env.PROD) {
    console.warn(
      '[PayWager] VITE_API_URL is not set. Using production Railway API. ' +
        'Set VITE_API_URL in Vercel → Settings → Environment Variables.',
    );
    return PRODUCTION_API_URL;
  }
  return '/api';
}
