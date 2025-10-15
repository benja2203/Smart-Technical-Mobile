// src/store/auth.ts
import { defineStore } from 'pinia'
import type { AxiosError } from 'axios'
import { api, setAuth } from '@/api/axios'

// Tomamos del .env el campo de login (email o username)
const USERNAME_FIELD = import.meta.env.VITE_AUTH_USERNAME_FIELD || 'email'

export type AuthUser = {
  id: number
  name?: string
  email?: string
  id_vehicle?: number | null
  // agrega otros campos que devuelva tu backend si quieres tiparlos
}

type State = {
  user: AuthUser | null
  access: string | null
  refresh: string | null
  loading: boolean
  error: string | null
}

export const useAuth = defineStore('auth', {
  state: (): State => ({
    user: null,
    access: null,
    refresh: null,
    loading: false,
    error: null
  }),

  actions: {
    // Lee sesión previa del localStorage al iniciar la app
    boot() {
      const at = localStorage.getItem('access_token')
      const rawUser = localStorage.getItem('user')

      if (at) {
        this.access = at
        const safe: string | undefined = at !== 'simple' ? at : undefined
        setAuth(safe) // Authorization solo si no es "simple"
      }

      if (rawUser) {
        try { this.user = JSON.parse(rawUser) } catch { this.user = null }
        if (this.user && !this.access) this.access = 'simple'
      }
    },

    async login(username: string, password: string) {
      this.loading = true
      this.error = null
      try {
        // Payload dinámico: { email: "...", password: "..." } o { username: "...", password: "..." }
        const payload: Record<string, string> = { password }
        payload[USERNAME_FIELD] = username

        const { data } = await api.post('/auth/login', payload)

        // Caso 1: backend entrega token (access_token | token | access)
        const at = (data?.access_token || data?.token || data?.access || '') as string
        const rt = (data?.refresh_token || '') as string

        if (at) {
          this.access = at
          this.refresh = rt || null
          localStorage.setItem('access_token', at)
          if (rt) localStorage.setItem('refresh_token', rt)
          setAuth(at) // Authorization: Bearer <token>
        } else {
          // Caso 2: backend NO entrega token → modo simple (sin Authorization)
          this.access = 'simple'
          this.refresh = null
          localStorage.setItem('access_token', this.access)
          localStorage.removeItem('refresh_token')
          setAuth(undefined) // no enviamos Authorization
        }

        // Usuario: si viene en /auth/login úsalo; si no, intenta /me o /users/me
        if (data?.user) {
          this.user = data.user as AuthUser
        } else {
          try {
            const me = await api.get('/me')
            this.user = me.data as AuthUser
          } catch {
            const me2 = await api.get('/users/me')
            this.user = me2.data as AuthUser
          }
        }

        localStorage.setItem('user', JSON.stringify(this.user))
      } catch (err) {
        const e = err as AxiosError<any>
        this.error = (e.response?.data as any)?.detail || e.message || 'Error de inicio de sesión'
        throw err
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.user = null
      this.access = null
      this.refresh = null
      localStorage.removeItem('user')
      localStorage.removeItem('access_token')
      localStorage.removeItem('refresh_token')
      setAuth(undefined)
    }
  }
})
