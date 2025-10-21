// src/router/index.ts
import { createRouter, createWebHistory } from '@ionic/vue-router'
import TabsPage from '@/views/TabsPage.vue'
import { useAuth } from '@/store/auth'

const routes = [
  // Login
  { path: '/login', component: () => import('@/pages/Login.vue') },

  // Tabs
  {
    path: '/tabs/',
    component: TabsPage,
    meta: { auth: true },
    children: [
      { path: '', redirect: '/tabs/home' },
      { path: 'home', component: () => import('@/pages/Home.vue') },
      { path: 'tickets', component: () => import('@/pages/Tickets.vue') },
      // Redirección legacy (por si algún enlace viejo apunta a RouteMap)
      { path: 'gmap', component: () => import('@/pages/MapGoogle.vue') },
      { path: 'calendar', component: () => import('@/pages/Calendar.vue') },
    ],
  },

  // Rutas accesibles desde el menú (fuera de tabs) — agrega aquí si tienes otras

  // Root → tabs
  { path: '/', redirect: '/tabs' },

  // Catch-all opcional para evitar pantallas en negro en rutas desconocidas
  { path: '/:pathMatch(.*)*', redirect: '/tabs' },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuth()
  auth.boot()
  if (to.meta.auth && !auth.access) return '/login'
})

export default router
