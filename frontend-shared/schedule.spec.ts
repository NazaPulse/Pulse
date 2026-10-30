import {
  DAY_MINUTES,
  DEFAULT_PREFS,
  autoSchedule,
  planningWindow,
  autoScheduleMessage,
  blockFormError,
  blockFormValues,
  buildCreateBlockPayload,
  buildUpdateBlockPayload,
  busySpans,
  clippedEdges,
  copyBlocksToDay,
  daySummary,
  findSlot,
  hourMarks,
  isPastDeadline,
  keyboardSpan,
  loadSchedulePrefs,
  magnetize,
  nextFreeSlotFor,
  pushFollowing,
  shouldCompleteTask,
  updateWorkHours,
  viewWindow,
  weekDays,
  weekStart,
  actualRatio,
  assignLanes,
  blockFromTask,
  blockSpan,
  dragSpan,
  findConflicts,
  formatMinute,
  initialScrollMinute,
  isOverrun,
  loadFocusTarget,
  minuteAtPointer,
  nowMinute,
  saveFocusTarget,
  spanStyle,
} from './schedule'
import type { Task, TimeBlock } from './types'

const DAY = new Date(2026, 9, 28)
const at = (hour: number, minute = 0) => new Date(2026, 9, 28, hour, minute).toISOString()

function block(id: string, start: string, end: string, over: Partial<TimeBlock> = {}): TimeBlock {
  return {
    id,
    title: id,
    description: null,
    start_time: start,
    end_time: end,
    actual_duration_minutes: 0,
    category: 'work',
    task_id: null,
    is_completed: false,
    user_id: 'u',
    ...over,
  }
}

describe('schedule', () => {
  it('ubica un bloque en la grilla de 24 h', () => {
    const span = blockSpan(block('a', at(6), at(12)), DAY)
    expect(span).toEqual({ start: 360, end: 720 })
    expect(spanStyle(span)).toEqual({ left: '25%', width: '25%' })
  })

  it('detecta conflictos solo cuando las franjas se superponen', () => {
    const blocks = [
      block('a', at(9), at(10)),
      block('b', at(10), at(11)), // se toca con `a`: no es conflicto
      block('c', at(10, 30), at(12)),
    ]
    expect([...findConflicts(blocks)].sort()).toEqual(['b', 'c'])
  })
})

describe('schedule', () => {
  it('apila en carriles distintos los bloques superpuestos', () => {
    const { lanes, laneCount } = assignLanes([
      block('a', at(9), at(11)),
      block('b', at(10), at(12)),
      block('c', at(11), at(13)),
    ])
    expect(laneCount).toBe(2)
    expect(lanes.get('a')).toBe(0)
    expect(lanes.get('b')).toBe(1)
    expect(lanes.get('c')).toBe(0)
  })
})

describe('schedule', () => {
  it('redimensiona con paso de 15 min y respeta la duración mínima y los límites del día', () => {
    const span = { start: 600, end: 660 }
    expect(dragSpan(span, 'end', 37)).toEqual({ start: 600, end: 690 })
    expect(dragSpan(span, 'start', 120)).toEqual({ start: 645, end: 660 })
    expect(dragSpan(span, 'move', -900)).toEqual({ start: 0, end: 60 })
    expect(dragSpan(span, 'end', 2000)).toEqual({ start: 600, end: DAY_MINUTES })
  })

  it('convierte la posición del puntero en un minuto ajustado', () => {
    expect(minuteAtPointer(150, { left: 100, width: 1440 })).toBe(45)
    expect(minuteAtPointer(5000, { left: 0, width: 1440 })).toBe(DAY_MINUTES - 15)
  })

  it('crea un bloque de 1 h desde una tarea soltada', () => {
    const task = { id: 't1', title: 'Informe' } as Task
    expect(blockFromTask(task, DAY, 547)).toEqual({
      title: 'Informe',
      category: 'work',
      task_id: 't1',
      start_time: at(9, 0),
      end_time: at(10, 0),
    })
  })
})

describe('schedule', () => {
  it('compara minutos reales contra el plan', () => {
    const b = block('a', at(9), at(10), { actual_duration_minutes: 30 })
    expect(actualRatio(b)).toBe(0.5)
    expect(isOverrun(b)).toBe(false)
    expect(actualRatio({ ...b, actual_duration_minutes: 90 })).toBe(1)
    expect(isOverrun({ ...b, actual_duration_minutes: 90 })).toBe(true)
  })

  it('solo dibuja la línea en vivo en el día actual', () => {
    expect(nowMinute(new Date(2026, 9, 28, 13, 30).getTime(), DAY)).toBe(810)
    expect(nowMinute(new Date(2026, 9, 29, 0, 0).getTime(), DAY)).toBeNull()
    expect(formatMinute(DAY_MINUTES)).toBe('24:00')
  })
})

