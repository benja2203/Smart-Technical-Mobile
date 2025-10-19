<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <!-- Botón atrás con destino seguro (tabs/home) -->
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/tabs/home" text=""></ion-back-button>
        </ion-buttons>
        <ion-title>Ruta de hoy</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div ref="mapEl" style="height: calc(100vh - 56px);"></div>

      <!-- FABs -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="openGmaps" :disabled="ordered.length === 0" title="Navegar en Google Maps">
          <ion-icon name="navigate-outline" />
        </ion-fab-button>
        <ion-fab-button @click="recenter" title="Recentrar">
          <ion-icon name="locate-outline" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent,
  IonFab, IonFabButton, IonIcon
} from '@ionic/vue'
import * as L from 'leaflet'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { fetchHomeData } from '@/services/home'

// ---------- util ruteo simple (Nearest Neighbor) ----------
type Point = { id: number; lat: number; lon: number; label?: string }
const R = 6371e3
const hav = (a: Point, b: Point) => {
  const φ1 = a.lat*Math.PI/180, φ2 = b.lat*Math.PI/180
  const dφ = (b.lat-a.lat)*Math.PI/180, dλ = (b.lon-a.lon)*Math.PI/180
  const s = Math.sin(dφ/2)**2 + Math.cos(φ1)*Math.cos(φ2)*Math.sin(dλ/2)**2
  return 2*R*Math.asin(Math.sqrt(s))
}
function nearestNeighbor(pts: Point[]) {
  if (pts.length <= 1) return pts.slice()
  const rem = pts.slice()
  const route: Point[] = []
  let current = rem.shift()!
  route.push(current)
  while (rem.length) {
    let k = 0, best = Infinity
    for (let i=0;i<rem.length;i++) {
      const d = hav(current, rem[i])
      if (d < best) { best = d; k = i }
    }
    current = rem.splice(k,1)[0]
    route.push(current)
  }
  return route
}
function googleMapsUrl(points: Point[]) {
  if (!points.length) return ''
  const o = `${points[0].lat},${points[0].lon}`
  const d = `${points[points.length-1].lat},${points[points.length-1].lon}`
  const w = points.slice(1,-1).map(p => `${p.lat},${p.lon}`).join('|')
  const base = `https://www.google.com/maps/dir/?api=1&origin=${o}&destination=${d}`
  return w ? `${base}&waypoints=${encodeURIComponent(w)}&travelmode=driving` : `${base}&travelmode=driving`
}

// ---------- Leaflet setup ----------
const mapEl = ref<HTMLDivElement|null>(null)
let map: L.Map | null = null
let layerGroup: L.LayerGroup | null = null
let routeLayer: L.Polyline | null = null

const points = ref<Point[]>([])
const ordered = ref<Point[]>([])

// Fija íconos por defecto de Leaflet (evita pines invisibles en Vite)
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})
// @ts-ignore
L.Marker.prototype.options.icon = DefaultIcon

// Ícono numerado bonito (DivIcon)
function numberIcon(n: number) {
  return L.divIcon({
    className: 'num-marker',
    html: `<div class="num-badge">${n}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28]
  })
}

onMounted(async () => {
  // 1) Cargar visitas de hoy
  const home = await fetchHomeData()
  points.value = (home.visitsToday || [])
    .filter(v => typeof v.lat === 'number' && typeof v.lon === 'number')
    .map(v => ({ id: v.id, lat: v.lat!, lon: v.lon!, label: v.client || v.address }))
  ordered.value = nearestNeighbor(points.value)

  // 2) Inicializar mapa
  map = L.map(mapEl.value!)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(map)
  layerGroup = L.layerGroup().addTo(map)
  L.control.scale().addTo(map)

  if (points.value.length) {
    const bounds = L.latLngBounds(points.value.map(p => [p.lat, p.lon] as [number, number]))
    map.fitBounds(bounds, { padding: [24,24] })
  } else {
    map.setView([-33.45, -70.66], 12) // Santiago fallback
  }

  // 3) Pintar marcadores y ruta
  drawMarkers()
  await drawRouteOSRM() // intenta ruta por calles; si falla, deja fallback recto
})

onBeforeUnmount(() => { if (map) { map.remove(); map = null } })

function drawMarkers() {
  if (!map || !layerGroup) return
  layerGroup.clearLayers()

  ordered.value.forEach((p, i) => {
    const m = L.marker([p.lat, p.lon], {
      title: p.label || `Punto ${i+1}`,
      icon: numberIcon(i+1)
    })
    m.bindPopup(`
      <b>${i+1}. ${p.label ?? ''}</b><br/>
      <a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lon}" target="_blank" rel="noopener">
        Navegar aquí
      </a>
    `)
    m.addTo(layerGroup!)
  })
}

async function drawRouteOSRM() {
  if (!map || ordered.value.length < 2) return

  // limpia línea anterior
  if (routeLayer) { routeLayer.remove(); routeLayer = null }

  const coords = ordered.value.map(p => `${p.lon},${p.lat}`).join(';')
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`
  try {
    const res = await fetch(url)
    const data = await res.json()
    const line = data?.routes?.[0]?.geometry?.coordinates || []
    if (line.length) {
      const latlngs = line.map((c: [number, number]) => [c[1], c[0]]) as L.LatLngExpression[]
      routeLayer = L.polyline(latlngs)
      routeLayer.addTo(layerGroup!)
      return
    }
    // si no trae geometry, cae a recta
    drawStraight()
  } catch {
    drawStraight()
  }
}

function drawStraight() {
  if (!map || !layerGroup || ordered.value.length < 2) return
  if (routeLayer) { routeLayer.remove(); routeLayer = null }
  const latlngs = ordered.value.map(p => [p.lat, p.lon]) as L.LatLngExpression[]
  routeLayer = L.polyline(latlngs)
  routeLayer.addTo(layerGroup!)
}

function recenter() {
  if (!map) return
  if (points.value.length) {
    const bounds = L.latLngBounds(points.value.map(p => [p.lat, p.lon] as [number, number]))
    map.fitBounds(bounds, { padding: [24,24] })
  } else {
    map.setView([-33.45, -70.66], 12)
  }
}

function openGmaps() {
  const url = googleMapsUrl(ordered.value)
  if (url) window.open(url, '_blank', 'noopener')
}
</script>

<style scoped>
/* Badge numerado del marcador */
.num-marker {
  display: flex;
  align-items: center;
  justify-content: center;
}
.num-badge {
  width: 28px;
  height: 28px;
  line-height: 28px;
  border-radius: 50%;
  text-align: center;
  font-weight: 700;
  font-size: 13px;
  background: var(--ion-color-primary, #3880ff);
  color: white;
  box-shadow: 0 1px 6px rgba(0,0,0,.3);
  border: 2px solid white;
}
</style>
