import type { MouseEvent, ReactNode } from 'react'

import { AUTH_FEATURES, ECG_PATHS, scrollToId, scrollToTop } from '@shared/uiConfig'
import { EcgLine } from './EcgLine'
import { Icon } from './Icon'
import { PulseLogo } from './PulseLogo'

type AuthCardProps = {
  title: string
  subtitle: string
  children: ReactNode
  footer?: ReactNode
}

/** Ejecuta `action` en lugar de la navegación por ancla (que alteraría la URL del router). */
const onClick = (action: () => void) => (event: MouseEvent) => {
  event.preventDefault()
  action()
}
const goToAccess = onClick(() => scrollToId('acceso'))

/** Pantalla de acceso: portada de marca arriba y, al deslizar, el formulario. */
export function AuthCard({ title, subtitle, children, footer }: AuthCardProps) {
  return (
    <main>
      <section className="relative flex min-h-screen flex-col overflow-hidden px-5 py-6 sm:px-10">
        <header className="relative z-10 flex items-center justify-between gap-4">
          <PulseLogo />
          <a
            href="#acceso"
            onClick={goToAccess}
            className="rounded-lg border border-accent/40 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent transition hover:bg-accent/20"
          >
            Ir al acceso
          </a>
        </header>

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center py-14 text-center">
          <p className="eyebrow animate-rise">Tu centro de control</p>
          <h2 className="mt-5 text-5xl font-bold leading-[1.02] tracking-tight text-fg sm:text-7xl">
            Todo tu día,
            <br />
            <span className="text-glow text-accent">en pulso.</span>
          </h2>
          <p className="mt-6 max-w-2xl text-base text-fg-muted sm:text-lg">
            Finanzas, tiempo, tareas y notas en una plataforma precisa, rápida y diseñada para que no
            tengas que saltar entre apps.
          </p>

          <a
            href="#acceso"
            onClick={goToAccess}
            className="mt-9 inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-ink shadow-glow transition hover:bg-accent-hover"
          >
            Comenzar
            <Icon name="arrowDown" className="h-4 w-4" strokeWidth={2.2} />
          </a>

          <ul className="mt-16 grid w-full gap-3 text-left sm:grid-cols-2 lg:grid-cols-4">
            {AUTH_FEATURES.map((feature) => (
              <li key={feature.title} className="pulse-card p-5">
                <span className="grid h-10 w-10 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
                  <Icon name={feature.icon} className="h-5 w-5" />
                </span>
                <p className="mt-4 text-sm font-semibold text-fg">{feature.title}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-fg-muted">{feature.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <EcgLine
          d={ECG_PATHS.hero}
          viewBox="0 0 600 120"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-x-0 bottom-24 h-28 w-full opacity-70"
          strokeWidth={1.8}
          baseOpacity={0.18}
          dash="30 170"
          runnerClass="drop-shadow-[0_0_6px_#00F0FF]"
        />

        <a
          href="#acceso"
          onClick={goToAccess}
          className="relative z-10 mx-auto flex flex-col items-center gap-1 font-mono text-[0.6875rem] uppercase tracking-[0.24em] text-fg-dim transition hover:text-accent"
        >
          Deslizá para ingresar
          <Icon name="arrowDown" className="h-5 w-5 animate-bounce" />
        </a>
      </section>

      <section
        id="acceso"
        className="relative flex min-h-screen flex-col items-center justify-center border-t border-line px-4 py-16 sm:px-8"
      >
        <div className="w-full max-w-md animate-rise">
          <div className="mb-8 flex justify-center">
            <PulseLogo />
          </div>

          <div className="mb-6 text-center">
            <p className="eyebrow">Acceso seguro</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-fg">{title}</h1>
            <p className="mt-1.5 text-sm text-fg-muted">{subtitle}</p>
          </div>

          <div className="pulse-card hud-corners p-6 sm:p-8">{children}</div>

          {footer ? <p className="mt-6 text-center text-sm text-fg-muted">{footer}</p> : null}

          <a
            href="#top"
            onClick={onClick(scrollToTop)}
            className="mx-auto mt-10 flex w-fit items-center gap-2 font-mono text-[0.6875rem] uppercase tracking-[0.22em] text-fg-dim transition hover:text-accent"
          >
            <Icon name="arrowUp" className="h-4 w-4" />
            Volver al inicio
          </a>
        </div>
      </section>
    </main>
  )
}
