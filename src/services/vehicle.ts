import { api } from '@/api/axios'
import { useAuth } from '@/store/auth'

export type VehicleAssigned = {
  plate: string
  model?: string
  status?: 'ok' | 'maintenance' | 'in_use' | 'unknown' | string
}

export async function fetchAssignedVehicle(): Promise<VehicleAssigned | null> {
  const userId = useAuth().user?.id
  if (!userId) return null

  // ruta “oficial”
  try {
    const { data } = await api.get('/vehicle/assigned', { params: { user_id: userId } })
    return (data ?? null) as VehicleAssigned | null
  } catch {
    // fallback: si tu backend lo expone así
    try {
      const { data } = await api.get('/assignments/vehicle', { params: { user_id: userId } })
      return (data ?? null) as VehicleAssigned | null
    } catch {
      return null
    }
  }
}
