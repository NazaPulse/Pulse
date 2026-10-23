// Configuración de interfaz común a ambos frontends: navegación, portada de acceso y trazos del
// electrocardiograma de la marca.
import type { IconName } from './icons'

export const NAV_ITEMS: { to: string; label: string; icon: IconName }[] = [
  { to: '/dashboard', label: 'Finanzas', icon: 'finance' },
  { to: '/tasks', label: 'Tareas', icon: 'tasks' },
  { to: '/notes', label: 'Notas', icon: 'notes' },
  { to: '/pomodoro', label: 'Pomodoro', icon: 'timer' },
]

export const AUTH_FEATURES: { icon: IconName; title: string; text: string }[] = [
  { icon: 'finance', title: 'Finanzas por sobres', text: 'Cuentas, presupuestos y movimientos en un solo tablero.' },
  { icon: 'tasks', title: 'Tareas con prioridad', text: 'Organizá el día y no pierdas ningún vencimiento.' },
  { icon: 'notes', title: 'Notas y audios', text: 'Ideas en texto o grabadas con tu voz.' },
  { icon: 'timer', title: 'Foco con Pomodoro', text: 'Bloques de concentración con descansos medidos.' },
]

/** Trazos del pulso electrocardiográfico (logo, barra lateral y portada). */
export const ECG_PATHS = {
  logo: 'M2 12h5l2.5-6 4 12 2.5-6H22',
  sidebar: 'M0 18h52l10-14 14 28 12-14h112',
  hero: 'M0 70h230l24-46 34 92 28-46h284',
} as const

/** Desplazamiento suave hacia un elemento de la página (portada de acceso). */
export function scrollToId(id: string): void {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function scrollToTop(): void {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
