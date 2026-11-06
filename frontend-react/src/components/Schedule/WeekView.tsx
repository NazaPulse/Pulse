import * as schedule from '@shared/schedule'
import type { TimeBlock } from '../../types/productivity'

type WeekViewProps = {
  day: Date
  blocks: TimeBlock[]
  conflicts: ReadonlySet<string>
  today: Date
  onOpenDay: (day: Date) => void
}

const MARKS = [0, 6, 12, 18, 24].map((hour) => hour * 60)

function markClass(minute: number): string {
  if (minute === 0) return ''
  return minute === schedule.DAY_MINUTES ? '-translate-x-full' : '-translate-x-1/2'
}

/** Mismo esqueleto que las filas (etiqueta + pista) para que las horas queden alineadas. */
function WeekHeader() {
  return (
    <div className="flex gap-3 border border-transparent px-2" aria-hidden="true">
      <span className="w-20 shrink-0" />
      <div className="relative h-5 flex-1">
        {MARKS.map((minute) => (
          <span
            key={minute}
            className={`absolute font-mono text-[0.625rem] text-fg-dim ${markClass(minute)}`}
            style={{ left: schedule.minuteToPercent(minute) }}
          >
            {schedule.formatMinute(minute)}
          </span>
        ))}
      </div>
    </div>
  )
}

type DayBlocksProps = {
  date: Date
  blocks: TimeBlock[]
  conflicts: ReadonlySet<string>
}

function WeekBlock({ block, date, conflict }: { block: TimeBlock; date: Date; conflict: boolean }) {
  const colors = schedule.blockColors(block.category, conflict)
  const span = schedule.blockSpan(block, date)
  return (
    <span
      title={`${block.title} · ${schedule.spanLabel(span)}`}
      className="absolute inset-y-1 overflow-hidden rounded border"
      style={{ ...schedule.spanStyle(span), ...colors.planned }}
    >
      <span
        className="absolute bottom-0 left-0 h-1"
        style={{
          width: `${schedule.actualRatio(block) * 100}%`,
          ...colors.actual,
        }}
      />
    </span>
  )
}

/** Pista de 24 h con los bloques del día. */
function DayTrack({ date, blocks, conflicts }: DayBlocksProps) {
  return (
    <span
      className="relative h-8 flex-1 rounded-md"
      style={{
        backgroundImage: schedule.gridStyle(schedule.FULL_DAY, 'day').backgroundImage,
        backgroundSize: 'calc(100% / 24) 100%',
      }}
    >
      {blocks.map((block) => (
        <WeekBlock key={block.id} block={block} date={date} conflict={conflicts.has(block.id)} />
      ))}
    </span>
  )
}

function DayLabel({ date, isToday, planned }: { date: Date; isToday: boolean; planned: number }) {
  return (
    <span className="w-20 shrink-0">
      <span className={`block text-xs font-semibold ${isToday ? 'text-accent' : 'text-fg-soft'}`}>
        {schedule.shortDayLabel(date)}
      </span>
      <span className="block font-mono text-[0.625rem] text-fg-dim">{schedule.durationLabel(planned)}</span>
    </span>
  )
}

type WeekDayRowProps = DayBlocksProps & {
  isToday: boolean
  onOpenDay: (day: Date) => void
}

function WeekDayRow(props: WeekDayRowProps) {
  const { date, blocks, isToday } = props
  const planned = blocks.reduce((sum, block) => sum + schedule.plannedMinutes(block), 0)
  return (
    <button
      type="button"
      onClick={() => props.onOpenDay(date)}
      className={`group flex items-center gap-3 rounded-lg border px-2 py-1.5 text-left transition hover:border-accent/50 ${isToday ? 'border-accent/40 bg-accent/5' : 'border-line'}`}
    >
      <DayLabel date={date} isToday={isToday} planned={planned} />
      <DayTrack date={date} blocks={blocks} conflicts={props.conflicts} />
    </button>
  )
}

/** Semana de lunes a domingo: una fila de 24 h por día; clic en una fila abre ese día. */
export function WeekView(props: WeekViewProps) {
  const { blocks, conflicts, today } = props
  return (
    <div className="flex flex-col gap-1.5 p-4">
      <WeekHeader />

      {schedule.weekDays(props.day).map((date) => (
        <WeekDayRow
          key={date.toISOString()}
          date={date}
          blocks={schedule.blocksOnDay(blocks, date)}
          conflicts={conflicts}
          isToday={schedule.isSameDay(date, today)}
          onOpenDay={props.onOpenDay}
        />
      ))}
    </div>
  )
}
