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
              <tr
                v-for="r in rows"
                :key="r.id"
                @click="openTicket(r)"
                style="cursor:pointer"
              >
                <td :style="td">#{{ r.id }}</td>
                <td :style="td">{{ r.title }}</td>
                <td :style="td">{{ statusName(r) }}</td>
                <td :style="td">{{ r.address || '-' }}</td>
                <td :style="td">{{ formattedDate(r.fecha_realizar_servicio) }}</td>

                <!-- Acción (con .stop para no abrir modal al cerrar desde la tabla) -->
                <td :style="td" @click.stop>
                  <ion-button v-if="!isResolved(r)" size="small" @click="closeFromTable(r.id)">
                    Cerrar
                  </ion-button>
                  <span v-else>—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Modal Detalle -->
      <ion-modal
        :is-open="modalOpen"
        :key="modalKey"
        :presenting-element="presentingEl"
        @didDismiss="onModalClosed"
      >
        <div class="modal-root">
          <div class="modal-header">
            <strong>Ticket #{{ selected?.id }}</strong>
            <ion-button fill="clear" size="small" @click="onModalClosed">
              <ion-icon :icon="closeOutline" />
            </ion-button>
          </div>

          <div v-if="!selected">
            <ion-skeleton-text animated style="height:120px"></ion-skeleton-text>
          </div>

          <div v-else class="card">
            <div class="row">
              <div class="label">Título</div>
              <div class="value">{{ selected.title }}</div>
            </div>

            <div class="row">
              <div class="label">Estado</div>
              <div class="value">
                <ion-badge :color="isResolved(selected) ? 'success' : 'warning'">
                  {{ statusName(selected) }}
                </ion-badge>
              </div>
            </div>

            <div class="row" v-if="selected.description">
              <div class="label">Descripción</div>
              <div class="value">{{ selected.description }}</div>
            </div>

            <div class="row" v-if="selected.address">
              <div class="label">Dirección</div>
              <div class="value value--withicon">
                {{ selected.address }}
                <ion-button fill="clear" size="small" @click="copy(selected.address)">
                  <ion-icon :icon="copyOutline" />
                </ion-button>
              </div>
            </div>

            <div class="row">
              <div class="label">Fecha servicio</div>
              <div class="value">{{ formattedDate(selected.fecha_realizar_servicio) }}</div>
            </div>

            <div class="row" v-if="selected.fecha_termino_servicio">
              <div class="label">Fecha término</div>
              <div class="value">{{ formattedDate(selected.fecha_termino_servicio) }}</div>
            </div>

            <div class="row" v-if="selected.latitude != null && selected.longitude != null">
              <div class="label">Coordenadas</div>
              <div class="value">{{ selected.latitude }}, {{ selected.longitude }}</div>
            </div>

            <div class="actions">
              <a
                class="btn btn-primary"
                :href="googleLink(selected)"
                target="_blank"
                rel="noopener"
              >
                <ion-icon :icon="navigateOutline" style="margin-right:6px" />
                Navegar con Google Maps
              </a>

              <button
                v-if="canClose(selected)"
                class="btn btn-green"
                @click="closeFromModal(selected.id)"
              >
                Cerrar ticket
              </button>
            </div>
          </div>
        </div>
      </ion-modal>

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
  IonButtons, IonMenuButton, IonSegment, IonSegmentButton, IonLabel,
  IonButton, IonToast, IonSkeletonText, IonModal, IonBadge, IonIcon
} from '@ionic/vue'
import { onMounted, reactive, ref, nextTick } from 'vue'
import { listMyTickets, resolveTicket, type TicketRow, type TicketFilter } from '@/services/tickets'
import type { CSSProperties } from 'vue'
import { alertController } from '@ionic/vue'


// (opcional pero recomendado) registra íconos para evitar warnings
import { addIcons } from 'ionicons'
import { locationOutline, copyOutline, navigateOutline, closeOutline } from 'ionicons/icons'
addIcons({ locationOutline, copyOutline, navigateOutline, closeOutline })

