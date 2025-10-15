<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Mis Tickets</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <!-- Filtros -->
      <ion-segment :value="filter" @ionChange="onFilterChange">
        <ion-segment-button value="all"><ion-label>Todos</ion-label></ion-segment-button>
        <ion-segment-button value="active"><ion-label>Activos</ion-label></ion-segment-button>
        <ion-segment-button value="terminated"><ion-label>Terminados</ion-label></ion-segment-button>
      </ion-segment>
      <!-- Loading -->
      <div v-if="loading" class="ion-text-center ion-padding">
        <ion-skeleton-text animated style="height:24px"></ion-skeleton-text>
        <ion-skeleton-text animated class="ion-margin-top" style="height:24px"></ion-skeleton-text>
        <ion-skeleton-text animated class="ion-margin-top" style="height:24px"></ion-skeleton-text>
      </div>

      <!-- Tabla -->
    <div v-if="loading" class="ion-text-center ion-padding"> ...skeletons... </div>
      <div v-else :key="refreshKey">
        <div v-if="rows.length === 0" class="ion-padding">
          <p>Sin resultados.</p>
        </div>

        <div v-else style="overflow-x:auto;">
          <table style="width:100%; border-collapse:collapse; margin-top:12px;">
            <thead>
              <tr>
                <th :style="th">ID</th>
                <th :style="th">Título</th>
                <th :style="th">Estado</th>
                <th :style="th">Dirección</th>
                <th :style="th">Fecha servicio</th>
                <th :style="th">Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="r in rows" :key="r.id">
                <td :style="td">{{ r.id }}</td>
                <td :style="td">{{ r.title }}</td>
                <td :style="td">{{ statusName(r) }}</td>
                <td :style="td">{{ r.address || '-' }}</td>
                <td :style="td">{{ formattedDate(r.fecha_realizar_servicio) }}</td>
                <td :style="td">
                  <ion-button
                    v-if="!isResolved(r)"
                    size="small"
                    @click="onResolve(r.id)"
                  >
                    Cerrar
                  </ion-button>
                  <span v-else>—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <ion-toast
        :is-open="toast.show"
        :message="toast.msg"
        :duration="1800"
        @didDismiss="toast = { show:false, msg:'' }"
      />
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent,
  IonButtons, IonMenuButton, IonSegment, IonSegmentButton, IonLabel, IonButton, IonToast, IonSkeletonText
} from '@ionic/vue'
import { onMounted, reactive, ref } from 'vue'
import { listMyTickets, resolveTicket, type TicketRow, type TicketFilter } from '@/services/tickets'
import type { CSSProperties } from 'vue'
import { nextTick } from 'vue' // si no estaba



const th = { textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' } as const satisfies CSSProperties
const td = { borderBottom: '1px solid #f0f0f0', padding: '8px' } as const satisfies CSSProperties

const filter = ref<TicketFilter>('all')
const rows = ref<TicketRow[]>([])
const loading = ref(false)
const refreshKey = ref(0)
const toast = reactive({ show: false, msg: '' })

function statusName(r: TicketRow): string {
  if (typeof r.id_status === 'number') {
    if (r.id_status === 2) return 'Activo'
    if (r.id_status === 3) return 'Terminado'
  }
  if (r.status) {
    const s = r.status.toLowerCase()
    if (s.includes('activo') || s.includes('active')) return 'Activo'
    if (s.includes('terminado') || s.includes('resolved') || s.includes('terminated')) return 'Terminado'
  }
  return '—'
}

function isResolved(r: TicketRow): boolean {
  if (typeof r.id_status === 'number') return r.id_status === 3
  return (r.status ?? '').toLowerCase().includes('terminado')
      || (r.status ?? '').toLowerCase().includes('resolved')
      || (r.status ?? '').toLowerCase().includes('terminated')
}

function formattedDate(s?: string): string {
  if (!s) return '-'
  const d = new Date(s)
  return isNaN(d.getTime()) ? '-' : d.toLocaleString()
}

async function load() {
  loading.value = true
  try {
    rows.value = await listMyTickets(filter.value)
  } catch (e) {
    toast.show = true
    toast.msg = 'Error al cargar tickets'
  } finally {
    loading.value = false
  }
}

function onFilterChange(e: CustomEvent) {
  filter.value = e.detail.value as TicketFilter
  load()
}

async function onResolve(id: number) {
  loading.value = true

  // declaramos removed en el scope de la función para usarlo en el catch (rollback)
  let removed: TicketRow | undefined
  try {
    // 1) update optimista
    const prev = rows.value
    removed = prev.find(r => r.id === id)
    rows.value = prev.filter(r => r.id !== id)

    // 2) forzar re-montaje del bloque de tabla para evitar el crash de DOM
    refreshKey.value++
    await nextTick()

    // 3) confirmar en backend
    await resolveTicket(id)

    // 4) recargar desde API (así aparece en “Terminados”)
    await load()

    toast.show = true
    toast.msg = 'Ticket resuelto'
  } catch (e) {
    // rollback si falla
    if (removed) rows.value = [removed, ...rows.value]
    toast.show = true
    toast.msg = 'No se pudo resolver el ticket'
  } finally {
    loading.value = false
  }
}



onMounted(load)
</script>
