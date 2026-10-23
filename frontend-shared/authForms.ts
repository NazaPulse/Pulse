// Campos y textos de las pantallas de acceso (inicio de sesión y registro).
import { passwordError } from './utils/registerForm'
import { FULL_NAME_MAX_LENGTH, PASSWORD_MIN_LENGTH } from './validation'

export type AuthFieldKey = 'fullName' | 'email' | 'password'

export interface AuthField {
  key: AuthFieldKey
  label: string
  type: string
  name: string
  autocomplete: string
  placeholder: string
  required?: boolean
  maxLength?: number
  hint?: string
  /** Mensaje de error de validación en vivo (solo el registro valida la contraseña). */
  validate?: (value: string) => string | undefined
}

const EMAIL: AuthField = {
  key: 'email',
  label: 'Email',
  type: 'email',
  name: 'email',
  autocomplete: 'email',
  placeholder: 'usuario@pulse.app',
  required: true,
}

const PASSWORD: AuthField = {
  key: 'password',
  label: 'Contraseña',
  type: 'password',
  name: 'password',
  autocomplete: 'current-password',
  placeholder: '••••••••••••',
  required: true,
}

export const LOGIN_FIELDS: AuthField[] = [EMAIL, PASSWORD]

export const REGISTER_FIELDS: AuthField[] = [
  {
    key: 'fullName',
    label: 'Nombre completo (opcional)',
    type: 'text',
    name: 'full_name',
    autocomplete: 'name',
    placeholder: 'Ada Lovelace',
    maxLength: FULL_NAME_MAX_LENGTH,
  },
  EMAIL,
  {
    ...PASSWORD,
    autocomplete: 'new-password',
    hint: `Mínimo ${PASSWORD_MIN_LENGTH} caracteres.`,
    validate: passwordError,
  },
]

export interface AuthCopy {
  title: string
  subtitle: string
  submit: string
  loading: string
  /** Mensaje de éxito mostrado sobre el formulario. */
  success: string
  footerText: string
  footerLink: string
  footerTo: string
}

export const LOGIN_COPY: AuthCopy = {
  title: 'Iniciar sesión',
  subtitle: 'Accedé a tu cuenta de Pulse',
  submit: 'Ingresar',
  loading: 'Ingresando…',
  success: 'Cuenta creada correctamente. Iniciá sesión para continuar.',
  footerText: '¿No tenés cuenta?',
  footerLink: 'Registrate',
  footerTo: '/register',
}

export const REGISTER_COPY: AuthCopy = {
  title: 'Crear cuenta',
  subtitle: 'Registrate para empezar a usar Pulse',
  submit: 'Crear cuenta',
  loading: 'Creando cuenta…',
  success: '¡Cuenta creada! Te llevamos al inicio de sesión…',
  footerText: '¿Ya tenés cuenta?',
  footerLink: 'Iniciá sesión',
  footerTo: '/login',
}
