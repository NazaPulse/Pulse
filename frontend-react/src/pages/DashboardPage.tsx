import { Alert } from '../components/Alert'
import { DashboardContent } from '../components/dashboard/DashboardContent'
import { DashboardModals } from '../components/dashboard/DashboardModals'
import { PageHeader } from '../components/PageHeader'
import { Spinner } from '../components/Spinner'
import { useDashboardModals } from '../hooks/useDashboardModals'
import { useFinanceData } from '../hooks/useFinanceData'

export function DashboardPage() {
  const { data, loading, error, setError, reload } = useFinanceData()
  const modals = useDashboardModals({ reload, onError: setError })

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
      <PageHeader
        eyebrow="01 · Finanzas"
        title="Panel financiero"
        subtitle="Tus métricas, cuentas, sobres de presupuesto y movimientos."
      />

      {error ? (
        <div className="mt-6">
          <Alert variant="error">{error}</Alert>
        </div>
      ) : null}

      {loading ? (
        <div className="mt-16 flex justify-center">
          <Spinner className="h-8 w-8 text-accent" />
        </div>
      ) : (
        <DashboardContent data={data} modals={modals} />
      )}

      <DashboardModals data={data} modals={modals} />
    </section>
  )
}
