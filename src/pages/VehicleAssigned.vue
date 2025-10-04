<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Vehículo asignado</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">
      <ion-card>
        <ion-card-header><ion-card-title>Detalle</ion-card-title></ion-card-header>
        <ion-card-content>
          <p>Patente: <strong>—</strong></p>
          <p>Modelo: <strong>—</strong></p>
          <p>Estado: <strong>—</strong></p>
        </ion-card-content>
      </ion-card>
      <p class="ion-text-muted">* En el móvil mostramos solo el vehículo asignado. La administración completa queda en la web.</p>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton,
  IonCard, IonCardHeader, IonCardTitle, IonCardContent
} from '@ionic/vue';
</script>
