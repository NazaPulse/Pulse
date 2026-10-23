import type { ReactNode } from 'react'

type ProgressRingProps = {
  /** Fracción completada, de 0 a 1. */
  progress: number
  /** Clase de color del trazo (p. ej. `text-danger-soft`). */
  colorClass: string
  children: ReactNode
}

const SIZE = 280
const STROKE = 12
const RADIUS = (SIZE - STROKE) / 2 - 14
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function ProgressRing({ progress, colorClass, children }: ProgressRingProps) {
  const clamped = Math.min(1, Math.max(0, progress))

  return (
    <div className="relative mx-auto aspect-square w-full max-w-[280px]">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full w-full -rotate-90"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped * 100)}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS + STROKE / 2 + 7}
          fill="none"
          stroke="#7B8AA0"
          strokeOpacity=".4"
          strokeWidth="1.5"
          strokeDasharray="1 7"
          strokeLinecap="round"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-line-strong"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - clamped)}
          className={`${colorClass} drop-shadow-[0_0_8px_currentColor] transition-[stroke-dashoffset] duration-300 ease-linear`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