describe('schedule', () => {
  it('persiste y limpia el objetivo de foco del Pomodoro', () => {
    const data = new Map<string, string>()
    const storage = {
      getItem: (k: string) => data.get(k) ?? null,
      setItem: (k: string, v: string) => void data.set(k, v),
      removeItem: (k: string) => void data.delete(k),
    }
    saveFocusTarget({ blockId: 'b1', title: 'Informe', actualMinutes: 25 }, storage)
    expect(loadFocusTarget(storage)).toEqual({ blockId: 'b1', title: 'Informe', actualMinutes: 25 })
    saveFocusTarget(null, storage)
    expect(loadFocusTarget(storage)).toBeNull()
  })
})

describe('initialScrollMinute', () => {
  it('arranca una hora antes de ahora, del primer bloque o de las 08:00', () => {
    expect(initialScrollMinute(690, [], DAY)).toBe(630)
    expect(initialScrollMinute(null, [block('a', at(14), at(15))], DAY)).toBe(780)
    expect(initialScrollMinute(null, [], DAY)).toBe(420)
    expect(initialScrollMinute(30, [], DAY)).toBe(0)
  })
})

const task = (id: string, over: Partial<Task> = {}): Task => ({
  id,
  title: id,
  description: null,
  priority: 'medium',
  status: 'pending',
  due_date: null,
  estimated_minutes: null,
  user_id: 'u',
  created_at: '2026-10-01T00:00:00.000Z',
  updated_at: '2026-10-01T00:00:00.000Z',
  ...over,
})

describe('zoom', () => {
  const work = viewWindow('work', { start: 540, end: 1080 })

  it('ubica y recorta los bloques a la ventana laboral', () => {
    expect(hourMarks(work)).toEqual([540, 600, 660, 720, 780, 840, 900, 960, 1020, 1080])
    expect(spanStyle({ start: 480, end: 600 }, work)).toEqual({ left: '0%', width: `${(60 / 540) * 100}%` })
    expect(clippedEdges({ start: 480, end: 600 }, work)).toEqual({ before: true, after: false })
    expect(minuteAtPointer(0, { left: 0, width: 540 }, work)).toBe(540)
  })
})

describe('imán y teclado', () => {
  it('pega el borde arrastrado al de un vecino cercano', () => {
    const others = [{ start: 600, end: 660 }]
    expect(magnetize({ start: 665, end: 725 }, 'move', others)).toEqual({ start: 660, end: 720 })
    expect(magnetize({ start: 480, end: 595 }, 'end', others)).toEqual({ start: 480, end: 600 })
    expect(magnetize({ start: 700, end: 760 }, 'move', others)).toEqual({ start: 700, end: 760 })
  })

  it('mueve con flechas y redimensiona con Shift/Alt', () => {
    const span = { start: 600, end: 660 }
    expect(keyboardSpan(span, 'ArrowRight', { shift: false, alt: false })).toEqual({ start: 615, end: 675 })
    expect(keyboardSpan(span, 'ArrowLeft', { shift: true, alt: false })).toEqual({ start: 600, end: 645 })
    expect(keyboardSpan(span, 'ArrowLeft', { shift: false, alt: true })).toEqual({ start: 585, end: 660 })
    expect(keyboardSpan(span, 'Enter', { shift: false, alt: false })).toBeNull()
  })
})

describe('planificación inteligente', () => {
  it('encuentra el primer hueco libre ajustado a la grilla', () => {
    const busy = busySpans([block('a', at(9), at(10)), block('b', at(9, 30), at(11, 10))], DAY)
    expect(busy).toEqual([{ start: 540, end: 670 }])
    expect(findSlot(60, busy, { start: 540, end: 1080 })).toEqual({ start: 675, end: 735 })
    expect(findSlot(600, busy, { start: 540, end: 1080 })).toBeNull()
  })

  it('agenda por prioridad y vencimiento, respetando lo ya agendado y el horario', () => {
    const tasks = [
      task('baja', { priority: 'low' }),
      task('alta-tarde', { priority: 'high', due_date: '2026-11-10T00:00:00.000Z' }),
      task('alta-pronto', { priority: 'high', due_date: '2026-10-29T00:00:00.000Z', estimated_minutes: 90 }),
      task('ya', { priority: 'high' }),
      task('hecha', { status: 'completed' }),
    ]
    const blocks = [block('ya-b', at(9), at(10), { task_id: 'ya' })]
    const { planned, skipped } = autoSchedule(tasks, blocks, DAY, planningWindow({ start: 540, end: 780 }, null))
    expect(planned.map((p) => [p.task_id, p.start_time, p.end_time])).toEqual([
      ['alta-pronto', at(10), at(11, 30)],
      ['alta-tarde', at(11, 30), at(12, 30)],
    ])
    expect(skipped.map((t) => t.id)).toEqual(['baja'])
    expect(autoScheduleMessage(2, 1)).toBe('2 tareas agendadas; 1 no entraron en el horario laboral.')
  })
})

