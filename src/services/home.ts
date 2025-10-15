// src/services/home.ts
import { api } from '@/api/axios'
import { useAuth } from '@/store/auth'
import { endpoints } from '@/config/api-map'

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

export async function fetchHomeData(): Promise<HomeData> {
  const auth = useAuth()
  const userId = auth.user?.id

  const [visits, day, lastTicket, announcements, vehicle] = await Promise.all([
    api.get(endpoints.scheduleToday,         { params: { user_id: userId } }).then(r => r.data),
    api.get(endpoints.scheduleSummary,       { params: { user_id: userId } }).then(r => r.data),
    api.get(endpoints.scheduleLast,          { params: { user_id: userId } }).then(r => r.data),
    api.get(endpoints.announcements,         { params: { limit: 3 } }).then(r => r.data),
    api.get(endpoints.vehicleAssigned,       { params: { user_id: userId } }).then(r => r.data),
  ])

  // Si tu backend devuelve otras claves, normaliza acá:
  const normDay: DaySummary = {
    assignedToday: day.assignedToday ?? day.assigned ?? 0,
    resolvedToday: day.resolvedToday ?? day.resolved ?? 0,
    pendingToday:  day.pendingToday  ?? day.pending  ?? 0
  }

  return {
    visitsToday: visits,
    day: normDay,
    lastTicket,
    announcements,
    vehicle
  }
}
