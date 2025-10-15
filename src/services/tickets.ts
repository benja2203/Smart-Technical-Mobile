// src/services/tickets.ts
import { api } from '@/api/axios'
import { useAuth } from '@/store/auth'
import { endpoints } from '@/config/api-map'

export type Ticket = {
  id: number
  title: string
  description?: string
  status?: string
  priority?: string
  created_at: string
}

export async function fetchMyTickets(): Promise<Ticket[]> {
  const userId = useAuth().user?.id
  const { data } = await api.get(endpoints.ticketsMine, { params: { user_id: userId } })
  // Normalización opcional si los nombres difieren:
  return (data ?? []).map((t: any) => ({
    id: t.id,
    title: t.title ?? t.subject ?? 'Ticket',
    description: t.description ?? t.summary ?? '',
    status: t.status ?? t.state ?? '',
    priority: t.priority ?? '',
    created_at: t.created_at ?? t.createdAt ?? ''
  }))
}


export type TicketRow = {
  id: number
  title: string
  description?: string
  address?: string
  id_status?: number
  status?: string
  priority?: string
  fecha_realizar_servicio?: string
  fecha_termino_servicio?: string
  created_at?: string
}

// Filtros de estado soportados en la UI
export type TicketFilter = 'all' | 'active' | 'terminated'

export async function listMyTickets(filter: TicketFilter = 'all'): Promise<TicketRow[]> {
  const userId = useAuth().user?.id
  if (!userId) return []
  const params: any = { user_id: userId, limit: 100 }
  if (filter !== 'all') params.status = filter
  try {
    const { data } = await api.get('/tickets/mine', { params })
    return (data ?? []) as TicketRow[]
  } catch {
    return [] // no rompas el render
  }
}



export async function resolveTicket(id: number): Promise<TicketRow> {
  const { data } = await api.put(`/tickets/${id}/resolve`)
  return data as TicketRow
}
