// src/services/location.ts
import { Geolocation } from "@capacitor/geolocation";
import api from "@/api/axios"; // 👈 IMPORT DEFAULT

export async function sendCurrentPosition(userId: number): Promise<void> {
  console.log("sendCurrentPosition() llamado con userId =", userId);

  const { coords } = await Geolocation.getCurrentPosition({
    enableHighAccuracy: true,
  });

  const payload = {
    user_id: userId,
    lat: coords.latitude,
    lng: coords.longitude,
  };

  console.log("Enviando payload a la API:", payload);

  await api.post("/technicians/location", payload);
}
