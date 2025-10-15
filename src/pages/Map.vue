<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-back-button /></ion-buttons>
        <ion-title>Ruta de hoy</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content>
      <div ref="mapEl" style="height: calc(100vh - 56px);"></div>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="openGmaps" :disabled="ordered.length === 0">
          <ion-icon name="navigate-outline" />
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton, IonContent, IonFab, IonFabButton, IonIcon } from '@ionic/vue'
import * as L from 'leaflet'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { fetchHomeData } from '@/services/home'

// ---- ruteo simple (NN) ----
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
  const remaining = pts.slice()
  const route: Point[] = []
  let current = remaining.shift()!
  route.push(current)
  while (remaining.length) {
    let k = 0, best = Infinity
    for (let i=0;i<remaining.length;i++) {
      const d = hav(current, remaining[i])
      if (d < best) { best = d; k = i }
    }
    current = remaining.splice(k,1)[0]
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

// ---- mapa ----
const mapEl = ref<HTMLDivElement|null>(null)
let map: L.Map | null = null
let layerGroup: L.LayerGroup | null = null
const points = ref<Point[]>([])
const ordered = ref<Point[]>([])

// Fija los iconos por defecto de Leaflet (evita pines invisibles con Vite)
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

onMounted(async () => {
  const home = await fetchHomeData()
  points.value = (home.visitsToday || [])
    .filter(v => typeof v.lat === 'number' && typeof v.lon === 'number')
    .map(v => ({ id: v.id, lat: v.lat!, lon: v.lon!, label: v.client || v.address }))
  ordered.value = nearestNeighbor(points.value)

  map = L.map(mapEl.value!)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(map)
  layerGroup = L.layerGroup().addTo(map)

  if (points.value.length) {
    const bounds = L.latLngBounds(points.value.map(p => [p.lat, p.lon] as [number, number]))
    map.fitBounds(bounds, { padding: [24,24] })
  } else {
    map.setView([-33.45, -70.66], 12) // fallback
  }
  draw()
})

onBeforeUnmount(() => { if (map) { map.remove(); map = null } })

function draw() {
  if (!map || !layerGroup) return
  layerGroup.clearLayers()
  ordered.value.forEach((p, i) => {
    const m = L.marker([p.lat, p.lon], { title: p.label || `Punto ${i+1}` })
    m.bindPopup(`<b>${i+1}. ${p.label ?? ''}</b>`)
    m.addTo(layerGroup!)
  })
  if (ordered.value.length >= 2) {
    const latlngs = ordered.value.map(p => [p.lat, p.lon]) as L.LatLngExpression[]
    L.polyline(latlngs).addTo(layerGroup!)
  }
}

function openGmaps() {
  const url = googleMapsUrl(ordered.value)
  if (url) window.open(url, '_blank', 'noopener')
}
</script>
