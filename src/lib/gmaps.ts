// src/lib/gmaps.ts
let loaderPromise: Promise<typeof google> | null = null;

declare global {
  interface Window {
    google: typeof google | undefined;
    // usaremos un callback temporal para saber cuándo cargó el script
    [key: string]: any;
  }
}

/**
 * Carga Google Maps JS API una sola vez y devuelve el objeto `google`.
 * Requiere VITE_GMAPS_KEY en tu .env
 */
export function loadGoogleMaps(): Promise<typeof google> {
  // Si ya existe google.maps, devolvemos directo
  if (typeof window !== 'undefined' && window.google && window.google.maps) {
    return Promise.resolve(window.google);
  }
  // Si ya hay una promesa en curso, reúsala
  if (loaderPromise) return loaderPromise;

  const key = import.meta.env.VITE_GMAPS_KEY;
  if (!key) {
    return Promise.reject(new Error('Falta VITE_GMAPS_KEY en .env'));
  }

  loaderPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const cbName = 'initGmaps_' + Math.random().toString(36).slice(2);

    (window as any)[cbName] = () => {
      try {
        delete (window as any)[cbName];
      } catch {}
      if (window.google) resolve(window.google);
      else reject(new Error('Google no quedó disponible'));
    };

    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=${cbName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error('Error cargando Google Maps JS API'));
    document.head.appendChild(script);
  });

  return loaderPromise;
}
