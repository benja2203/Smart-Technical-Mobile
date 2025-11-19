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
            <ion-button fill="clear" size="large" @click="onModalClosed">
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

      <!-- Modal de Calificación NPS -->
      <RatingModal
        :is-open="ratingModalOpen"
        :ticket-id="ticketToRate?.id || 0"
        :presenting-element="presentingEl"
        @dismiss="onRatingModalDismiss"
        @submit="onRatingSubmit"
      />

      <!-- ✅ Toast con binding dinámico y posición abajo -->
      <ion-toast
        :is-open="toast.show"
        :message="toast.msg"
        :duration="2500"
        :color="toast.color"
        position="bottom"
        @didDismiss="toast.show = false"
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
import { submitNPSRating } from '@/services/nps'
import RatingModal from '@/components/RatingModal.vue'
import type { CSSProperties } from 'vue'
import { alertController } from '@ionic/vue'

import { addIcons } from 'ionicons'
import { locationOutline, copyOutline, navigateOutline, closeOutline } from 'ionicons/icons'
addIcons({ locationOutline, copyOutline, navigateOutline, closeOutline })

const th = { textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px' } as const satisfies CSSProperties
const td = { borderBottom: '1px solid #f0f0f0', padding: '8px' } as const satisfies CSSProperties

const filter = ref<TicketFilter>('all')
const rows = ref<TicketRow[]>([])
const loading = ref(false)
const refreshKey = ref(0)
const toast = reactive({ show:false, msg:'', color:'success' })

const modalOpen = ref(false)
const modalKey  = ref(0)
const selected  = ref<TicketRow | null>(null)
const presentingEl = ref<HTMLElement | null>(null)

const ratingModalOpen = ref(false)
const ticketToRate = ref<TicketRow | null>(null)

onMounted(async () => {
  presentingEl.value = document.querySelector('ion-router-outlet') || document.body
  await load()
})

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

async function load() {
  loading.value = true
  try {
    rows.value = await listMyTickets(filter.value)
  } catch (e) {
    toast.show = true
    toast.msg = 'Error al cargar tickets'
    toast.color = 'danger'
  } finally {
    loading.value = false
  }
}

function onFilterChange(e: CustomEvent) {
  filter.value = e.detail.value as TicketFilter
  load()
}

function openTicket(r: TicketRow) {
  selected.value = r
  modalOpen.value = true
}

function onModalClosed() {
  modalOpen.value = false
  selected.value = null
  modalKey.value++
}

function openRatingModal(ticket: TicketRow) {
  ticketToRate.value = ticket
  ratingModalOpen.value = true
}

function onRatingModalDismiss() {
  ratingModalOpen.value = false
  ticketToRate.value = null
}

async function onRatingSubmit(rating: number) {
  if (!ticketToRate.value) return

  try {
    const customerId = (ticketToRate.value as any).id_customer || (ticketToRate.value as any).customer_id || 1
    
    await submitNPSRating(
      ticketToRate.value.id,
      rating,
      customerId
    )

    toast.show = true
    toast.msg = '¡Gracias por su calificación!'
    toast.color = 'success'
    
    onRatingModalDismiss()
  } catch (error: any) {
    console.error('Error al enviar NPS:', error)
    toast.show = true
    toast.msg = error.message || 'Error al enviar calificación'
    toast.color = 'danger'
  }
}

async function closeFromTable(id: number) {
  const ok = await confirmClose()
  if (!ok) return

  loading.value = true
  let removed: TicketRow | undefined
  try {
    removed = rows.value.find(r => r.id === id)
    rows.value = rows.value.filter(r => r.id !== id)
    refreshKey.value++
    await nextTick()

    await resolveTicket(id)
    await load()

    toast.show = true
    toast.msg = 'Ticket se ha cerrado correctamente'
    toast.color = 'success'

    if (removed) {
      setTimeout(() => {
        openRatingModal(removed!)
      }, 500)
    }
  } catch {
    if (removed) rows.value = [removed, ...rows.value]
    toast.show = true
    toast.msg = 'No se pudo resolver el ticket'
    toast.color = 'danger'
  } finally {
    loading.value = false
  }
}

async function closeFromModal(id: number) {
  const ok = await confirmClose()
  if (!ok) return

  const ticketClosed = selected.value

  try {
    await resolveTicket(id)
    toast.show = true
    toast.msg = 'Ticket se ha cerrado correctamente'
    toast.color = 'success'
    onModalClosed()
    await load()

    if (ticketClosed) {
      setTimeout(() => {
        openRatingModal(ticketClosed)
      }, 500)
    }
  } catch {
    toast.show = true
    toast.msg = 'No se pudo resolver el ticket'
    toast.color = 'danger'
  }
}

async function copy(text?: string) {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    toast.show = true
    toast.msg = 'Dirección copiada'
    toast.color = 'dark'
  } catch {
    toast.show = true
    toast.msg = 'No se pudo copiar'
    toast.color = 'danger'
  }
}
</script>

