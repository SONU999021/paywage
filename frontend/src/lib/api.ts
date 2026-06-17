import axios from 'axios';
import { resolveApiBaseUrl } from '@/config/apiUrl';

export function getApiBaseUrl(): string {
  return resolveApiBaseUrl();
}

export const apiBaseUrl = getApiBaseUrl();

if (import.meta.env.DEV || import.meta.env.PROD) {
  console.info('[PayWager API] base URL:', apiBaseUrl);
}

const api = axios.create({
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  config.baseURL = getApiBaseUrl();
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error?.config;
    if (original && error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post(`${getApiBaseUrl()}/auth/refresh`, { refreshToken }, { timeout: 30000 });
          localStorage.setItem('accessToken', data.accessToken);
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
          return Promise.reject(error);
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
