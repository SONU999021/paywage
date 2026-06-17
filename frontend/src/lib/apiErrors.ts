import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
    if (!error.response) {
      return 'Unable to reach the server. Check your internet connection or try again later.';
    }
    const data = error.response.data as { error?: string; details?: { message: string }[] } | undefined;
    if (data?.details?.length) {
      return data.details.map((d) => d.message).join(', ');
    }
    if (data?.error) {
      return data.error;
    }
    if (error.response.status === 405) {
      return 'Request blocked (405 Method Not Allowed). The API URL may be misconfigured — ensure VITE_API_URL points to your Railway backend.';
    }
    if (error.response.status === 404) {
      return 'API endpoint not found. Check that the backend is deployed and VITE_API_URL is correct.';
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
