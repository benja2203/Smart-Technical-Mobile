import axios from 'axios';
import { trackEvent } from "@/services/metricsClient";

const baseURL = import.meta.env.VITE_API_URL;
const REFRESH_ENABLED = String(import.meta.env.VITE_REFRESH_ENABLED || 'true') === 'true';


export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false,
  headers: { Accept: 'application/json' },
  timeout: 15000
})

export function setAuth(token?: string | null) {
  if (token && token !== 'simple') {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
  } else {
    delete api.defaults.headers.common['Authorization']
  }
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


const instance = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE || "https://smarttechnical.up.railway.app",
});

// ⬇️ Agrega este interceptor
instance.interceptors.response.use(
  (res) => res,
  async (error) => {
    try {
      await trackEvent("api_error", {
        code: error?.response?.status,
        url: error?.config?.url,
        method: error?.config?.method,
      });
    } catch {}
    return Promise.reject(error);
  }
);

export default instance;
