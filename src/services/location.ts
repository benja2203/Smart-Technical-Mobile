// src/services/location.ts
import { Geolocation } from "@capacitor/geolocation";
import { api } from "@/api/axios";

export async function sendCurrentPosition(userId: number): Promise<void> {
  console.log("sendCurrentPosition() llamado con userId =", userId);

  const { coords } = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
  });

  const payload = {
    id_user: userId,
    address: null,
    latitude: coords.latitude,
    longitude: coords.longitude,
  };

  console.log("📍 Enviando payload a la API:", payload);

  try {
    // ✅ CORRECTO: /position (sin S, sin barra final)
    const response = await api.post("/positions/", payload);
    console.log("✅ Respuesta de la API:", response.data);
  } catch (error) {
    console.error("❌ Error al enviar posición:", error);
    throw error;
  }
}
