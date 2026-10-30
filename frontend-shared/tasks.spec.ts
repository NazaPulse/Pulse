import {
  DEFAULT_TASK_VIEW,
  EMPTY_TASK_VALUES,
  addTask,
  buildTaskPayload,
  canSubmitTask,
  dueLabel,
  emptyTasksMessage,
  isOverdue,
  isPastDate,
  nextStatus,
  nowLocalInput,
  patchTask,
  removeTask,
  replaceTask,
  taskCounts,
  visibleTasks,
} from './tasks'
import type { Task } from './types'

const task = (over: Partial<Task>): Task => ({
  id: 't',
  title: 'T',
  description: null,
  priority: 'medium',
  status: 'pending',
  due_date: null,
  estimated_minutes: null,
  user_id: 'u',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  ...over,
})

const LIST = [
  task({ id: 'a', priority: 'low', created_at: '2026-01-01', due_date: '2026-03-01T00:00:00Z' }),
  task({ id: 'b', priority: 'high', created_at: '2026-01-02', status: 'completed' }),
  task({ id: 'c', priority: 'high', created_at: '2026-01-03', due_date: '2026-02-01T00:00:00Z' }),
]
const ids = (tasks: Task[]) => tasks.map((t) => t.id)

const view = (over: Partial<typeof DEFAULT_TASK_VIEW>) => ({ ...DEFAULT_TASK_VIEW, ...over })

describe('lista', () => {
  it('cuenta por estado y filtra', () => {
    expect(taskCounts(LIST)).toEqual({ all: 3, pending: 2, completed: 1 })
    expect(ids(visibleTasks(LIST, view({ status: 'completed' })))).toEqual(['b'])
  })

  it('el filtro de prioridad acota la lista y los contadores', () => {
    expect(taskCounts(LIST, 'high')).toEqual({ all: 2, pending: 1, completed: 1 })
    expect(ids(visibleTasks(LIST, view({ priority: 'low' })))).toEqual(['a'])
    expect(ids(visibleTasks(LIST, view({ priority: 'high', status: 'pending' })))).toEqual(['c'])
  })

  it('ordena por creación, prioridad (desempata por vencimiento) y vencimiento (sin fecha al final)', () => {
    expect(ids(visibleTasks(LIST, view({ sort: 'created' })))).toEqual(['c', 'b', 'a'])
    expect(ids(visibleTasks(LIST, view({ sort: 'priority' })))).toEqual(['c', 'b', 'a'])
    expect(ids(visibleTasks(LIST, view({ sort: 'due_date' })))).toEqual(['c', 'a', 'b'])
  })

  it('no modifica la lista original', () => {
    const copy = [...LIST]
    visibleTasks(LIST, view({ sort: 'priority' }))
    expect(LIST).toEqual(copy)
  })
})

describe('lista', () => {
  it('mensaje de lista vacía según el filtro', () => {
    expect(emptyTasksMessage(view({ status: 'pending' }))).toContain('pendientes')
    expect(emptyTasksMessage(view({ status: 'completed' }))).toContain('completaste')
    expect(emptyTasksMessage(view({ priority: 'low' }))).toContain('esa prioridad')
    expect(emptyTasksMessage(DEFAULT_TASK_VIEW)).toContain('Nueva tarea')
  })
})

describe('cambios locales', () => {
  it('alterna el estado y aplica/revierte parches', () => {
    expect(nextStatus(LIST[0])).toBe('completed')
    expect(nextStatus(LIST[1])).toBe('pending')
    expect(patchTask(LIST, 'a', { status: 'completed' })[0].status).toBe('completed')
    expect(patchTask(LIST, 'zzz', { status: 'completed' })).toEqual(LIST)
  })

  it('reemplaza, agrega y quita por id', () => {
    const updated = task({ id: 'a', title: 'Nuevo' })
    expect(replaceTask(LIST, updated)[0].title).toBe('Nuevo')
    expect(ids(addTask(LIST, task({ id: 'z' })))).toEqual(['z', 'a', 'b', 'c'])
    expect(ids(removeTask(LIST, 'b'))).toEqual(['a', 'c'])
  })
})

describe('vencimiento', () => {
  const now = new Date('2026-02-15T00:00:00Z').getTime()

  it('una tarea pendiente con fecha pasada está vencida; una completada no', () => {
    expect(isOverdue(LIST[2], now)).toBe(true)
    expect(isOverdue(task({ due_date: '2026-02-01T00:00:00Z', status: 'completed' }), now)).toBe(false)
    expect(isOverdue(LIST[1], now)).toBe(false)
  })

  it('la leyenda indica "Vencida" o "Vence" y es nula sin fecha', () => {
    expect(dueLabel(LIST[2], now)).toMatchObject({ overdue: true })
    expect(dueLabel(LIST[2], now)?.text).toMatch(/^Vencida · /)
    expect(dueLabel(LIST[0], now)?.text).toMatch(/^Vence /)
    expect(dueLabel(LIST[1], now)).toBeNull()
  })
})

describe('formulario', () => {
  it('no se envía vacío, con título largo ni con fecha pasada', () => {
    expect(canSubmitTask(EMPTY_TASK_VALUES)).toBe(false)
    expect(canSubmitTask({ ...EMPTY_TASK_VALUES, title: 'x'.repeat(201) })).toBe(false)
    expect(canSubmitTask({ ...EMPTY_TASK_VALUES, title: 'Ok', dueDate: '2000-01-01T10:00' })).toBe(false)
    expect(canSubmitTask({ ...EMPTY_TASK_VALUES, title: 'Ok' })).toBe(true)
  })
})

describe('formulario', () => {
  it('arma el cuerpo recortando textos y omitiendo lo vacío', () => {
    expect(buildTaskPayload({ ...EMPTY_TASK_VALUES, title: ' Pagar ', priority: 'high' })).toEqual({
      title: 'Pagar',
      priority: 'high',
    })
    const full = buildTaskPayload({
      title: 'A',
      description: ' d ',
      priority: 'low',
      dueDate: '2099-05-05T10:30',
      estimatedMinutes: ' 90 ',
    })
    expect(full).toMatchObject({
      description: 'd',
      due_date: new Date('2099-05-05T10:30').toISOString(),
      estimated_minutes: 90,
    })
  })
})

describe('formulario', () => {
  it('valida la duración estimada (vacía o de 5 a 1440 min)', () => {
    const base = { ...EMPTY_TASK_VALUES, title: 'Ok' }
    expect(canSubmitTask({ ...base, estimatedMinutes: '45' })).toBe(true)
    expect(canSubmitTask({ ...base, estimatedMinutes: '3' })).toBe(false)
    expect(canSubmitTask({ ...base, estimatedMinutes: '1.5' })).toBe(false)
    expect(canSubmitTask({ ...base, estimatedMinutes: '2000' })).toBe(false)
  })

  it('isPastDate y nowLocalInput', () => {
    expect(isPastDate('')).toBe(false)
    expect(isPastDate('2000-01-01T00:00')).toBe(true)
    expect(nowLocalInput(new Date(2026, 0, 2, 3, 4))).toBe('2026-01-02T03:04')
  })
})
