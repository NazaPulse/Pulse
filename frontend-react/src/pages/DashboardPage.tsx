import { Alert } from '../components/Alert'
import { DashboardContent } from '../components/dashboard/DashboardContent'
import { DashboardHeader } from '../components/dashboard/DashboardHeader'
import { DashboardModals } from '../components/dashboard/DashboardModals'
import { Spinner } from '../components/Spinner'
import { useDashboardModals } from '../hooks/useDashboardModals'
import { useFinanceData } from '../hooks/useFinanceData'

export function DashboardPage() {
  const { data, loading, error, setError, reload } = useFinanceData()
  const modals = useDashboardModals({ reload, onError: setError })

  return (
    <main className="min-h-screen bg-slate-100 pb-16">
      <DashboardHeader />

      <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
          Panel financiero
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Tus métricas, cuentas, sobres de presupuesto y movimientos.
        </p>

        {error ? (
          <div className="mt-6">
            <Alert variant="error">{error}</Alert>
          </div>
        ) : null}

        {loading ? (
          <div className="mt-16 flex justify-center">
            <Spinner className="h-8 w-8 text-indigo-600" />
          </div>
        ) : (
          <DashboardContent data={data} modals={modals} />
        )}
      </section>

      <DashboardModals data={data} modals={modals} />
    </main>
  )
}
