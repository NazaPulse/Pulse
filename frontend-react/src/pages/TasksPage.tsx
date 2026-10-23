import { useState } from 'react'

import { deleteDialogDescriptionFor } from '@shared/utils/deleteTarget'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ErrorNotice, LoadingBlock } from '../components/Feedback'
import { PageHeader } from '../components/PageHeader'
import { TaskFormModal } from '../components/Tasks/TaskFormModal'
import { TaskList } from '../components/Tasks/TaskList'
import { TasksToolbar } from '../components/Tasks/TasksToolbar'
import { useTasks } from '../hooks/useTasks'

export function TasksPage() {
  const tasks = useTasks()
  const [formOpen, setFormOpen] = useState(false)
  const { target, setTarget, deleting, confirm } = tasks.confirmDelete

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
      <PageHeader
        eyebrow="02 · Productividad"
        title="Tareas"
        subtitle="Marcá una tarea para completarla; el cambio se guarda al instante."
        actions={
          <button
            type="button"
            onClick={() => setFormOpen(true)}
            className="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-ink shadow-glow transition hover:bg-accent-hover"
          >
            + Nueva tarea
          </button>
        }
      />

      <ErrorNotice message={tasks.error} />

      <div className="mt-6">
        <TasksToolbar view={tasks.view} counts={tasks.counts} onChange={tasks.changeView} />
      </div>

      <div className="mt-4">
        {tasks.loading ? (
          <LoadingBlock />
        ) : (
          <TaskList
            tasks={tasks.visible}
            togglingIds={tasks.togglingIds}
            emptyMessage={tasks.emptyMessage}
            now={tasks.now}
            onToggle={(task) => void tasks.toggle(task)}
            onDelete={setTarget}
          />
        )}
      </div>

      {formOpen ? (
        <TaskFormModal
          onClose={() => setFormOpen(false)}
          onSubmit={async (values) => {
            await tasks.create(values)
            setFormOpen(false)
          }}
        />
      ) : null}

      {target ? (
        <ConfirmDialog
          title="Eliminar tarea"
          description={deleteDialogDescriptionFor(target.title)}
          loading={deleting}
          onConfirm={confirm}
          onCancel={() => setTarget(null)}
        />
      ) : null}
    </section>
  )
}
