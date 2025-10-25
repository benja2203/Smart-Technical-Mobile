import axios from "axios";

const API_BASE = "https://smarttechnical.up.railway.app"; // tu backend

export async function trackEvent(type: string, meta?: Record<string, any>) {
  try {
    await axios.post(`${API_BASE}/telemetry/`, { type, meta });
  } catch (e) {
    // opcional: silenciar errores de telemetría
    console.warn("Telemetry error:", e);
  }
}
