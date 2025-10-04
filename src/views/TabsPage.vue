<template>
  <ion-page>
    <ion-tabs>
      <ion-router-outlet></ion-router-outlet>

      <ion-tab-bar slot="bottom">
        <ion-tab-button tab="home" href="/tabs/home">
          <ion-icon name="home-outline" />
          <ion-label>Inicio</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="tickets" href="/tabs/tickets">
          <ion-icon name="list-outline" />
          <ion-label>Tickets</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="map" href="/tabs/map">
          <ion-icon name="map-outline" />
          <ion-label>Mapa</ion-label>
        </ion-tab-button>
        <ion-tab-button tab="calendar" href="/tabs/calendar">
          <ion-icon name="calendar-outline" />
          <ion-label>Calendario</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonTabs, IonRouterOutlet, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/vue';
</script>
  