<style scoped>
/* ============ TABLA PRINCIPAL ============ */
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  overflow: hidden;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  background: var(--ion-background-color);
}

/* HEADER de tabla */
table thead {
  background: linear-gradient(135deg, #6478e6 0%, #764ba2 100%);
}

table thead tr {
  border: none;
}

table th {
  text-align: left;
  padding: 16px 12px;
  font-weight: 700;
  font-size: 13px;
  color: white;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  white-space: nowrap;
  border: none;
}

/* BODY de tabla */
table tbody tr {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  transition: all 0.2s ease;
  background: var(--ion-background-color);
}

table tbody tr:hover {
  background: linear-gradient(90deg, rgba(100, 120, 230, 0.08) 0%, transparent 100%);
  transform: scale(1.01);
  box-shadow: inset 0 0 8px rgba(100, 120, 230, 0.1);
}

table tbody tr:last-child {
  border-bottom: none;
}

table td {
  padding: 14px 12px;
  font-size: 13px;
  color: var(--ion-text-color);
  border: none;
  vertical-align: middle;
}

/* ID Column - Destacado */
table td:first-child {
  font-weight: 700;
  color: #6478e6;
  background: rgba(100, 120, 230, 0.06);
  border-radius: 6px;
  margin: 4px;
  padding: 12px 10px;
  font-size: 14px;
  font-family: 'Courier New', monospace;
}

/* Status Column - Indicadores */
table tbody tr td:nth-child(3) {
  font-weight: 600;
  padding: 14px 8px;
}

/* Dirección Column */
table tbody tr td:nth-child(4) {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--ion-text-color-secondary);
}

/* Fecha Column */
table tbody tr td:nth-child(5) {
  color: var(--ion-text-color-secondary);
  font-size: 12px;
}

/* Acción Column */
table tbody tr td:last-child {
  text-align: center;
  padding: 10px 8px;
}

/* ============ PAGINATION ============ */
table tfoot tr {
  background: rgba(100, 120, 230, 0.04);
  border-top: 2px solid rgba(100, 120, 230, 0.2);
}

table tfoot td {
  padding: 12px;
  text-align: center;
  color: var(--ion-text-color-secondary);
  font-size: 13px;
  font-weight: 500;
}

/* ============ FILTROS (SEGMENT) ============ */
ion-segment {
  --background: rgba(100, 120, 230, 0.05);
  margin-bottom: 16px;
  border-radius: 10px;
  padding: 6px;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.06);
}

