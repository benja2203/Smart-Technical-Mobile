<template>
  <ion-app>
    <!-- Menú lateral: solo se monta si hay sesión -->
    <ion-menu
      v-if="isAuthed"
      content-id="main"
      menu-id="mainMenu"
    >
      <ion-header>
        <ion-toolbar color="tertiary">
          <ion-title>Smart Technical</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-content>
        <ion-list lines="none">
          <ion-menu-toggle auto-hide="true">
            <ion-item router-link="/tabs/home">
              <ion-icon :icon="homeOutline" slot="start" />
              <ion-label>Inicio</ion-label>
            </ion-item>
            <ion-item router-link="/tabs/tickets">
              <ion-icon :icon="listOutline" slot="start" />
              <ion-label>Mis Tickets</ion-label>
            </ion-item>
            <ion-item router-link="/tabs/gmap">
              <ion-icon :icon="mapOutline" slot="start" />
              <ion-label>Rutas</ion-label>
            </ion-item>
            <ion-item router-link="/tabs/calendar">
              <ion-icon :icon="calendarOutline" slot="start" />
              <ion-label>Calendario</ion-label>
            </ion-item>
          </ion-menu-toggle>
        </ion-list>

        <ion-list lines="full">
          <ion-item-divider>Cuenta</ion-item-divider>
          <ion-item button detail="false" color="danger" @click="confirmLogout">
            <ion-icon :icon="logOutOutline" slot="start" />
            <ion-label>Cerrar sesión</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>

    <!-- Contenedor principal -->
    <ion-router-outlet id="main"></ion-router-outlet>
  </ion-app>
</template>

<script setup lang="ts">
import {
  IonApp, IonRouterOutlet, IonMenu, IonHeader, IonToolbar, IonTitle,
  IonContent, IonList, IonItem, IonIcon, IonLabel, IonItemDivider,
  IonMenuToggle, alertController, menuController
} from '@ionic/vue'
import { computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/store/auth'

// Icons
import { addIcons } from 'ionicons'
import { homeOutline, listOutline, mapOutline, calendarOutline, logOutOutline } from 'ionicons/icons'
addIcons({ homeOutline, listOutline, mapOutline, calendarOutline, logOutOutline })

const router = useRouter()
const auth = useAuth()

// ¿Hay sesión? (ajusta según tu store: token, user, etc.)
const isAuthed = computed(() => !!auth.token || !!auth.user)

// Habilita/deshabilita y cierra el menú cuando cambia el estado de sesión
watch(isAuthed, async (enabled) => {
  await menuController.enable(enabled, 'mainMenu')
  if (!enabled) {
    await menuController.close('mainMenu')
  }
}, { immediate: true })

async function confirmLogout() {
  const alert = await alertController.create({
    header: 'Cerrar sesión',
    message: '¿Quieres cerrar la sesión?',
    buttons: [
      { text: 'Cancelar', role: 'cancel' },
      {
        text: 'Cerrar sesión',
        role: 'confirm',
        handler: async () => {
          // 1) cerrar sesión en el store
          auth.logout()
          // 2) cerrar y deshabilitar el menú por si estaba abierto
          await menuController.close('mainMenu')
          await menuController.enable(false, 'mainMenu')
          // 3) ir a login
          router.replace('/login')
        }
      }
    ]
  })
  await alert.present()
}
</script>
