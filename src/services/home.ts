// src/services/home.ts
export type Visit = {
  id: number;
  client: string;
  address: string;
  window_from: string; // inicio ventana
  window_to: string;   // fin ventana
  contact_phone?: string;
  lat?: number; lon?: number;
};

export type DaySummary = {
  assignedToday: number;
  resolvedToday: number;
  pendingToday: number;
};

export type TicketLite = { id: number; title: string; summary: string; created_at: string; };
export type Announcement = { id: number; title: string; body: string; created_at: string; };
export type VehicleAssigned = { plate: string; model: string; status: 'ok'|'maintenance'|'in_use'|'unknown' };

export type HomeData = {
  visitsToday: Visit[];        // << antes era "nextVisit": ahora lista
  day: DaySummary;
  lastTicket: TicketLite | null;
  announcements: Announcement[];
  vehicle: VehicleAssigned | null;
};

// Mock temporal
export async function fetchHomeData(): Promise<HomeData> {
  await new Promise(r => setTimeout(r, 300));
  return {
    visitsToday: [
      {
        id: 701, client: 'Ferretería Las Palmas',
        address: 'Av. Siempre Viva 123, Santiago',
        window_from: '2025-10-05T09:00:00Z', window_to: '2025-10-05T10:00:00Z',
        contact_phone: '+56 9 1111 1111', lat: -33.45, lon: -70.65
      },
      {
        id: 702, client: 'Colegio San Martín',
        address: 'Los Álamos 456, Maipú',
        window_from: '2025-10-05T11:30:00Z', window_to: '2025-10-05T12:30:00Z',
        contact_phone: '+56 9 2222 2222'
      },
      {
        id: 703, client: 'Clínica Central',
        address: 'Av. Providencia 2400, Providencia',
        window_from: '2025-10-05T15:00:00Z', window_to: '2025-10-05T16:00:00Z',
        contact_phone: '+56 2 2333 3333'
      }
    ],
    day: { assignedToday: 5, resolvedToday: 2, pendingToday: 3 },
    lastTicket: {
      id: 102, title: 'Impresora sin conexión',
      summary: 'Cliente reporta que la impresora deja de responder.',
      created_at: '2025-09-30T14:15:00Z',
    },
    announcements: [
      { id: 1, title: 'Corte programado', body: 'Mañana 09:00 mantenimiento de red.', created_at: '2025-09-29T18:00:00Z' },
    ],
    vehicle: { plate: 'AB-CD-12', model: 'Hyundai Creta 2022', status: 'in_use' },
  };
}

/* API (cuando esté lista)
import { api } from '@/api/axios';
export async function fetchHomeData(): Promise<HomeData> {
  const [visits, day, lastTicket, announcements, vehicle] = await Promise.all([
    api.get('/schedule/today').then(r => r.data.items ?? r.data),
    api.get('/tickets/summary/today').then(r => r.data),
    api.get('/tickets/last').then(r => r.data),
    api.get('/announcements?limit=3').then(r => r.data.items ?? r.data),
    api.get('/assignments/vehicle').then(r => r.data),
  ]);
  return { visitsToday: visits, day, lastTicket, announcements, vehicle };
}
*/
