<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/tabs/home" />
        </ion-buttons>
        <ion-title>Ruta de hoy</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <!-- Mapa -->
      <div ref="mapEl" class="map"></div>

      <!-- FAB: abrir primer punto en GMaps nativo -->
      <ion-fab vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button @click="openGmaps" :disabled="ordered.length === 0">
          <ion-icon name="navigate-outline" />
        </ion-fab-button>
      </ion-fab>

      <!-- Opener cuando el panel está cerrado -->
      <div v-if="!sheetOpen" class="sheet-opener" @click="sheetOpen = true">
        <div class="opener-grabber"></div>
        <div class="opener-text">
          {{ ordered.length ? `Ver paradas (${ordered.length})` : 'Ver paradas' }}
        </div>
      </div>

      <!-- Panel inferior (bottom sheet simple, sin IonModal) -->
      <div class="route-sheet-panel" :class="{ open: sheetOpen }">
        <div class="sheet-content">
          <div class="sheet-grabber" @click="sheetOpen = !sheetOpen"></div>
          <div class="sheet-title">
            {{ ordered.length }} paradas programadas
          </div>

          <ion-list class="stops-list">
            <ion-item
              v-for="(v,i) in (ordered.length ? ordered : [])"
              :key="i"
              :detail="false"
              @click="focusStop(i)"
              :class="['stop-item', { 'is-last': i === ordered.length - 1 }]"
            >
              <ion-avatar slot="start" class="stop-avatar">
                <span>{{ i + 1 }}</span>
              </ion-avatar>

              <ion-label>
                <div class="stop-title">{{ v.client || 'Cliente' }}</div>
                <div class="stop-sub">
                  <ion-icon name="location-outline" style="margin-right:6px" />
                  {{ v.address || 'Sin dirección' }}
                </div>
                <div v-if="v.window_from || v.window_to" class="stop-time">
                  {{ fmtHour(v.window_from) }} – {{ fmtHour(v.window_to) }}
                </div>
              </ion-label>
            </ion-item>

            <div v-if="!ordered.length" class="empty">
              No hay paradas para hoy.
            </div>
          </ion-list>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonBackButton,
  IonContent, IonFab, IonFabButton, IonIcon, IonList, IonItem, IonLabel, IonAvatar
} from '@ionic/vue'
import { onMounted, onBeforeUnmount, ref } from 'vue'
import { loadGoogleMaps } from '@/lib/gmaps'
import { fetchHomeData, type Visit } from '@/services/home'

type GMap = google.maps.Map
type GMarker = google.maps.Marker
type GPolyline = google.maps.Polyline

/* UI */
const mapEl = ref<HTMLDivElement | null>(null)
const sheetOpen = ref(true) // abierto al entrar, pero ahora con scroll inmediato

/* Google Maps */
let map: GMap | null = null
let markers: GMarker[] = []
let dirService: google.maps.DirectionsService | null = null
let dirRenderer: google.maps.DirectionsRenderer | null = null
let polyMain: GPolyline | null = null
let polyShadow: GPolyline | null = null

/* datos */
const visits = ref<Visit[]>([])
const ordered = ref<Visit[]>([])
const legs = ref<{ durationText: string; distanceText: string }[]>([])

/* helpers */
function fmtHour(s?: string) {
  if (!s) return '–'
  const d = new Date(s)
  return isNaN(d.getTime()) ? '–' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function canOpen(v: Visit) {
  return (v.lat != null && v.lon != null) || !!v.address
}
function openGmaps() {
  if (!ordered.value.length) return
  const v = ordered.value[0]
  if (v.lat != null && v.lon != null) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lon}`, '_blank')
  } else if (v.address) {
    window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.address)}`, '_blank')
  }
}
function clearMap() {
  markers.forEach(m => m.setMap(null)); markers = []
  if (dirRenderer) dirRenderer.setMap(null); dirRenderer = null
  if (polyMain) { polyMain.setMap(null); polyMain = null }
  if (polyShadow) { polyShadow.setMap(null); polyShadow = null }
}
function markerBounce(m: GMarker | null, ms = 1100) {
  if (!m) return
  m.setAnimation(google.maps.Animation.BOUNCE)
  setTimeout(() => m.setAnimation(null), ms)
}
function placeMarker(pos: { lat: number; lng: number }, title?: string) {
  if (!map) return null
  const m = new google.maps.Marker({ position: pos, map, title })
  markers.push(m)
  return m
}
function focusStop(i: number) {
  const v = ordered.value[i]
  if (!v || !map) return
  const pos = { lat: v.lat!, lng: v.lon! }
  map.panTo(pos)
  markerBounce(markers[i])
  sheetOpen.value = true
}