describe('planificación inteligente', () => {
  it('arranca desde ahora cuando el día es hoy', () => {
    const { planned } = autoSchedule([task('t')], [], DAY, planningWindow({ start: 540, end: 1080 }, 700))
    expect(planned[0].start_time).toBe(at(11, 45))
  })

  it('resuelve conflictos moviendo al siguiente hueco o corriendo los siguientes', () => {
    const a = block('a', at(9), at(11))
    const b = block('b', at(10, 30), at(12))
    const c = block('c', at(12), at(13))
    expect(nextFreeSlotFor(b, [a, b, c], DAY)).toEqual({ start: 780, end: 870 })
    expect(pushFollowing(a, [a, b, c], DAY).map((m) => [m.block.id, m.span])).toEqual([
      ['b', { start: 660, end: 750 }],
      ['c', { start: 750, end: 810 }],
    ])
  })

  it('marca los bloques agendados después del vencimiento de su tarea', () => {
    const tasks = new Map([['t', task('t', { due_date: at(10, 30) })]])
    expect(isPastDeadline(block('a', at(10), at(11), { task_id: 't' }), tasks)).toBe(true)
    expect(isPastDeadline(block('a', at(9), at(10), { task_id: 't' }), tasks)).toBe(false)
  })
})

describe('copiar día, resumen y semana', () => {
  it('copia los bloques que empiezan ayer a la misma hora de hoy', () => {
    const yesterday = new Date(2026, 9, 27)
    const blocks = [
      block('dormir', new Date(2026, 9, 26, 23).toISOString(), new Date(2026, 9, 27, 7).toISOString()),
      block('gym', new Date(2026, 9, 27, 8).toISOString(), new Date(2026, 9, 27, 9).toISOString(), { actual_duration_minutes: 60 }),
    ]
    expect(copyBlocksToDay(blocks, yesterday, DAY)).toEqual([
      { title: 'gym', category: 'work', start_time: at(8), end_time: at(9) },
    ])
  })

  it('resume planificado vs. real por categoría', () => {
    const summary = daySummary([
      block('a', at(9), at(11), { actual_duration_minutes: 60 }),
      block('b', at(11), at(12), { actual_duration_minutes: 90 }),
      block('c', at(18), at(19), { category: 'exercise' }),
    ])
    expect(summary.rows).toEqual([
      { category: 'work', planned: 180, actual: 150 },
      { category: 'exercise', planned: 60, actual: 0 },
    ])
    expect(summary.adherence).toBe(50)
  })
})

describe('copiar día, resumen y semana', () => {
  it('la semana empieza el lunes', () => {
    expect(weekStart(DAY)).toEqual(new Date(2026, 9, 26))
    expect(weekDays(DAY)).toHaveLength(7)
  })
})

describe('formulario de bloque', () => {
  it('valida horas y permite cruzar la medianoche', () => {
    const values = blockFormValues(null, DAY, { start: 1380, end: 1440 })
    expect(values).toMatchObject({ start: '23:00', end: '00:00', endsNextDay: true })
    const night = { ...values, title: 'Dormir', end: '07:00' }
    expect(blockFormError(night)).toBeNull()
    expect(buildCreateBlockPayload(night, DAY)).toMatchObject({
      start_time: at(23),
      end_time: new Date(2026, 9, 29, 7).toISOString(),
    })
    expect(blockFormError({ ...night, endsNextDay: false })).toMatch(/posterior/)
    expect(blockFormError({ ...night, actualMinutes: '-3' })).toMatch(/minutos reales/)
    expect(buildUpdateBlockPayload({ ...night, description: '  ' }, DAY).description).toBeNull()
  })

  it('ofrece completar la tarea solo al marcar completado un bloque con tarea pendiente', () => {
    const b = block('a', at(9), at(10), { task_id: 't' })
    const tasks = new Map([['t', task('t')]])
    const values = { ...blockFormValues(b, DAY), isCompleted: true }
    expect(shouldCompleteTask(b, values, tasks)).toBe(true)
    expect(shouldCompleteTask(b, { ...values, completeTask: false }, tasks)).toBe(false)
  })
})

describe('preferencias', () => {
  it('descarta valores inválidos y mantiene inicio < fin', () => {
    const storage = { getItem: () => JSON.stringify({ mode: 'week', zoom: 'x', workHours: { start: 600, end: 500 } }) }
    expect(loadSchedulePrefs(storage)).toEqual({ ...DEFAULT_PREFS, mode: 'week' })
    expect(updateWorkHours({ start: 540, end: 600 }, 'start', 660)).toEqual({ start: 660, end: 720 })
  })
})
