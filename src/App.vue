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


<style scoped>
/* ============ MENÚ HEADER ============ */
ion-menu ion-header {
  background: linear-gradient(135deg, #6478e6 0%, #764ba2 100%);
  box-shadow: 0 4px 12px rgba(100, 120, 230, 0.25);
}

ion-menu ion-toolbar {
  --background: transparent;
  --color: white;
  --ion-color-tertiary: transparent;
}

ion-menu ion-title {
  font-size: 18px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

/* ============ CONTENIDO DEL MENÚ ============ */
ion-menu ion-content {
  --background: var(--ion-background-color);
}

/* ============ LISTA PRINCIPAL ============ */
ion-menu ion-list {
  --background: transparent;
  --ion-list-background: transparent;
  padding: 12px 0;
}

ion-menu ion-list:first-of-type {
  padding-top: 8px;
}

/* ============ ITEMS DEL MENÚ ============ */
ion-menu ion-item {
  --padding-start: 12px;
  --padding-end: 12px;
  --inner-padding-end: 0;
  margin: 6px 8px;
  border-radius: 10px;
  transition: all 0.3s ease;
  --background: transparent;
  --ion-background-color: transparent;
  min-height: 48px;
}

ion-menu ion-item:hover {
  --background: rgba(100, 120, 230, 0.1);
  transform: translateX(6px);
}

ion-menu ion-item.router-link-active,
ion-menu ion-item.active {
  --background: linear-gradient(90deg, rgba(100, 120, 230, 0.15) 0%, transparent 100%);
  border-left: 4px solid #6478e6;
  --padding-start: 8px;
}

ion-menu ion-item.router-link-active ion-icon,
ion-menu ion-item.active ion-icon {
  color: #6478e6;
}

ion-menu ion-item.router-link-active ion-label,
ion-menu ion-item.active ion-label {
  font-weight: 700;
  color: #6478e6;
}

/* ============ ICONOS DEL MENÚ ============ */
ion-menu ion-icon[slot="start"] {
  margin-right: 14px;
  color: #999;
  font-size: 22px;
  transition: all 0.3s ease;
}

ion-menu ion-item:hover ion-icon[slot="start"] {
  color: #6478e6;
}

/* ============ LABELS DEL MENÚ ============ */
ion-menu ion-label {
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 0.2px;
  color: var(--ion-text-color);
  transition: all 0.3s ease;
}

/* ============ DIVIDER (CUENTA) ============ */
ion-menu ion-item-divider {
  background: rgba(100, 120, 230, 0.08);
  color: #6478e6;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  padding: 16px 12px 8px;
  margin: 12px 0;
  border-bottom: 1px solid rgba(100, 120, 230, 0.1);
}

/* ============ BOTÓN CERRAR SESIÓN ============ */
ion-menu ion-item[button][detail="false"] {
  margin: 8px;
  border-radius: 10px;
  transition: all 0.3s ease;
  --background: rgba(220, 53, 69, 0.1);
}

ion-menu ion-item[button][detail="false"]:hover {
  --background: rgba(220, 53, 69, 0.15);
  transform: translateX(4px);
}

ion-menu ion-item[button][detail="false"] ion-icon[slot="start"] {
  color: #dc3545;
}

ion-menu ion-item[button][detail="false"] ion-label {
  color: #dc3545;
  font-weight: 600;
}

/* ============ SEPARADORES DE LISTA ============ */
ion-menu ion-list[lines="full"] {
  --ion-item-border-color: rgba(100, 120, 230, 0.1);
}

/* ============ RESPONSIVE ============ */
@media (max-width: 480px) {
  ion-menu ion-title {
    font-size: 16px;
  }
  
  ion-menu ion-label {
    font-size: 14px;
  }
  
  ion-menu ion-icon[slot="start"] {
    font-size: 20px;
  }
}

/* ============ DARK MODE ============ */
@media (prefers-color-scheme: dark) {
  ion-menu ion-item:hover {
    --background: rgba(100, 120, 230, 0.15);
  }
  
  ion-menu ion-item.router-link-active,
  ion-menu ion-item.active {
    --background: linear-gradient(90deg, rgba(100, 120, 230, 0.2) 0%, transparent 100%);
  }
  
  ion-menu ion-icon[slot="start"] {
    color: #888;
  }
  
  ion-menu ion-item:hover ion-icon[slot="start"] {
    color: #7c9ff7;
  }
  
  ion-menu ion-label {
    color: #e0e0e0;
  }
  
  ion-menu ion-item-divider {
    background: rgba(100, 120, 230, 0.12);
    color: #7c9ff7;
    border-bottom-color: rgba(100, 120, 230, 0.15);
  }
  
  ion-menu ion-item[button][detail="false"] {
    --background: rgba(220, 53, 69, 0.12);
  }
  
  ion-menu ion-item[button][detail="false"]:hover {
    --background: rgba(220, 53, 69, 0.18);
  }
}
</style>
