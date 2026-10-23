type EcgLineProps = {
  d: string
  viewBox: string
  className: string
  strokeWidth?: number
  /** Opacidad de la línea base (la que queda siempre visible). */
  baseOpacity?: number
  baseClass?: string
  /** Color y tramo (`longitud espacio`) del destello que recorre la línea. */
  runnerColor?: string
  dash?: string
  runnerClass?: string
  preserveAspectRatio?: string
}

/** Pulso electrocardiográfico: línea cian tenue con un destello animado que la recorre. */
export function EcgLine(props: EcgLineProps) {
  const {
    d,
    viewBox,
    className,
    strokeWidth = 1.5,
    baseOpacity = 0.35,
    baseClass,
    runnerColor = '#00F0FF',
    dash = '26 174',
    runnerClass = 'drop-shadow-[0_0_3px_#00F0FF]',
    preserveAspectRatio,
  } = props
  const stroke = { d, fill: 'none', strokeWidth, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

  return (
    <svg viewBox={viewBox} fill="none" className={className} preserveAspectRatio={preserveAspectRatio} aria-hidden="true">
      <path {...stroke} stroke="#00F0FF" strokeOpacity={baseOpacity} className={baseClass} />
      <path
        {...stroke}
        stroke={runnerColor}
        pathLength={200}
        strokeDasharray={dash}
        className={`animate-ecg ${runnerClass}`}
      />
    </svg>
  )
}
