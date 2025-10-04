<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start"><ion-menu-button /></ion-buttons>
        <ion-title>Tickets</ion-title>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <div class="ion-text-center ion-padding">
        <p>Aquí listaremos los tickets asignados al técnico.</p>
        <p class="ion-text-muted">Pendiente de conectar API.</p>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonMenuButton } from '@ionic/vue';
</script>
