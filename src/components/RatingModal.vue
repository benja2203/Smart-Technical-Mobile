<template>
  <ion-modal
    :is-open="isOpen"
    @didDismiss="handleDismiss"
    :presenting-element="presentingElement"
  >
    <div class="modal-root">
      <div class="modal-header">
        <strong>Calificar Cliente </strong>
        <ion-button fill="clear" size="large" @click="handleDismiss">
          <ion-icon :icon="closeOutline" />
        </ion-button>
      </div>

      <div class="rating-content">
        <p class="rating-question">¿Cómo calificarías al cliente?</p>
        
        <div class="stars-container">
          <ion-icon
            v-for="star in 5"
            :key="star"
            :icon="star <= selectedRating ? starIcon : starOutlineIcon"
            :class="['star', { 'star-selected': star <= selectedRating }]"
            @click="selectRating(star)"
          />
        </div>

        <p class="rating-text" v-if="selectedRating > 0">
          {{ getRatingText(selectedRating) }}
        </p>

        <ion-button
          expand="block"
          :disabled="selectedRating === 0 || submitting"
          @click="submitRating"
          class="submit-button"
        >
          <ion-spinner v-if="submitting" name="crescent" />
          <span v-else>Enviar Calificación</span>
        </ion-button>
      </div>
    </div>
  </ion-modal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import {
  IonModal,
  IonButton,
  IonIcon,
  IonSpinner
} from '@ionic/vue'
import { addIcons } from 'ionicons'
import { closeOutline, star, starOutline } from 'ionicons/icons'

addIcons({ closeOutline, star, starOutline })

const starIcon = star
const starOutlineIcon = starOutline

interface Props {
  isOpen: boolean
  ticketId: number
  presentingElement?: HTMLElement | null
}

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'dismiss'): void
  (e: 'submit', rating: number): void
}>()

const selectedRating = ref(0)
const submitting = ref(false)

function selectRating(rating: number) {
  selectedRating.value = rating
}

function getRatingText(rating: number): string {
  const texts = {
    1: 'Cliente poco colaborador',
    2: 'Cliente regular',
    3: 'Cliente aceptable',
    4: 'Cliente colaborador',
    5: 'Excelente cliente'
  }
  return texts[rating as keyof typeof texts] || ''
}

async function submitRating() {
  if (selectedRating.value === 0) return
  
  submitting.value = true
  try {
    emit('submit', selectedRating.value)
  } finally {
    submitting.value = false
  }
}

function handleDismiss() {
  selectedRating.value = 0
  submitting.value = false
  emit('dismiss')
}
</script>

<style scoped>
.modal-root {
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.rating-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px 0;
}

.rating-question {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
  margin-bottom: 30px;
  color: var(--ion-text-color);
}

.stars-container {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.star {
  font-size: 48px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #ddd;
}

.star:hover {
  transform: scale(1.1);
}

.star-selected {
  color: #ffd700;
}

.rating-text {
  font-size: 16px;
  font-weight: 500;
  color: var(--ion-color-primary);
  margin-bottom: 30px;
  min-height: 24px;
}

.submit-button {
  margin-top: auto;
  width: 100%;
  max-width: 300px;
}
</style>