ion-segment-button {
  border-radius: 8px;
  --background: transparent;
  --background-checked: linear-gradient(135deg, #6478e6 0%, #764ba2 100%);
  --background-hover: rgba(100, 120, 230, 0.1);
  --color: var(--ion-text-color-secondary);
  --color-checked: white;
  --border-radius: 8px;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.3px;
  transition: all 0.3s ease;
  --indicator-color: transparent;
}

ion-segment-button:hover {
  background: rgba(100, 120, 230, 0.1);
}

/* ============ MODAL STYLES ============ */
.modal-root {
  padding: 20px;
  background: var(--ion-background-color);
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px 20px;
  border-bottom: 2px solid rgba(100, 120, 230, 0.2);
  margin-bottom: 20px;
  gap: 12px;
}

.modal-header strong {
  font-size: 18px;
  font-weight: 700;
  background: linear-gradient(135deg, #6478e6 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.modal-header ion-button {
  --color: var(--ion-text-color-secondary);
}

/* Card dentro del modal */
.card {
  background: linear-gradient(135deg, rgba(100, 120, 230, 0.04) 0%, rgba(118, 75, 162, 0.04) 100%);
  border: 1px solid rgba(100, 120, 230, 0.15);
  border-radius: 12px;
  padding: 20px;
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

/* Rows en modal */
.row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 0;
  border-bottom: 1px solid rgba(100, 120, 230, 0.1);
  transition: background-color 0.2s ease;
}

.row:last-child {
  border-bottom: none;
}

.row:hover {
  background: rgba(100, 120, 230, 0.04);
  border-radius: 6px;
  padding: 14px 8px;
}

.label {
  opacity: 0.75;
  min-width: 140px;
  font-weight: 600;
  font-size: 13px;
  color: #6478e6;
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.value {
  font-weight: 600;
  font-size: 14px;
  color: var(--ion-text-color);
  text-align: right;
  flex: 1;
}

.value--withicon {
  display: flex;
  align-items: center;
  gap: 8px;
  justify-content: flex-end;
}

/* Badge en estado */
ion-badge {
  border-radius: 8px;
  padding: 6px 12px;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.3px;
  text-transform: uppercase;
}

ion-badge[color="success"] {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

ion-badge[color="warning"] {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
  color: white;
}

/* ============ BOTONES DE ACCIÓN ============ */
.actions {
  display: flex;
  gap: 12px;
  margin-top: 20px;
  flex-wrap: wrap;
  padding-top: 20px;
  border-top: 2px solid rgba(100, 120, 230, 0.2);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 12px 18px;
  border-radius: 8px;
  font-weight: 700;
  font-size: 13px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  text-decoration: none;
  letter-spacing: 0.3px;
  flex: 1;
  min-width: 160px;
  text-transform: uppercase;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.btn:active {
  transform: translateY(-1px);
}

.btn-primary {
  background: linear-gradient(135deg, #6478e6 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  box-shadow: 0 6px 20px rgba(100, 120, 230, 0.4);
}

.btn-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.btn-green:hover {
  box-shadow: 0 6px 20px rgba(16, 185, 129, 0.4);
}

/* Buttons en tabla */
ion-button[size="small"] {
  --height: 32px;
  --padding-start: 12px;
  --padding-end: 12px;
  --border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  --background: rgba(100, 120, 230, 0.15);
  --color: #6478e6;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  transition: all 0.2s ease;
}

ion-button[size="small"]:hover {
  --background: #6478e6;
  --color: white;
  transform: scale(1.05);
}

/* ============ LOADING & EMPTY STATES ============ */
.ion-text-center {
  text-align: center;
}

.ion-padding {
  padding: 20px;
}

ion-skeleton-text {
  border-radius: 8px;
  margin-bottom: 12px;
}

/* ============ RESPONSIVE ============ */
@media (max-width: 768px) {
  table th,
  table td {
    padding: 10px 6px;
    font-size: 12px;
  }
  
  table th {
    padding: 12px 6px;
  }
  
  .modal-root {
    padding: 16px;
  }
  
  .card {
    padding: 16px;
  }
  
  .btn {
    min-width: 120px;
    padding: 10px 14px;
  }
  
  .label {
    min-width: 110px;
    font-size: 12px;
  }
  
  .value {
    font-size: 13px;
  }
}

@media (max-width: 480px) {
  table {
    font-size: 11px;
  }
  
  table th,
  table td {
    padding: 8px 4px;
  }
  
  table td:first-child {
    font-size: 12px;
  }
  
  .actions {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
    min-width: auto;
  }
  
  .row {
    flex-direction: column;
    gap: 6px;
  }
  
  .label {
    min-width: auto;
  }
  
  .value {
    text-align: left;
  }
}

/* ============ DARK MODE ============ */
@media (prefers-color-scheme: dark) {
  table {
    background: #2a2a2a;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
  }
  
  table tbody tr {
    background: #2a2a2a;
  }
  
  table tbody tr:hover {
    background: linear-gradient(90deg, rgba(100, 120, 230, 0.15) 0%, transparent 100%);
    box-shadow: inset 0 0 8px rgba(100, 120, 230, 0.15);
  }
  
  table td:first-child {
    background: rgba(100, 120, 230, 0.12);
  }
  
  table tfoot tr {
    background: rgba(100, 120, 230, 0.08);
    border-top-color: rgba(100, 120, 230, 0.3);
  }
  
  .card {
    background: linear-gradient(135deg, rgba(100, 120, 230, 0.08) 0%, rgba(118, 75, 162, 0.08) 100%);
    border-color: rgba(100, 120, 230, 0.25);
  }
  
  .row {
    border-bottom-color: rgba(100, 120, 230, 0.15);
  }
  
  .row:hover {
    background: rgba(100, 120, 230, 0.1);
  }
  
  .modal-header {
    border-bottom-color: rgba(100, 120, 230, 0.3);
  }
  
  .actions {
    border-top-color: rgba(100, 120, 230, 0.3);
  }
  
  ion-segment {
    --background: rgba(100, 120, 230, 0.08);
  }
  
  ion-button[size="small"] {
    --background: rgba(100, 120, 230, 0.2);
  }
}
</style>
