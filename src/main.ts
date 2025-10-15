import { createApp } from 'vue'
import App from './App.vue'
import router from './router';
import { createPinia } from 'pinia'; 

import { IonicVue } from '@ionic/vue';

import { addIcons } from 'ionicons'
import {
  homeOutline,
  mapOutline,
  listOutline,
  calendarOutline,
  navigateOutline,
} from 'ionicons/icons'

addIcons({
  'home-outline': homeOutline,
  'map-outline': mapOutline,
  'list-outline': listOutline,
  'calendar-outline': calendarOutline,
  'navigate-outline': navigateOutline,
})
import 'leaflet/dist/leaflet.css'

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';
import { useAuth } from './store/auth';

const app = createApp(App)
  .use(IonicVue)
  .use(createPinia())
  .use(router);

useAuth().boot()

router.isReady().then(() => {
  app.mount('#app');
});
