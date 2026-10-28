import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

import { hasToken } from '../auth/useAuth'
import AppLayout from '../components/AppLayout.vue'
import DashboardView from '../pages/DashboardView.vue'
import LoginView from '../pages/LoginView.vue'
import NotesView from '../pages/NotesView.vue'
import PomodoroView from '../pages/PomodoroView.vue'
import RegisterView from '../pages/RegisterView.vue'
import ScheduleView from '../pages/ScheduleView.vue'
import TasksView from '../pages/TasksView.vue'

const routes: RouteRecordRaw[] = [
  { path: '/login', name: 'login', component: LoginView, meta: { guestOnly: true } },
  {
    path: '/register',
    name: 'register',
    component: RegisterView,
    meta: { guestOnly: true },
  },
  {
    // Rutas protegidas: comparten cabecera y navegación (AppLayout).
    path: '/',
    redirect: '/login',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: [
      { path: 'dashboard', name: 'dashboard', component: DashboardView },
      { path: 'tasks', name: 'tasks', component: TasksView },
      { path: 'notes', name: 'notes', component: NotesView },
      { path: 'pomodoro', name: 'pomodoro', component: PomodoroView },
      { path: 'schedule', name: 'schedule', component: ScheduleView },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/login' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard: protege las rutas privadas y evita ver login/register ya autenticado.
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
