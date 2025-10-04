<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Grafana</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <p>Abre el dashboard en el navegador del dispositivo.</p>
      <ion-button expand="block" @click="openGrafana">Abrir Grafana</ion-button>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton, IonButton } from '@ionic/vue';
import { Browser } from '@capacitor/browser';

const url = import.meta.env.VITE_GRAFANA_URL || 'https://example.com';
async function openGrafana(){ await Browser.open({ url }); }
</script>
