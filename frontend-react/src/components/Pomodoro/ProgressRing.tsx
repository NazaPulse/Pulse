import type { ReactNode } from 'react'

type ProgressRingProps = {
  /** Fracción completada, de 0 a 1. */
  progress: number
  /** Clase de color del trazo (p. ej. `text-red-500`). */
  colorClass: string
  children: ReactNode
}

const SIZE = 280
const STROKE = 14
const RADIUS = (SIZE - STROKE) / 2
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
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          className="text-slate-200"
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
          className={`${colorClass} transition-[stroke-dashoffset] duration-300 ease-linear`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  )
}
