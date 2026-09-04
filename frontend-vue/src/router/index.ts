import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import { hasToken } from '../auth/useAuth'
import DashboardView from '../pages/DashboardView.vue'
import LoginView from '../pages/LoginView.vue'
import RegisterView from '../pages/RegisterView.vue'

const routes: RouteRecordRaw[] = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { guestOnly: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: DashboardView,
    meta: { requiresAuth: true },
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard: protege /dashboard y evita ver login/register ya autenticado.
router.beforeEach((to) => {
  const authed = hasToken()
  if (to.meta.requiresAuth && !authed) {
    return { path: '/login', replace: true }
  }
  if (to.meta.guestOnly && authed) {
    return { path: '/dashboard', replace: true }
  }
  return true
})
