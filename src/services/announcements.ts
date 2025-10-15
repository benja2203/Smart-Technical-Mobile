import { api } from '@/api/axios'

export type Announcement = {
  id: number
  title: string
  body?: string
  created_at?: string
}

export async function fetchAnnouncements(limit = 3): Promise<Announcement[]> {
  const { data } = await api.get('/announcement', { params: { limit } })
  return (data ?? []) as Announcement[]
}
