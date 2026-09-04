import { useNavigate } from 'react-router-dom'

import { useAuth } from '../auth/useAuth'

export function DashboardPage() {
  const { token, logout } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login', { replace: true })
  }

  const tokenPreview = token ? `${token.slice(0, 24)}…${token.slice(-8)}` : '—'

  return (
    <main className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
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
      </header>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Panel
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Autenticación exitosa. Esta vista es un placeholder protegido.
        </p>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-medium text-slate-700">
            Token de acceso (JWT)
          </h2>
          <code className="mt-2 block break-all rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
            {tokenPreview}
          </code>
          <p className="mt-3 text-xs text-slate-400">
            Guardado en <span className="font-mono">localStorage</span> y enviado
            como <span className="font-mono">Authorization: Bearer</span> en cada
            request.
          </p>
        </div>
      </section>
    </main>
  )
}
