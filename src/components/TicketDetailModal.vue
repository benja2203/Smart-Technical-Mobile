<template>
  <ion-modal :is-open="isOpen" @didDismiss="$emit('update:isOpen', false)">
    <div class="modal-root">
      <div class="modal-header">
        <strong>Ticket #{{ ticket?.id }}</strong>
        <ion-button fill="clear" size="small" @click="$emit('update:isOpen', false)">
          <ion-icon :icon="closeOutline" />
        </ion-button>
      </div>

      <div v-if="!ticket">
        <ion-skeleton-text animated style="height:120px"></ion-skeleton-text>
      </div>

      <div v-else class="card">
        <div class="row">
          <div class="label">Título</div>
          <div class="value">{{ ticket.title }}</div>
        </div>

        <div class="row">
          <div class="label">Estado</div>
          <div class="value">
            <ion-badge :color="isResolved(ticket) ? 'success' : 'warning'">
              {{ statusName(ticket) }}
            </ion-badge>
          </div>
        </div>

        <div class="row" v-if="ticket.description">
          <div class="label">Descripción</div>
          <div class="value">{{ ticket.description }}</div>
        </div>

        <div class="row" v-if="ticket.address">
          <div class="label">Dirección</div>
          <div class="value value--withicon">
            {{ ticket.address }}
            <ion-button fill="clear" size="small" @click="copy(ticket.address)">
              <ion-icon :icon="copyOutline" />
            </ion-button>
          </div>
        </div>

        <div class="row">
          <div class="label">Fecha servicio</div>
          <div class="value">{{ formattedDate(ticket.fecha_realizar_servicio) }}</div>
        </div>

        <div class="row" v-if="ticket.fecha_termino_servicio">
          <div class="label">Fecha término</div>
          <div class="value">{{ formattedDate(ticket.fecha_termino_servicio) }}</div>
        </div>

        <div class="row" v-if="ticket.latitude != null && ticket.longitude != null">
          <div class="label">Coordenadas</div>
          <div class="value">{{ ticket.latitude }}, {{ ticket.longitude }}</div>
        </div>

        <div class="actions">
          <a
            class="btn btn-primary"
            :href="googleLink(ticket)"
            target="_blank"
            rel="noopener"
          >
            <ion-icon :icon="navigateOutline" style="margin-right:6px" />
            Navegar con Google Maps
          </a>

          <button
            v-if="!isResolved(ticket)"
            class="btn btn-green"
            @click="$emit('resolve', ticket.id)"
          >
            Cerrar ticket
          </button>
        </div>
      </div>
    </div>
  </ion-modal>
</template>

<script setup lang="ts">
import {
  IonModal, IonButton, IonIcon, IonBadge, IonSkeletonText
} from '@ionic/vue'
import { addIcons } from 'ionicons'
import { copyOutline, navigateOutline, closeOutline } from 'ionicons/icons'
addIcons({ copyOutline, navigateOutline, closeOutline })

import type { TicketRow } from '@/services/tickets'

defineProps<{
  isOpen: boolean
  ticket: TicketRow | null
}>()
defineEmits<{
  (e: 'update:isOpen', v: boolean): void
  (e: 'resolve', id: number): void
}>()

function statusName(r?: TicketRow | null) {
  if (!r) return '—'
  if (r.id_status === 2) return 'Activo'
  if (r.id_status === 3) return 'Terminado'
  const s = (r.status || '').toLowerCase()
  if (s.includes('active') || s.includes('activo')) return 'Activo'
  if (s.includes('terminated') || s.includes('terminado') || s.includes('resolved')) return 'Terminado'
  return '—'
}
function isResolved(r?: TicketRow | null) {
  if (!r) return false
  if (typeof r.id_status === 'number') return r.id_status === 3
  const s = (r.status || '').toLowerCase()
  return s.includes('terminado') || s.includes('resolved') || s.includes('terminated')
}
function formattedDate(s?: string) {
  if (!s) return '-'
  const d = new Date(s)
  return isNaN(d.getTime()) ? '-' : d.toLocaleString()
}
function googleLink(r: TicketRow) {
  if (r.latitude != null && r.longitude != null)
    return `https://www.google.com/maps/search/?api=1&query=${r.latitude},${r.longitude}`
  if (r.address) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(r.address)}`
  return '#'
}
async function copy(text?: string) {
  if (!text) return
  try { await navigator.clipboard.writeText(text) } catch {}
}
</script>

<style scoped>
/* === EXACTAMENTE los estilos que ya tenías en tu modal de Tickets.vue === */
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