onMounted(async () => {
  const g = await loadGoogleMaps()

  const home = await fetchHomeData()
  visits.value = (home.visitsToday || []).filter(canOpen)

  if (mapEl.value) {
    map = new g.maps.Map(mapEl.value, {
      center: { lat: -33.45, lng: -70.66 },
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      // 👉 mover el mapa con un solo dedo
      gestureHandling: 'greedy'
    })
  }

  clearMap()
  legs.value = []

  if (visits.value.length >= 2 && map) {
    dirService = new g.maps.DirectionsService()
    dirRenderer = new g.maps.DirectionsRenderer({
      map,
      suppressMarkers: true,
      preserveViewport: false,
      polylineOptions: {
        strokeColor: '#3b82f6',
        strokeWeight: 6,
        strokeOpacity: 0.9
      }
    })

    const origin = { lat: visits.value[0].lat!, lng: visits.value[0].lon! }
    const destination = { lat: visits.value.at(-1)!.lat!, lng: visits.value.at(-1)!.lon! }
    const waypoints = visits.value.slice(1, -1).map(v => ({
      location: { lat: v.lat!, lng: v.lon! }, stopover: true
    }))

    dirService.route(
      {
        origin, destination, waypoints,
        travelMode: g.maps.TravelMode.DRIVING,
        optimizeWaypoints: true
      },
      (res: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
        if (status === g.maps.DirectionsStatus.OK && res) {
          dirRenderer!.setDirections(res)

          const wpOrder = res.routes[0]?.waypoint_order ?? []
          ordered.value = [visits.value[0], ...wpOrder.map(i => visits.value[i + 1]), visits.value.at(-1)!]

          legs.value = (res.routes[0]?.legs || []).map(l => ({
            durationText: l.duration?.text || '-',
            distanceText: l.distance?.text || '-'
          }))

          ordered.value.forEach((v, i) => {
            const m = placeMarker({ lat: v.lat!, lng: v.lon! }, v.client ?? v.address)
            m?.setLabel({ text: String(i + 1), color: '#fff', fontSize: '12px', fontWeight: '700' })
          })

          const path = res.routes[0]?.overview_path || []
          if (path.length && map) {
            polyShadow = new g.maps.Polyline({
              path, strokeColor: '#000', strokeOpacity: 0.25, strokeWeight: 10, map
            })
            polyMain = new g.maps.Polyline({
              path, strokeColor: '#2563eb', strokeOpacity: 1, strokeWeight: 6, map
            })
          }

          sheetOpen.value = true
        } else {
          ordered.value = visits.value.slice()
          ordered.value.forEach(v => placeMarker({ lat: v.lat!, lng: v.lon! }, v.client ?? v.address))
          sheetOpen.value = true
        }
      }
    )
  } else {
    ordered.value = visits.value.slice()
    ordered.value.forEach(v => placeMarker({ lat: v.lat!, lng: v.lon! }, v.client ?? v.address))
    sheetOpen.value = true
  }
})

onBeforeUnmount(clearMap)
</script>

<style scoped>
.map {
  height: calc(100vh - 56px);
}

/* ---- Opener flotante cuando el panel está cerrado ---- */
.sheet-opener {
  position: absolute;
  left: 50%;
  bottom: 12px;
  transform: translateX(-50%);
  background: var(--ion-background-color);
  border-radius: 14px;
  box-shadow: 0 6px 18px rgba(0,0,0,.26);
  padding: 8px 14px 10px;
  min-width: 180px;
  text-align: center;
  border: 1px solid rgba(255,255,255,.06);
  z-index: 5;
}
.opener-grabber {
  width: 36px; height: 4px; border-radius: 999px;
  background: rgba(255,255,255,.3);
  margin: 4px auto 6px;
}
.opener-text { font-size: 14px; font-weight: 600; opacity: .9; }

/* ---- Panel inferior fijo (bottom sheet simple) ---- */
.route-sheet-panel {
  position: absolute;
  left: 0; right: 0;
  bottom: 0;
  transform: translateY(65%);          /* cerrado por defecto */
  transition: transform .28s ease;
  z-index: 6;                          /* por encima del mapa */
}
.route-sheet-panel.open {
  transform: translateY(0);            /* abierto */
}
.sheet-content {
  background: var(--ion-background-color);
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -8px 24px rgba(0,0,0,.25);
  border: 1px solid rgba(255,255,255,.06);
  max-height: 70vh;
  overflow: auto;

  /* 👉 hace que el scroll vertical funcione al tiro */
  -webkit-overflow-scrolling: touch;
  touch-action: pan-y;
  overscroll-behavior: contain;

  padding: 10px 12px 16px 12px;
}
.sheet-grabber {
  width: 42px; height: 5px; border-radius: 999px;
  margin: 4px auto 10px;
  background: rgba(255,255,255,.22);
  border: 1px solid rgba(255,255,255,.08);
  cursor: pointer;
}
.sheet-title { text-align: center; font-weight: 600; opacity: .85; margin-bottom: 6px; }

.stops-list { margin-top: 4px; }
.stop-item { position: relative; --inner-padding-end: 8px; }

/* Línea vertical que une las paradas */
.stop-item::before {
  content: "";
  position: absolute;
  left: 30px;           /* centro del avatar */
  top: 42px;            /* arranca bajo el círculo */
  bottom: -14px;
  width: 2px;
  background: var(--ion-color-primary);
  opacity: .6;
}
.stop-item.is-last::before { display: none; }

/* Número dentro del círculo */
.stop-avatar {
  width: 28px; height: 28px; min-width: 28px; min-height: 28px;
  border: 2px solid var(--ion-color-primary);
  background: color-mix(in oklab, var(--ion-color-primary) 16%, transparent);
  display: grid; place-items: center;
  box-shadow: 0 2px 7px rgba(0,0,0,.25);
}
.stop-avatar span { font-size: 12px; font-weight: 700; color: var(--ion-color-primary-contrast); }

/* Textos */
.stop-title { font-weight: 600; margin-bottom: 2px; }
.stop-sub   { display: flex; align-items: center; gap: 4px; font-size: 12px; opacity: .8; margin-bottom: 2px; }
.stop-time  { font-size: 12px; opacity: .7; }

.empty {
  text-align: center;
  padding: 14px 0 6px;
  opacity: .7;
}
</style>
