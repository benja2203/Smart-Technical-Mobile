<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Inicio</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Loading -->
      <div v-if="loading">
        <ion-skeleton-text animated style="height:120px"></ion-skeleton-text>
        <ion-skeleton-text animated class="ion-margin-top" style="height:120px"></ion-skeleton-text>
        <ion-skeleton-text animated class="ion-margin-top" style="height:120px"></ion-skeleton-text>
        <ion-skeleton-text animated class="ion-margin-top" style="height:120px"></ion-skeleton-text>
      </div>

      <ion-grid v-else>
        <ion-row class="ion-justify-content-center ion-align-items-stretch">

          <!-- Visitas de hoy (lista) -->
          <ion-col size="12" size-md="6">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Visitas de hoy</ion-card-title>
                <ion-card-subtitle>{{ (data.visitsToday?.length || 0) }} asignadas</ion-card-subtitle>
              </ion-card-header>

              <ion-list v-if="data.visitsToday && data.visitsToday.length">
                <ion-item v-for="v in data.visitsToday" :key="v.id">
                  <ion-icon name="location-outline" slot="start" />
                  <ion-label>
                    <h3>{{ v.client || 'Cliente' }}</h3>
                    <p class="ion-text-wrap">{{ v.address || 'Sin dirección' }}</p>
                    <small>
                      {{ formatTime(v.window_from) }}
                      <span v-if="v.window_to"> – {{ formatTime(v.window_to) }}</span>
                    </small>
                  </ion-label>
                  <ion-buttons slot="end">
                    <ion-button fill="clear" @click="openMaps(v)" :disabled="!canOpenMaps(v)">
                      <ion-icon name="navigate-outline" slot="icon-only" />
                    </ion-button>
                    <ion-button v-if="v.contact_phone" fill="clear" @click="callContact(v)">
                      <ion-icon name="call-outline" slot="icon-only" />
                    </ion-button>
                  </ion-buttons>
                </ion-item>
              </ion-list>

              <ion-card-content v-else>
                <p class="ion-text-muted">No tienes visitas asignadas para hoy.</p>
              </ion-card-content>

              <!-- placeholder para futura IA/optimización -->
              <ion-card-content>
                <ion-button expand="block" fill="outline" router-link="/tabs/map">
                  Ver ruta sugerida
                </ion-button>

                <ion-button expand="block" fill="outline" router-link="/tabs/gmap">
                  Ver ruta (Google)
                </ion-button>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <!-- Mi jornada -->
          <ion-col size="12" size-md="6">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Mi jornada</ion-card-title>
                <ion-card-subtitle>Hoy</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <ion-chip color="success" class="ion-margin-start"><ion-label>Activos: {{ data.day.assignedToday }}</ion-label></ion-chip>
                <ion-chip color="warning" class="ion-margin-start"><ion-label>Terminados: {{ data.day.resolvedToday }}</ion-label></ion-chip>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <!-- Último ticket -->
          <ion-col size="12" size-md="6">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Último ticket reportado</ion-card-title>
                <ion-card-subtitle v-if="data.lastTicket">{{ formatDate(data.lastTicket.created_at) }}</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content v-if="data.lastTicket">
                <h3 class="ion-margin-bottom">#{{ data.lastTicket.id }} · {{ data.lastTicket.title }}</h3>
                <p class="ion-text-wrap">{{ data.lastTicket.summary }}</p>
                <ion-button class="ion-margin-top" size="small" router-link="/tabs/tickets">Ver</ion-button>
              </ion-card-content>
              <ion-card-content v-else>
                <p class="ion-text-muted">Sin tickets recientes.</p>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <!-- Anuncios -->
          <ion-col size="12" size-md="6">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Anuncios</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <div v-if="data.announcements?.length === 0">
                  No hay anuncios por ahora.
                </div>
                <div v-else class="space-y-2">
                  <div v-for="a in data.announcements" :key="a.id" style="margin-bottom: 8px;">
                    <div style="font-weight:600">{{ a.title }}</div>
                    <div style="font-size: 12px; opacity: .7">{{ formatDate(a.created_at) }}</div>
                    <div v-if="a.body" style="margin-top: 4px;">{{ a.body }}</div>
                    <br>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-col>


            <!-- Vehículo asignado -->
          <ion-col size="12" size-md="6">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Vehículo asignado</ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <div v-if="!data.vehicle">
                  Sin vehículo asignado.
                </div>
                <div v-else>
                  <div><strong>Patente:</strong> {{ data.vehicle.plate }}</div>
                  <div v-if="data.vehicle.model"><strong>Modelo:</strong> {{ data.vehicle.model }}</div>
                  <div v-if="data.vehicle.status"><strong>Estado:</strong> {{ vehicleStatus(data.vehicle.status) }}</div>
                </div>
              </ion-card-content>
            </ion-card>
          </ion-col>


        </ion-row>
      </ion-grid>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton, IonContent,
  IonGrid, IonRow, IonCol, IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonButton, IonList, IonItem, IonLabel, IonIcon, IonBadge, IonChip, IonSkeletonText
} from '@ionic/vue'
import { ref, computed, onMounted } from 'vue'
import { fetchHomeData, type HomeData, type Visit } from '@/services/home'
import { useAuth } from '@/store/auth'
import { watch } from 'vue'


const loading = ref(true)
const data = ref<HomeData>({
  visitsToday: [],
  day: { assignedToday: 0, resolvedToday: 0, pendingToday: 0 },
  lastTicket: null, announcements: [], vehicle: null
})

const vehicleStatusLabel = computed(() => {
  switch (data.value.vehicle?.status) {
    case 'ok': return 'Disponible'
    case 'in_use': return 'En uso'
    case 'maintenance': return 'Mantención'
    default: return '—'
  }
})
const vehicleColor = computed(() => {
  switch (data.value.vehicle?.status) {
    case 'ok': return 'success'
    case 'in_use': return 'warning'
    case 'maintenance': return 'danger'
    default: return 'medium'
  }
})



// ---- helpers para Visitas ----
const formatTime = (val?: string | Date | null) => {
  if (!val) return '—'
  const d = typeof val === 'string' ? new Date(val) : val
  if (!d || isNaN(d.getTime())) return '—'
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
const canOpenMaps = (v: Visit) =>
  Boolean((v.lat != null && v.lon != null) || v.address)

function openMaps(v: Visit) {
  let url = ''
  if (v.lat != null && v.lon != null) {
    url = `https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lon}`
  } else if (v.address) {
    url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.address)}`
  }
  if (url) window.open(url, '_blank', 'noopener')
}
function callContact(v: Visit) {
  if (v.contact_phone) window.location.href = `tel:${v.contact_phone}`
}
function formatDate(s?: string) {
  if (!s) return ''
  const d = new Date(s)
  return isNaN(d.getTime()) ? '' : d.toLocaleString()
}

function vehicleStatus(s?: string) {
  const v = (s || '').toLowerCase()
  if (v === 'ok') return 'OK'
  if (v === 'maintenance') return 'En mantención'
  if (v === 'in_use') return 'En uso'
  return '—'
}

onMounted(() => {
  const auth = useAuth()
  auth.boot()
  const stop = watch(
    () => auth.user?.id,
    async (id) => {
      if (!id) return
      loading.value = true
      try { data.value = await fetchHomeData() }
      finally { loading.value = false }
      stop() // sólo una vez
    },
    { immediate: true }
  )
})
</script>
