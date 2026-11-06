import { ErrorNotice } from '../components/Feedback'
import { PageHeader } from '../components/PageHeader'
import {
  DayNavigation,
  EditorDialog,
  NoticeBanner,
  SidebarPanel,
  ToolbarPanel,
} from '../components/Schedule/SchedulePanels'
import { CalendarCard, DayFooter } from '../components/Schedule/ScheduleCalendar'
import { UndoToast } from '../components/Schedule/UndoToast'
import { useSchedule } from '../hooks/useSchedule'

export function SchedulePage() {
  const s = useSchedule()

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-8 lg:py-10">
      <PageHeader
        eyebrow="05 · Agenda"
        title="Cronograma"
        subtitle="Arrastrá tareas o arrastrá sobre la grilla para crear bloques; agendá automáticamente y compará lo planificado con el tiempo real."
        actions={<DayNavigation s={s} />}
      />

      <ToolbarPanel s={s} />

      <ErrorNotice message={s.error} />
      <NoticeBanner s={s} />

      <div className="mt-6 flex flex-col gap-4 lg:flex-row lg:items-start">
        <SidebarPanel s={s} />

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <CalendarCard s={s} />
          <DayFooter s={s} />
        </div>
      </div>

      <EditorDialog s={s} />

      {s.undo ? <UndoToast action={s.undo} onUndo={() => void s.runUndo()} onDismiss={s.dismissUndo} /> : null}
    </section>
  )
}
