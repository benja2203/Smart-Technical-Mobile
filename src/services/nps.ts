// src/services/nps.ts
import { api } from '@/api/axios'
import { useAuth } from '@/store/auth'

export interface NPSPayload {
  id_user: number
  id_customer: number
  id_ticket: number
  evaluation: number
}

export interface NPSResponse {
  id: number
  id_user: number
  id_customer: number
  id_ticket: number
  evaluation: number
}

/**
 * Envía una calificación NPS al backend
 * @param ticketId 
 * @param rating 
 * @param customerId 
 */
export async function submitNPSRating(
  ticketId: number,
  rating: number,
  customerId: number
): Promise<NPSResponse> {
  const userId = useAuth().user?.id
  
  if (!userId) {
    throw new Error('Usuario no autenticado')
  }

  // Validar que la calificación esté en el rango correcto
  if (rating < 1 || rating > 5) {
    throw new Error('La calificación debe estar entre 1 y 5')
  }

  const payload: NPSPayload = {
    id_user: userId,
    id_customer: customerId,
    id_ticket: ticketId,
    evaluation: rating
  }

  try {
    const { data } = await api.post<NPSResponse>('/nps/', payload)
    return data
  } catch (error: any) {
    console.error('Error al enviar NPS:', error)
    throw new Error(error?.response?.data?.detail || 'Error al enviar calificación')
  }
}

/**
    Convierte calificación de estrellas (1-5) a escala NPS (0-10)
 */
export function convertStarsToNPS(stars: number): number {
  // 1 estrella = 0-2 NPS (Detractor)
  // 2 estrellas = 3-5 NPS (Detractor)
  // 3 estrellas = 6-8 NPS (Pasivo)
  // 4 estrellas = 9 NPS (Promotor)
  // 5 estrellas = 10 NPS (Promotor)
  const mapping: { [key: number]: number } = {
    1: 2,
    2: 5,
    3: 7,
    4: 9,
    5: 10
  }
  return mapping[stars] || 0
}