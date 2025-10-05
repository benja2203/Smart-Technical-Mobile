<template>
  <ion-app>
    <!-- Menú lateral -->
    <ion-menu content-id="main">
      <ion-header>
        <ion-toolbar color="primary"><ion-title>Smart Technical</ion-title></ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-menu-toggle auto-hide="true">
            <ion-item router-link="/tabs/home" router-direction="root">
              <ion-icon name="home-outline" slot="start" /><ion-label>Inicio</ion-label>
            </ion-item>
            <ion-item router-link="/tabs/tickets" router-direction="root">
              <ion-icon name="list-outline" slot="start" /><ion-label>Tickets</ion-label>
            </ion-item>
            <ion-item router-link="/tabs/map" router-direction="root">
              <ion-icon name="map-outline" slot="start" /><ion-label>Mapa</ion-label>
            </ion-item>
            <ion-item router-link="/tabs/calendar" router-direction="root">
              <ion-icon name="calendar-outline" slot="start" /><ion-label>Calendario</ion-label>
            </ion-item>
          </ion-menu-toggle>
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
  IonContent, IonList, IonMenuToggle, IonItem, IonIcon, IonLabel
} from '@ionic/vue';
import { useAuth } from '@/store/auth';
const auth = useAuth();
function logout(){ auth.logout(); window.location.href = '/login'; }
</script>
