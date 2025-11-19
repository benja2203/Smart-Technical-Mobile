<template>
  <ion-page>
    <ion-content :fullscreen="true">
      <div class="login-container">
        <div class="login-card">
          <!-- Logo/Icon Area -->
          <div class="logo-container">
            <ion-icon :icon="constructOutline" class="logo-icon"></ion-icon>
            <h1 class="app-title">Smart Technical</h1>
            <p class="app-subtitle">Bienvenido de vuelta</p>
          </div>

          <!-- Login Form -->
          <form @submit.prevent="doLogin" class="login-form">
            <div class="input-wrapper">
              <ion-input 
                v-model="user" 
                label="Usuario o Email" 
                label-placement="floating" 
                fill="outline"
                required 
                :disabled="loading"
                class="custom-input"
              >
                <ion-icon :icon="personOutline" slot="start"></ion-icon>
              </ion-input>
            </div>

            <div class="input-wrapper">
              <ion-input 
                v-model="password" 
                label="Contraseña" 
                label-placement="floating" 
                type="password" 
                fill="outline"
                required
                :disabled="loading"
                class="custom-input"
              >
                <ion-icon :icon="lockClosedOutline" slot="start"></ion-icon>
              </ion-input>
            </div>

            <!-- Error Message -->
            <ion-text color="danger" v-if="error" class="error-message">
              <ion-icon :icon="alertCircleOutline"></ion-icon>
              {{ error }}
            </ion-text>

            <!-- Login Button -->
            <ion-button 
              expand="block" 
              type="submit" 
              class="login-button" 
              :disabled="loading"
              shape="round"
            >
              <ion-spinner v-if="loading" name="crescent"></ion-spinner>
              <span v-else>Iniciar Sesión</span>
            </ion-button>

            <!-- Footer Links -->
            <div class="footer-links">
              <a href="#" class="link-text">¿Olvidaste tu contraseña?</a>
            </div>
          </form>
        </div>
      </div>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '@/store/auth';
import { 
  IonPage, 
  IonContent, 
  IonInput, 
  IonButton, 
  IonText, 
  IonIcon,
  IonSpinner
} from '@ionic/vue';
import { 
  personOutline, 
  lockClosedOutline, 
  constructOutline,
  alertCircleOutline 
} from 'ionicons/icons';

const user = ref('');
const password = ref('');
const loading = ref(false);
const error = ref('');
const auth = useAuth();

async function doLogin() {
  error.value = '';
  loading.value = true;
  try {
    await auth.login(user.value, password.value);
    window.location.href = '/tabs';
  } catch {
    error.value = 'Credenciales inválidas o API no disponible.';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  position: relative;
  overflow: hidden;
}

/* Decorative background circles */
.login-container::before {
  content: '';
  position: absolute;
  width: 300px;
  height: 300px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  top: -100px;
  right: -100px;
  animation: float 6s ease-in-out infinite;
}

.login-container::after {
  content: '';
  position: absolute;
  width: 200px;
  height: 200px;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 50%;
  bottom: -50px;
  left: -50px;
  animation: float 8s ease-in-out infinite reverse;
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-20px); }
}

.login-card {
  background: white;
  border-radius: 24px;
  padding: 40px 30px;
  width: 100%;
  max-width: 420px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  position: relative;
  z-index: 1;
  animation: slideUp 0.5s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.logo-container {
  text-align: center;
  margin-bottom: 40px;
}

.logo-icon {
  font-size: 64px;
  color: #667eea;
  margin-bottom: 16px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.app-title {
  font-size: 28px;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
  margin-bottom: 8px;
}

.app-subtitle {
  font-size: 16px;
  color: #718096;
  margin: 0;
  font-weight: 400;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-wrapper {
  position: relative;
  animation: fadeIn 0.6s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.custom-input {
  --background: #f7fafc;
  --border-radius: 12px;
  --padding-start: 16px;
  --padding-end: 16px;
  font-size: 16px;
  transition: all 0.3s ease;
}

.custom-input::part(native) {
  border: 2px solid #e2e8f0;
  transition: all 0.3s ease;
}

.custom-input:focus-within::part(native),
.custom-input.has-focus::part(native) {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

ion-icon[slot="start"] {
  font-size: 20px;
  color: #a0aec0;
  margin-right: 12px;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fff5f5;
  border-radius: 8px;
  font-size: 14px;
  animation: shake 0.5s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.error-message ion-icon {
  font-size: 20px;
}

.login-button {
  --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --background-hover: linear-gradient(135deg, #5568d3 0%, #6a3f91 100%);
  --border-radius: 12px;
  --box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  height: 52px;
  font-size: 16px;
  font-weight: 600;
  text-transform: none;
  letter-spacing: 0.5px;
  margin-top: 8px;
  transition: all 0.3s ease;
}

.login-button:hover:not([disabled]) {
  transform: translateY(-2px);
  --box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.login-button:active:not([disabled]) {
  transform: translateY(0);
}

.login-button[disabled] {
  opacity: 0.7;
}

ion-spinner {
  --color: white;
}

.footer-links {
  text-align: center;
  margin-top: 8px;
}

.link-text {
  color: #667eea;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
  transition: color 0.3s ease;
}

.link-text:hover {
  color: #5568d3;
  text-decoration: underline;
}

/* Responsive adjustments */
@media (max-width: 480px) {
  .login-card {
    padding: 32px 24px;
  }

  .app-title {
    font-size: 24px;
  }

  .logo-icon {
    font-size: 56px;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .login-card {
    background: #1a202c;
  }

  .app-title {
    color: #f7fafc;
  }

  .app-subtitle {
    color: #cbd5e0;
  }

  .custom-input {
    --background: #2d3748;
  }

  .custom-input::part(native) {
    border-color: #4a5568;
    color: #f7fafc;
  }

  ion-icon[slot="start"] {
    color: #a0aec0;
  }

  .error-message {
    background: rgba(254, 178, 178, 0.1);
  }
}
</style>