/* estilos de tabla */
const th = { textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' } as const satisfies CSSProperties
const td = { borderBottom: '1px solid #f0f0f0', padding: '8px' } as const satisfies CSSProperties

/* estado */
const filter = ref<TicketFilter>('all')
const rows = ref<TicketRow[]>([])
const loading = ref(false)
const refreshKey = ref(0)
const toast = reactive({ show:false, msg:'' })

/* modal */
const modalOpen = ref(false)
const modalKey  = ref(0)
const selected  = ref<TicketRow | null>(null)
const presentingEl = ref<HTMLElement | null>(null) // para iOS sheet modal

onMounted(async () => {
  presentingEl.value = document.querySelector('ion-router-outlet') || document.body
  await load()
})

/* helpers UI */
function statusName(r: TicketRow): string {
  if (r.id_status === 2) return 'Activo'
  if (r.id_status === 3) return 'Terminado'
  const s = (r.status || '').toLowerCase()
  if (s.includes('active') || s.includes('activo')) return 'Activo'
  if (s.includes('terminated') || s.includes('terminado') || s.includes('resolved')) return 'Terminado'
  return '—'
}
function isResolved(r: TicketRow): boolean {
  if (typeof r.id_status === 'number') return r.id_status === 3
  const s = (r.status || '').toLowerCase()
  return s.includes('terminado') || s.includes('resolved') || s.includes('terminated')
}
function formattedDate(s?: string): string {
  if (!s) return '-'
  const d = new Date(s); return isNaN(d.getTime()) ? '-' : d.toLocaleString()
}
function googleLink(r: TicketRow) {
  if (r.latitude != null && r.longitude != null)
    return `https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`
  if (r.address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address)}`
  return '#'
}
function canClose(r?: TicketRow | null) {
  return !!r && !isResolved(r)
}

async function confirmClose(): Promise<boolean> {
  const alert = await alertController.create({
    header: 'Cerrar ticket',
    message: '¿Seguro que quieres cerrarlo? Esta acción no se puede deshacer.',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      { text: 'Cerrar', role: 'confirm' }
    ]
  })
  await alert.present()
  const { role } = await alert.onDidDismiss()
  return role === 'confirm'
}


/* data */
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

/* abrir / cerrar modal */
function openTicket(r: TicketRow) {
  selected.value = r
  modalOpen.value = true
}
function onModalClosed() {
  modalOpen.value = false
  selected.value = null
  modalKey.value++ // fuerza re-montaje -> el modal vuelve a abrir siempre
}

/* acciones */
async function closeFromTable(id: number) {
  const ok = await confirmClose()
  if (!ok) return

  loading.value = true
  let removed: TicketRow | undefined
  try {
    // optimista
    removed = rows.value.find(r => r.id === id)
    rows.value = rows.value.filter(r => r.id !== id)
    refreshKey.value++
    await nextTick()

    await resolveTicket(id)
    await load()

    toast.show = true
    toast.msg = 'Ticket resuelto'
  } catch {
    if (removed) rows.value = [removed, ...rows.value]
    toast.show = true
    toast.msg = 'No se pudo resolver el ticket'
  } finally {
    loading.value = false
  }
}

async function closeFromModal(id: number) {
  const ok = await confirmClose()
  if (!ok) return

  try {
    await resolveTicket(id)
    toast.show = true
    toast.msg = 'Ticket resuelto'
    onModalClosed()
    await load()
  } catch {
    toast.show = true
    toast.msg = 'No se pudo resolver el ticket'
  }
}

async function copy(text?: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    toast.show = true
    toast.msg = 'Dirección copiada'
  } catch {
    toast.show = true
    toast.msg = 'No se pudo copiar'
  }
}


</script>

<style scoped>
.modal-root { padding: 12px; }
.modal-header {
  display:flex; align-items:center; justify-content:space-between;
  padding: 6px 2px 10px;
}
.card {
  background: var(--ion-background-color);
  border: 1px solid rgba(255,255,255,.06);
  border-radius: 12px;
  padding: 12px;
}
.row {
  display:flex; justify-content:space-between; align-items:flex-start;
  gap: 12px; padding:8px 0; border-bottom:1px solid rgba(255,255,255,.06);
}
.row:last-child { border-bottom:none; }
.label { opacity:.7; min-width:120px; }
.value { font-weight:600; }
.value--withicon { display:flex; align-items:center; gap:6px; }

.actions { display:flex; gap:10px; margin-top:14px; flex-wrap:wrap; }
.btn {
  display:inline-flex; align-items:center; justify-content:center;
  padding: 10px 12px; border-radius: 10px; font-weight: 600; border: none; cursor: pointer;
}
.btn-primary { background: var(--ion-color-primary); color: var(--ion-color-primary-contrast); text-decoration:none; }
.btn-green   { background: #10b981; color: white; }
</style>
