import * as schedule from "@shared/schedule";
import type { TimeBlock } from "../../types/productivity";

type WeekViewProps = {
  day: Date;
  blocks: TimeBlock[];
  conflicts: ReadonlySet<string>;
  today: Date;
  onOpenDay: (day: Date) => void;
};

const MARKS = [0, 6, 12, 18, 24].map((hour) => hour * 60);

/** Semana de lunes a domingo: una fila de 24 h por día; clic en una fila abre ese día. */
export function WeekView({
  day,
  blocks,
  conflicts,
  today,
  onOpenDay,
}: WeekViewProps) {
  return (
    <div className="flex flex-col gap-1.5 p-4">
      {/* Mismo esqueleto que las filas (etiqueta + pista) para que las horas queden alineadas. */}
      <div
        className="flex gap-3 border border-transparent px-2"
        aria-hidden="true"
      >
        <span className="w-20 shrink-0" />
        <div className="relative h-5 flex-1">
          {MARKS.map((minute) => (
            <span
              key={minute}
              className={`absolute font-mono text-[0.625rem] text-fg-dim ${minute === 0 ? "" : minute === schedule.DAY_MINUTES ? "-translate-x-full" : "-translate-x-1/2"}`}
              style={{ left: schedule.minuteToPercent(minute) }}
            >
              {schedule.formatMinute(minute)}
            </span>
          ))}
        </div>
      </div>

      {schedule.weekDays(day).map((date) => {
        const dayBlocks = schedule.blocksOnDay(blocks, date);
        const planned = dayBlocks.reduce(
          (sum, block) => sum + schedule.plannedMinutes(block),
          0,
        );
        const isToday = schedule.isSameDay(date, today);
        return (
          <button
            key={date.toISOString()}
            type="button"
            onClick={() => onOpenDay(date)}
            className={`group flex items-center gap-3 rounded-lg border px-2 py-1.5 text-left transition hover:border-accent/50 ${isToday ? "border-accent/40 bg-accent/5" : "border-line"}`}
          >
            <span className="w-20 shrink-0">
              <span
                className={`block text-xs font-semibold ${isToday ? "text-accent" : "text-fg-soft"}`}
              >
                {schedule.shortDayLabel(date)}
              </span>
              <span className="block font-mono text-[0.625rem] text-fg-dim">
                {schedule.durationLabel(planned)}
              </span>
            </span>
            <span
              className="relative h-8 flex-1 rounded-md"
              style={{
                backgroundImage: schedule.gridStyle(schedule.FULL_DAY, "day")
                  .backgroundImage,
                backgroundSize: "calc(100% / 24) 100%",
              }}
            >
              {dayBlocks.map((block) => {
                const colors = schedule.blockColors(
                  block.category,
                  conflicts.has(block.id),
                );
                return (
                  <span
                    key={block.id}
                    title={`${block.title} · ${schedule.spanLabel(schedule.blockSpan(block, date))}`}
                    className="absolute inset-y-1 overflow-hidden rounded border"
                    style={{
                      ...schedule.spanStyle(schedule.blockSpan(block, date)),
                      ...colors.planned,
                    }}
                  >
                    <span
                      className="absolute bottom-0 left-0 h-1"
                      style={{
                        width: `${schedule.actualRatio(block) * 100}%`,
                        ...colors.actual,
                      }}
                    />
                  </span>
                );
              })}
            </span>
          </button>
        );
      })}
    </div>
  );
}
