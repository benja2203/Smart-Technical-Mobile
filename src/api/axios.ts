import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL;
const REFRESH_ENABLED = String(import.meta.env.VITE_REFRESH_ENABLED || 'true') === 'true';

export const api = axios.create({
  baseURL,
  timeout: 12000,
});

export function setAuth(token?: string) {
  if (token) api.defaults.headers.common.Authorization = `Bearer ${token}`;
  else delete api.defaults.headers.common.Authorization;
}

let refreshing = false;

api.interceptors.response.use(
  r => r,
  async (err) => {
    const original: any = err.config;
    if (!REFRESH_ENABLED) return Promise.reject(err);

    if (err.response?.status === 401 && !original?._retry) {
      const rt = localStorage.getItem('refresh_token');
      if (!rt) return Promise.reject(err);
      if (!refreshing) {
        refreshing = true;
        try {
          const { data } = await axios.post(`${baseURL}/auth/refresh`, { refresh_token: rt });
          const at = data.access_token || data.token || data.access;
          const newRt = data.refresh_token || rt;
          if (!at) throw new Error('No access_token en refresh');
          localStorage.setItem('access_token', at);
          localStorage.setItem('refresh_token', newRt);
          setAuth(at);
        } catch {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        } finally { refreshing = false; }
      }
      original._retry = true;
      return api(original);
    }
    return Promise.reject(err);
  }
);
