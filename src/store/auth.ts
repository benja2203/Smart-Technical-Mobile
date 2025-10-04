import { defineStore } from 'pinia';
import { api, setAuth } from '@/api/axios';

type User = { id: number; name?: string; full_name?: string; role?: string; email?: string };
const USERNAME_FIELD = (import.meta.env.VITE_AUTH_USERNAME_FIELD || 'email').toString();

export const useAuth = defineStore('auth', {
  state: () => ({
    user: null as User | null,
    access: localStorage.getItem('access_token') || '',
    refresh: localStorage.getItem('refresh_token') || '',
  }),
  actions: {
    async login(username: string, password: string) {
      const payload: any = { password };
      payload[USERNAME_FIELD] = username;

      const { data } = await api.post('/auth/login', payload);
      const at = data.access_token || data.token || data.access;
      const rt = data.refresh_token || '';
      if (!at) throw new Error('La API no devolvió access_token');

      this.access = at; this.refresh = rt;
      localStorage.setItem('access_token', this.access);
      if (rt) localStorage.setItem('refresh_token', this.refresh);
      setAuth(this.access);

      let me;
      try { me = await api.get('/me'); }
      catch { me = await api.get('/users/me'); } // alternativa común en FastAPI
      this.user = me.data;
    },
    boot() { if (this.access) setAuth(this.access); },
    logout() {
      this.user = null; this.access=''; this.refresh='';
      localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token');
      setAuth(undefined);
    }
  }
});
