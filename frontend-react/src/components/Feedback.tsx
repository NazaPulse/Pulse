import { Alert } from './Alert'
import { Spinner } from './Spinner'

/** Mensaje de error de pantalla (no renderiza nada si no hay error). */
export function ErrorNotice({ message }: { message: string | null }) {
  if (!message) return null
  return (
    <div className="mt-6">
      <Alert variant="error">{message}</Alert>
    </div>
  )
}

/** Spinner centrado para la carga inicial de una pantalla. */
export function LoadingBlock() {
  return (
    <div className="mt-16 flex justify-center">
      <Spinner className="h-8 w-8 text-accent" />
    </div>
  )
}
