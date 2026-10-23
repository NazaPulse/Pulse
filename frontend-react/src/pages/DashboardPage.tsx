import { DashboardContent } from '../components/dashboard/DashboardContent'
import { DashboardModals } from '../components/dashboard/DashboardModals'
import { ErrorNotice, LoadingBlock } from '../components/Feedback'
import { PageHeader } from '../components/PageHeader'
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

      <ErrorNotice message={error} />

      {loading ? (
        <LoadingBlock />
      ) : (
        <DashboardContent data={data} modals={modals} />
      )}

      <DashboardModals data={data} modals={modals} />
    </section>
  )
}
