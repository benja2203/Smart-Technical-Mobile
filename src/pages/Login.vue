<template>
  <ion-page>
    <ion-header><ion-toolbar><ion-title>Ingresar</ion-title></ion-toolbar></ion-header>
    <ion-content class="ion-padding">
      <form @submit.prevent="doLogin">
        <ion-input v-model="user" label="Usuario o Email" label-placement="floating" required />
        <ion-input v-model="password" label="Password" label-placement="floating" type="password" class="ion-margin-top" required />
        <ion-button expand="block" type="submit" class="ion-margin-top" :disabled="loading">Entrar</ion-button>
        <ion-text color="danger" v-if="error">{{ error }}</ion-text>
      </form>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/store/auth';
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonInput, IonButton, IonText } from '@ionic/vue';

const user = ref(''); const password = ref('');
const loading = ref(false); const error = ref('');
const auth = useAuth();

async function doLogin() {
  error.value = ''; loading.value = true;
  try { await auth.login(user.value, password.value); window.location.href = '/tabs'; }
  catch { error.value = 'Credenciales inválidas o API no disponible.'; }
  finally { loading.value = false; }
}
</script>
