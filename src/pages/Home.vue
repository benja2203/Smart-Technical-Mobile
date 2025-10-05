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
                <ion-card-subtitle>{{ data.visitsToday.length }} asignadas</ion-card-subtitle>
              </ion-card-header>
              <ion-list v-if="data.visitsToday.length">
                <ion-item v-for="v in data.visitsToday" :key="v.id">
                  <ion-icon name="location-outline" slot="start" />
                  <ion-label>
                    <h3>{{ v.client }}</h3>
                    <p class="ion-text-wrap">{{ v.address }}</p>
                    <small>{{ formatDate(v.window_from) }} – {{ formatDate(v.window_to) }}</small>
                  </ion-label>
                  <ion-buttons slot="end">
                    <ion-button fill="clear" @click="openMaps(v)">
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
                <ion-button expand="block" fill="outline" disabled>Ruta óptima (próximamente)</ion-button>
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
                <ion-chip color="primary"><ion-label>Asignados: {{ data.day.assignedToday }}</ion-label></ion-chip>
                <ion-chip color="success" class="ion-margin-start"><ion-label>Resueltos: {{ data.day.resolvedToday }}</ion-label></ion-chip>
                <ion-chip color="warning" class="ion-margin-start"><ion-label>Pendientes: {{ data.day.pendingToday }}</ion-label></ion-chip>
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
              <ion-card-header><ion-card-title>Anuncios</ion-card-title></ion-card-header>
              <ion-list v-if="data.announcements?.length">
                <ion-item v-for="a in data.announcements" :key="a.id" lines="full">
                  <ion-icon name="megaphone-outline" slot="start"></ion-icon>
                  <ion-label>
                    <h3>{{ a.title }}</h3>
                    <p class="ion-text-wrap">{{ a.body }}</p>
                    <small class="ion-text-muted">{{ formatDate(a.created_at) }}</small>
                  </ion-label>
                </ion-item>
              </ion-list>
              <ion-card-content v-else>
                <p class="ion-text-muted">No hay anuncios por ahora.</p>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <!-- Vehículo asignado -->
          <ion-col size="12" size-md="6">
            <ion-card>
              <ion-card-header><ion-card-title>Vehículo asignado</ion-card-title></ion-card-header>
              <ion-card-content v-if="data.vehicle">
                <ion-item lines="none">
                  <ion-icon name="car-outline" slot="start"></ion-icon>
                  <ion-label>
                    <p>Patente</p><h2>{{ data.vehicle.plate }}</h2>
                    <p class="ion-margin-top">Modelo</p><h3>{{ data.vehicle.model }}</h3>
                  </ion-label>
                  <ion-badge :color="vehicleColor">{{ vehicleStatusLabel }}</ion-badge>
                </ion-item>
              </ion-card-content>
              <ion-card-content v-else>
                <p class="ion-text-muted">Sin vehículo asignado.</p>
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
} from '@ionic/vue';
import { ref, computed, onMounted } from 'vue';
import { fetchHomeData, type HomeData, type Visit } from '@/services/home';
import { formatDate } from '@/utils/format';

const loading = ref(true);
const data = ref<HomeData>({
  visitsToday: [],
  day: { assignedToday: 0, resolvedToday: 0, pendingToday: 0 },
  lastTicket: null, announcements: [], vehicle: null
});

const vehicleStatusLabel = computed(() => {
  switch (data.value.vehicle?.status) {
    case 'ok': return 'Disponible';
    case 'in_use': return 'En uso';
    case 'maintenance': return 'Mantención';
    default: return '—';
  }
});
const vehicleColor = computed(() => {
  switch (data.value.vehicle?.status) {
    case 'ok': return 'success';
    case 'in_use': return 'warning';
    case 'maintenance': return 'danger';
    default: return 'medium';
  }
});

function openMaps(v: Visit) {
  if (v.lat && v.lon) window.open(`https://www.google.com/maps/search/?api=1&query=${v.lat},${v.lon}`, '_blank');
  else window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(v.address)}`, '_blank');
}
function callContact(v: Visit) {
  if (v.contact_phone) window.location.href = `tel:${v.contact_phone}`;
}

onMounted(async () => {
  loading.value = true;
  try { data.value = await fetchHomeData(); }
  finally { loading.value = false; }
});
</script>
