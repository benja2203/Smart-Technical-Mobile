import { createRouter, createWebHistory } from '@ionic/vue-router';
import TabsPage from '@/views/TabsPage.vue';
import { useAuth } from '@/store/auth';

const routes = [
  { path: '/login', component: () => import('@/pages/Login.vue') },

  {
    path: '/tabs/',
    component: TabsPage,
    meta: { auth: true },
    children: [
      { path: '', redirect: '/tabs/home' },
      { path: 'home', component: () => import('@/pages/Home.vue') },
      { path: 'tickets', component: () => import('@/pages/Tickets.vue') },
      { path: 'map', component: () => import('@/pages/Map.vue') },
      { path: 'calendar', component: () => import('@/pages/Calendar.vue') },
    ]
  },

  // Rutas accesibles desde el menú (fuera de tabs)
  { path: '/menu/grafana', component: () => import('@/pages/Grafana.vue'), meta: { auth: true } },

  { path: '/', redirect: '/tabs' }
];

const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes });

router.beforeEach((to) => {
  const auth = useAuth(); auth.boot();
  if (to.meta.auth && !auth.access) return '/login';
});

export default router;
