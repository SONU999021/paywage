import axios from 'axios';
import { resolveApiBaseUrl } from '@/config/apiUrl';

export const apiBaseUrl = resolveApiBaseUrl();

if (import.meta.env.DEV || import.meta.env.PROD) {
  console.info('[PayWager API] base URL:', apiBaseUrl);
}

const api = axios.create({
  baseURL: apiBaseUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
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
          const { data } = await axios.post(`${apiBaseUrl}/auth/refresh`, { refreshToken }, { timeout: 30000 });
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
