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
    // El backend espera form-urlencoded: email + password
    const form = new URLSearchParams()
    form.append('email', username)
    form.append('password', password)

    const { data } = await api.post('/auth/login', form, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })

    // Token (tu API devuelve 'token' y 'token_type')
    const at: string = data?.token || ''
    if (!at) {
      throw new Error('Login sin token. Verifica la respuesta del backend.')
    }

    this.access = at
    this.refresh = null
    localStorage.setItem('access_token', at)
    localStorage.removeItem('refresh_token')
    setAuth(at) // Authorization: Bearer <token>

    // Usuario viene en la misma respuesta
    this.user = data?.user ?? null
    if (!this.user?.id) {
      // si no trae id, lo guardamos igual para pasar el guard, pero idealmente la API debe incluir id
      console.warn('La respuesta de login no incluye user.id')
    }
    localStorage.setItem('user', JSON.stringify(this.user))
  } catch (err: any) {
    console.error('Login error:', err?.response?.data ?? err.message)
    this.error =
      err?.response?.data?.detail ||
      err?.message ||
      'Credenciales inválidas o API no disponible.'
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
