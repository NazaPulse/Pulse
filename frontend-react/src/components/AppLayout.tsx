import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { ECG_PATHS, NAV_ITEMS } from '@shared/uiConfig'
import { useAuth } from '../auth/useAuth'
import { EcgLine } from './EcgLine'
import { Icon } from './Icon'
import { PulseLogo } from './PulseLogo'

type LogoutProps = { onLogout: () => void }

function SessionCard({ onLogout }: LogoutProps) {
  return (
    <div className="m-3 rounded-2xl border border-line bg-surface/70 p-4">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-blink rounded-full bg-ok" aria-hidden="true" />
        <span className="font-mono text-[0.6875rem] uppercase tracking-[0.2em] text-fg-muted">Sesión activa</span>
      </div>
      <EcgLine d={ECG_PATHS.sidebar} viewBox="0 0 200 36" className="mt-3 h-9 w-full" />
      <button
        type="button"
        onClick={onLogout}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-line-strong bg-white/[0.03] px-3 py-2 text-sm font-medium text-fg-soft transition hover:border-danger-soft/50 hover:text-danger-soft"
      >
        <Icon name="logout" className="h-4 w-4" />
        Cerrar sesión
      </button>
    </div>
  )
}

/** Navegación lateral (desktop). */
function Sidebar({ onLogout }: LogoutProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-canvas/80 backdrop-blur-xl lg:flex">
      <div className="px-6 pb-8 pt-7">
        <PulseLogo />
      </div>

      <p className="eyebrow px-6 pb-3 text-fg-dim">Navegación</p>
      <nav aria-label="Secciones" className="flex flex-1 flex-col gap-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} className="nav-link">
            <Icon name={item.icon} />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <SessionCard onLogout={onLogout} />
    </aside>
  )
}

/** Encabezado (móvil). */
function MobileHeader({ onLogout }: LogoutProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-line bg-canvas/80 px-4 py-3 backdrop-blur-xl lg:hidden">
      <PulseLogo compact />
      <button
        type="button"
        onClick={onLogout}
        aria-label="Cerrar sesión"
        className="rounded-lg border border-line-strong bg-white/[0.03] p-2 text-fg-soft transition hover:text-danger-soft"
      >
        <Icon name="logout" className="h-5 w-5" />
      </button>
    </header>
  )
}

/** Barra de pestañas inferior (móvil). */
function TabBar() {
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-5 border-t border-line bg-canvas/90 backdrop-blur-xl lg:hidden"
    >
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.to} to={item.to} className="tab-link">
          <Icon name={item.icon} className="h-6 w-6" />
          {item.label}
        </NavLink>
      ))}
    </nav>
  )
}

/** Estructura común de las rutas protegidas: sidebar (desktop), tab bar (móvil) y contenido. */
export function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen">
      <Sidebar onLogout={handleLogout} />
      <MobileHeader onLogout={handleLogout} />

      <div className="pb-28 lg:pb-12 lg:pl-64">
        <Outlet />
      </div>

      <TabBar />
    </div>
  )
}
