<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Inicio</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header><ion-card-title>Resumen de hoy</ion-card-title></ion-card-header>
        <ion-card-content>
          <p>Vehículo asignado: <strong>{{ vehicle }}</strong></p>
          <p>Tickets pendientes: <strong>—</strong></p>
          <p>Turno: <strong>—</strong></p>
        </ion-card-content>
      </ion-card>
      <ion-card>
        <ion-card-header><ion-card-title>Anuncios</ion-card-title></ion-card-header>
        <ion-card-content>Sin anuncios por ahora.</ion-card-content>
      </ion-card>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/vue';
import { ref } from 'vue';
// cuando conectemos API, esto vendrá desde /me o /assignments
const vehicle = ref('—');
</script>
