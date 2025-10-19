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
import { nearestNeighbor, googleMapsUrl, type Point } from '@/services/routing'

const mapEl = ref<HTMLDivElement|null>(null)
let map: L.Map | null = null
let layerGroup: L.LayerGroup | null = null
const points = ref<Point[]>([])
const ordered = ref<Point[]>([])

onMounted(async () => {
  const home = await fetchHomeData()
  // Solo visitas con coordenadas
  points.value = (home.visitsToday || [])
    .filter(v => typeof v.lat === 'number' && typeof v.lon === 'number')
    .map(v => ({ id: v.id, lat: v.lat!, lon: v.lon!, label: v.client || v.address }))

  ordered.value = nearestNeighbor(points.value)

  // Init Leaflet
  map = L.map(mapEl.value!)
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap'
  }).addTo(map)
  layerGroup = L.layerGroup().addTo(map)

  if (points.value.length) {
    const bounds = L.latLngBounds(points.value.map(p => [p.lat, p.lon] as [number, number]))
    map.fitBounds(bounds, { padding: [24,24] })
  } else {
    map.setView([-33.45, -70.66], 12) // Santiago fallback
  }
  draw()
})

onBeforeUnmount(() => { if (map) { map.remove(); map = null } })

function draw() {
  if (!map || !layerGroup) return
  layerGroup.clearLayers()

  ordered.value.forEach((p, idx) => {
    const marker = L.marker([p.lat, p.lon], { title: p.label || `Punto ${idx+1}` })
    marker.bindPopup(`<b>${idx+1}. ${p.label ?? ''}</b>`)
    marker.addTo(layerGroup!)
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
