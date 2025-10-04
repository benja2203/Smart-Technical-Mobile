<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Inicio</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Loading skeleton -->
      <div v-if="loading">
        <ion-skeleton-text animated style="height:120px"></ion-skeleton-text>
        <ion-skeleton-text animated class="ion-margin-top" style="height:120px"></ion-skeleton-text>
        <ion-skeleton-text animated class="ion-margin-top" style="height:120px"></ion-skeleton-text>
        <ion-skeleton-text animated class="ion-margin-top" style="height:120px"></ion-skeleton-text>
      </div>

      <ion-grid v-else>
        <ion-row class="ion-justify-content-center ion-align-items-stretch" >
          <!-- 1) Personal en línea -->
          <ion-col size="12" size-md="6">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Personal en línea</ion-card-title>
                <ion-card-subtitle>Técnicos conectados</ion-card-subtitle>
              </ion-card-header>
              <ion-card-content>
                <div class="kpi">
                  <div class="kpi-value">{{ data.summary.onlineStaff }}</div>
                  <div class="kpi-label">en línea</div>
                </div>

                <ion-chip color="primary" class="ion-margin-top">
                  <ion-icon name="car-outline"></ion-icon>
                  <ion-label>Vehículos ocupados: {{ data.summary.vehiclesUsed }}/{{ data.summary.vehiclesTotal }}</ion-label>
                </ion-chip>

                <ion-chip color="tertiary" class="ion-margin-start">
                  <ion-icon name="people-outline"></ion-icon>
                  <ion-label>En terreno: {{ data.summary.techsOnField }}/{{ data.summary.techsTotal }}</ion-label>
                </ion-chip>
              </ion-card-content>
            </ion-card>
          </ion-col>

          <!-- 2) Último ticket -->
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

          <!-- 3) Anuncios -->
          <ion-col size="12" size-md="6">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Anuncios</ion-card-title>
              </ion-card-header>
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

          <!-- 4) Vehículo asignado (en Inicio, no página aparte) -->
          <ion-col size="12" size-md="6">
            <ion-card>
              <ion-card-header>
                <ion-card-title>Vehículo asignado</ion-card-title>
              </ion-card-header>
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
  IonPage, IonHeader, IonToolbar, IonTitle, IonButtons, IonMenuButton,
  IonContent, IonGrid, IonRow, IonCol,
  IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent,
  IonChip, IonIcon, IonLabel, IonButton, IonList, IonItem, IonBadge, IonSkeletonText
} from '@ionic/vue';
import { ref, computed, onMounted } from 'vue';
import { fetchHomeData, type HomeData } from '@/services/home';
import { formatDate } from '@/utils/format';

const loading = ref(true);
const data = ref<HomeData>({
  summary: { onlineStaff: 0, techsOnField: 0, techsTotal: 0, vehiclesUsed: 0, vehiclesTotal: 0 },
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

onMounted(async () => {
  loading.value = true;
  try { data.value = await fetchHomeData(); }
  finally { loading.value = false; }
});
</script>

<style scoped>
.kpi { display: flex; align-items: baseline; gap: 10px; }
.kpi-value { font-size: 2.4rem; font-weight: 800; }
.kpi-label { color: var(--ion-color-medium); }
</style>
