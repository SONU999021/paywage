import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }

    if (!error.response) {
      const base = error.config?.baseURL ?? '';
      const path = error.config?.url ?? '';
      const target = `${base}${path}`;

      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        if (base.startsWith('http')) {
          return `Cannot connect to API at ${base}. The Railway backend may be offline or the URL is wrong. In Railway → backend service → Settings → Networking, copy your public domain and set RAILWAY_API_URL on Vercel.`;
        }
        return `Cannot reach the API (${target || '/api'}). On Vercel, set RAILWAY_API_URL to your Railway backend URL (e.g. https://your-backend.up.railway.app) and redeploy.`;
      }

      return 'Unable to reach the server. Check your internet connection or try again later.';
    }

    const data = error.response.data as {
      error?: string;
      details?: { message: string }[];
    } | undefined;

    if (data?.details?.length) {
      return data.details.map((d) => d.message).join(', ');
    }
    if (data?.error) {
      return data.error;
    }
    if (error.response.status === 405) {
      return 'Request blocked (405). Hard-refresh (Ctrl+Shift+R) after redeploying the latest version.';
    }
    if (error.response.status === 404) {
      return 'API endpoint not found. Check that the backend is deployed and RAILWAY_API_URL is correct.';
    }
    if (error.response.status === 502) {
      return data?.error ?? 'Backend is unreachable. Verify your Railway backend is running and RAILWAY_API_URL on Vercel matches your Railway domain.';
    }
    if (error.response.status === 500) {
      return data?.error ?? 'Server configuration error. Set RAILWAY_API_URL on Vercel to your Railway backend URL.';
    }
    if (error.response.status === 409) {
      return 'This email or PAN is already registered.';
    }
    if (error.response.status >= 500) {
      return 'Server error. Please try again later.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
}
