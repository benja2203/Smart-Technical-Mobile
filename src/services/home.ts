// src/services/home.ts
import { api } from '@/api/axios';
import { useAuth } from '@/store/auth';

export type Visit = {
  id: number;
  client?: string;
  address: string;
  window_from: string;
  window_to: string;
  contact_phone?: string;
  lat?: number; lon?: number;
};

export type DaySummary = { assignedToday: number; resolvedToday: number; pendingToday: number; };
export type TicketLite = { id: number; title: string; summary: string; created_at: string; };
export type Announcement = { id: number; title: string; body: string; created_at: string; };
export type VehicleAssigned = { plate: string; model: string; status: 'ok'|'maintenance'|'in_use'|'unknown' };

export type HomeData = {
  visitsToday: Visit[];
  day: DaySummary;
  lastTicket: TicketLite | null;
  announcements: Announcement[];
  vehicle: VehicleAssigned | null;
};

export async function fetchHomeData(): Promise<HomeData> {
  const auth = useAuth();
  const userId = auth.user?.id;

  const [visits, day, lastTicket, announcements, vehicle] = await Promise.all([
    api.get('/schedule/today',         { params: { user_id: userId } }).then(r => r.data),
    api.get('/schedule/summary/today', { params: { user_id: userId } }).then(r => r.data),
    api.get('/schedule/last',          { params: { user_id: userId } }).then(r => r.data),
    api.get('/announcements',          { params: { limit: 3 } }).then(r => r.data),
    api.get('/assignments/vehicle',    { params: { user_id: userId } }).then(r => r.data),
  ]);

  return { visitsToday: visits, day, lastTicket, announcements, vehicle };
}
