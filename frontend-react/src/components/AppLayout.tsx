import { NavLink, Outlet, useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Finanzas' },
  { to: '/tasks', label: 'Tareas' },
  { to: '/notes', label: 'Notas' },
  { to: '/pomodoro', label: 'Pomodoro' },
]

/** Estructura común de las rutas protegidas: cabecera, navegación y contenido. */
export function AppLayout() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <main className="min-h-screen bg-slate-100 pb-16">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-sm font-bold text-white">
              P
            </div>
            <span className="font-semibold text-slate-900">Pulse</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
          >
            Cerrar sesión
          </button>
        </div>
        <nav
          aria-label="Secciones"
          className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 sm:px-6"
        >
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [
                  'whitespace-nowrap border-b-2 px-3 pb-2.5 pt-1 text-sm font-medium transition',
                  isActive
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800',
                ].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <Outlet />
    </main>
  )
}
