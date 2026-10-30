import { useState } from 'react'

import { deleteDialogDescriptionFor } from '@shared/utils/deleteTarget'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { ErrorNotice, LoadingBlock } from '../components/Feedback'
import { PageHeader } from '../components/PageHeader'
import { TaskFormModal } from '../components/Tasks/TaskFormModal'
import { TaskList } from '../components/Tasks/TaskList'
import { TasksToolbar } from '../components/Tasks/TasksToolbar'
import { useTasks } from '../hooks/useTasks'

type Tasks = ReturnType<typeof useTasks>

function NewTaskButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg bg-accent px-3.5 py-2 text-sm font-semibold text-ink shadow-glow transition hover:bg-accent-hover"
    >
      + Nueva tarea
    </button>
  )
}

function TasksBody({ tasks }: { tasks: Tasks }) {
  return (
    <>
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
            onDelete={tasks.confirmDelete.setTarget}
          />
        )}
      </div>
    </>
  )
}

function NewTaskDialog({ tasks, onClose }: { tasks: Tasks; onClose: () => void }) {
  return (
    <TaskFormModal
      onClose={onClose}
      onSubmit={async (values) => {
        await tasks.create(values)
        onClose()
      }}
    />
  )
}

function DeleteTaskDialog({ tasks }: { tasks: Tasks }) {
  const { target, setTarget, deleting, confirm } = tasks.confirmDelete
  if (!target) return null
  return (
    <ConfirmDialog
      title="Eliminar tarea"
      description={deleteDialogDescriptionFor(target.title)}
      loading={deleting}
      onConfirm={confirm}
      onCancel={() => setTarget(null)}
    />
  )
}

export function TasksPage() {
  const tasks = useTasks()
  const [formOpen, setFormOpen] = useState(false)

  return (
    <section className="mx-auto max-w-6xl px-4 py-8 sm:px-8 lg:py-10">
      <PageHeader
        eyebrow="02 · Productividad"
        title="Tareas"
        subtitle="Marcá una tarea para completarla; el cambio se guarda al instante."
        actions={<NewTaskButton onClick={() => setFormOpen(true)} />}
      />

      <ErrorNotice message={tasks.error} />
      <TasksBody tasks={tasks} />
      {formOpen ? <NewTaskDialog tasks={tasks} onClose={() => setFormOpen(false)} /> : null}
      <DeleteTaskDialog tasks={tasks} />
    </section>
  )
}
