// src/services/home.ts
export type HomeSummary = {
  onlineStaff: number;           // personal en línea
  techsOnField: number;          // técnicos en terreno (ocupados)
  techsTotal: number;            // total técnicos
  vehiclesUsed: number;          // vehículos ocupados
  vehiclesTotal: number;         // total vehículos
};

export type TicketLite = { id: number; title: string; summary: string; created_at: string; };

export type Announcement = { id: number; title: string; body: string; created_at: string; };

export type VehicleAssigned = { plate: string; model: string; status: 'ok' | 'maintenance' | 'in_use' | 'unknown'; };

export type HomeData = {
  summary: HomeSummary;
  lastTicket: TicketLite | null;
  announcements: Announcement[];
  vehicle: VehicleAssigned | null;
};

// 🚧 HOY: datos mock. MAÑANA: cambiaremos a llamar a tu API aquí.
export async function fetchHomeData(): Promise<HomeData> {
  // Simula retardo de red
  await new Promise(r => setTimeout(r, 400));

  return {
    summary: {
      onlineStaff: 2,
      techsOnField: 2,
      techsTotal: 5,
      vehiclesUsed: 2,
      vehiclesTotal: 5,
    },
    lastTicket: {
      id: 102,
      title: 'Impresora sin conexión',
      summary: 'Cliente reporta que la impresora deja de responder al enviar trabajos.',
      created_at: '2025-09-30T14:15:00Z',
    },
    announcements: [
      { id: 1, title: 'Corte programado', body: 'Mañana 09:00 mantenimiento de red.', created_at: '2025-09-29T18:00:00Z' },
      { id: 2, title: 'Entrega de EPP', body: 'Retirar en bodega esta semana.', created_at: '2025-09-28T09:30:00Z' },
    ],
    vehicle: {
      plate: 'AB-CD-12',
      model: 'Hyundai Creta 2022',
      status: 'in_use',
    },
  };
}

/* 👇 Cuando la API esté lista, cambia por algo así:
import { api } from '@/api/axios';
export async function fetchHomeData(): Promise<HomeData> {
  const [summary, lastTicket, announcements, vehicle] = await Promise.all([
    api.get('/dashboard/summary').then(r => r.data),
    api.get('/tickets/last').then(r => r.data),
    api.get('/announcements?limit=3').then(r => r.data.items ?? r.data),
    api.get('/assignments/vehicle').then(r => r.data),
  ]);
  return { summary, lastTicket, announcements, vehicle };
}
*/
