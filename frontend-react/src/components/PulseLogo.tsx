type PulseLogoProps = {
  /** Solo el isotipo con el wordmark, sin la leyenda inferior. */
  compact?: boolean
}

/** Marca "PULSE" con el trazo electrocardiográfico iluminado en cian neón. */
export function PulseLogo({ compact = false }: PulseLogoProps) {
  return (
    <div className="flex items-center gap-3">
      <span className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl border border-accent/40 bg-gradient-to-br from-panel to-canvas shadow-glow-sm">
        <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 overflow-visible" aria-hidden="true">
          <path
            d="M2 12h5l2.5-6 4 12 2.5-6H22"
            stroke="#00F0FF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="drop-shadow-[0_0_4px_#00F0FF]"
          />
          <path
            d="M2 12h5l2.5-6 4 12 2.5-6H22"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            pathLength={200}
            strokeDasharray="14 186"
            className="animate-ecg"
          />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.35rem] font-bold tracking-[0.3em] text-fg [text-shadow:0_0_22px_rgb(0_240_255/0.45)]">
          PULSE
        </span>
        {compact ? null : (
          <span className="mt-1.5 font-mono text-[0.625rem] uppercase tracking-[0.28em] text-fg-dim">
            Gestión personal
          </span>
        )}
      </span>
    </div>
  )
}
