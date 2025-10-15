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
