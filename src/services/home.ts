// src/services/home.ts
import { api } from '@/api/axios'
import { useAuth } from '@/store/auth'
import { endpoints } from '@/config/api-map'

// TIP: asegúrate que endpoints tenga:
// scheduleToday: '/schedule/today',
// scheduleSummary: '/schedule/summary/today',
// scheduleLast: '/schedule/last',
// announcements: '/announcement',
// vehicleAssigned: '/assignments/vehicle'

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
export type Announcement = { id: number; title: string; body: string; created_at: string }
export type VehicleAssigned = { plate: string; model: string; status: 'ok'|'maintenance'|'in_use'|'unknown' }

export type HomeData = {
  visitsToday: Visit[]
  day: DaySummary
  lastTicket: TicketLite | null
  announcements: Announcement[]
  vehicle: VehicleAssigned | null
}

function isValidId(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0
}

export async function fetchHomeData(): Promise<HomeData> {
  const auth = useAuth()
  const userId = auth.user?.id

  // Si no hay usuario aún, devuelve estructura vacía para no romper el render
  if (!isValidId(userId)) {
    return {
      visitsToday: [],
      day: { assignedToday: 0, resolvedToday: 0, pendingToday: 0 },
      lastTicket: null,
      announcements: [],
      vehicle: null
    }
  }

  const [
    visitsRes,
    dayRes,
    lastRes,
    annRes,
    vehRes
  ] = await Promise.all([
    api.get(endpoints.scheduleToday,   { params: { user_id: userId } }).catch(() => ({ data: [] })),
    api.get(endpoints.scheduleSummary, { params: { user_id: userId } }).catch(() => ({ data: {} })),
    api.get(endpoints.scheduleLast,    { params: { user_id: userId } }).catch(() => ({ data: null })),
    api.get(endpoints.announcements,   { params: { limit: 3 } }).catch(() => ({ data: [] })),
    api.get(endpoints.vehicleAssigned, { params: { user_id: userId } }).catch(() => ({ data: null }))
  ])

  const visits = (visitsRes.data ?? []) as Visit[]

  // Normaliza llaves por si el backend usa nombres distintos
  const dayRaw = (dayRes.data ?? {}) as any
  const day: DaySummary = {
    assignedToday: Number(dayRaw.assignedToday ?? dayRaw.assigned ?? 0),
    resolvedToday: Number(dayRaw.resolvedToday ?? dayRaw.resolved ?? 0),
    pendingToday:  Number(dayRaw.pendingToday  ?? dayRaw.pending  ?? 0)
  }

  const lastTicket = (lastRes.data ?? null) as TicketLite | null
  const announcements = (annRes.data ?? []) as Announcement[]
  const vehicle = (vehRes.data ?? null) as VehicleAssigned | null

  return { visitsToday: visits, day, lastTicket, announcements, vehicle }
}
