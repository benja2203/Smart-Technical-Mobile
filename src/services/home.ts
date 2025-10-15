// src/services/home.ts
import { api } from '@/api/axios'
import { useAuth } from '@/store/auth'
import { endpoints } from '@/config/api-map'
import type { Announcement } from '@/services/announcements'
import type { VehicleAssigned } from '@/services/vehicle'

// TIP: endpoints.announcements debe ser '/announcements'

export type Visit = {
  id: number
  client?: string
  address: string
  window_from: string
  window_to: string
  contact_phone?: string
  lat?: number
  lon?: number
}
export type DaySummary = { assignedToday: number; resolvedToday: number; pendingToday: number }
export type TicketLite = { id: number; title: string; summary: string; created_at: string }

export type HomeData = {
  visitsToday: Visit[]
  day: DaySummary
  lastTicket: TicketLite | null
  announcements: Announcement[]
  vehicle: VehicleAssigned | null
}

export async function fetchHomeData(): Promise<HomeData> {
  const auth = useAuth()
  const userId = auth.user?.id

  if (!userId) {
    return {
      visitsToday: [],
      day: { assignedToday: 0, resolvedToday: 0, pendingToday: 0 },
      lastTicket: null,
      announcements: [],
      vehicle: null
    }
  }

  const [visitsRes, dayRes, lastRes, annRes, vehRes] = await Promise.all([
    api.get(endpoints.scheduleToday,   { params: { user_id: userId } }).catch(() => ({ data: [] })),
    api.get(endpoints.scheduleSummary, { params: { user_id: userId } }).catch(() => ({ data: {} })),
    api.get(endpoints.scheduleLast,    { params: { user_id: userId } }).catch(() => ({ data: null })),
    api.get(endpoints.announcements,   { params: { limit: 3 } }).catch(() => ({ data: [] })), // ← usa /announcements
    api.get(endpoints.vehicleAssigned, { params: { user_id: userId } }).catch(() => ({ data: null })),
  ])

  // Normaliza anuncios del backend: title, description, created_at
  const annsRaw: any[] = Array.isArray(annRes.data) ? annRes.data : []
  const announcements: Announcement[] = annsRaw.map((a: any) => ({
    id: a.id,
    title: a.title ?? 'Sin título',
    body: a.description ?? '',                 // ← description → body
    created_at: a.created_at ?? a.createdAt ?? null,
  }))

  const vehicle = (vehRes.data ?? null) as VehicleAssigned | null

  const dayRaw = (dayRes.data ?? {}) as any
  const day: DaySummary = {
    assignedToday: Number(dayRaw.assignedToday ?? 0),
    resolvedToday: Number(dayRaw.resolvedToday ?? 0),
    pendingToday:  Number(dayRaw.pendingToday  ?? Math.max((dayRaw.assignedToday ?? 0) - (dayRaw.resolvedToday ?? 0), 0)),
  }

  return {
    visitsToday: (visitsRes.data ?? []) as Visit[],
    day,
    lastTicket: (lastRes.data ?? null) as TicketLite | null,
    announcements,
    vehicle
  }
}
