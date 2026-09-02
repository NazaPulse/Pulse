<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import Alert from '../components/Alert.vue'
import AuthCard from '../components/AuthCard.vue'
import Field from '../components/Field.vue'
import SubmitButton from '../components/SubmitButton.vue'
import { extractErrorMessage, registerRequest } from '../lib/api'
import {
  FULL_NAME_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  isValidEmail,
  isValidPassword,
} from '../lib/validation'

const REDIRECT_DELAY_MS = 1200

const router = useRouter()

const email = ref('')
const password = ref('')
const fullName = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)
const done = ref(false)

const emailOk = computed(() => isValidEmail(email.value))
const passwordOk = computed(() => isValidPassword(password.value))
const fullNameOk = computed(
  () => fullName.value.trim().length <= FULL_NAME_MAX_LENGTH,
)

const canSubmit = computed(
  () =>
    emailOk.value &&
    passwordOk.value &&
    fullNameOk.value &&
    !submitting.value &&
    !done.value,
)

const passwordError = computed(() =>
  password.value.length > 0 && !passwordOk.value
    ? `La contraseña debe tener al menos ${PASSWORD_MIN_LENGTH} caracteres.`
    : undefined,
)

async function handleSubmit() {
  if (!canSubmit.value) return

  submitting.value = true
  error.value = null
  try {
    const trimmedName = fullName.value.trim()
    await registerRequest({
      email: email.value.trim(),
      password: password.value,
      full_name: trimmedName.length > 0 ? trimmedName : undefined,
    })
    done.value = true
    window.setTimeout(() => {
      router.replace({ path: '/login', state: { registered: true } })
    }, REDIRECT_DELAY_MS)
  } catch (err) {
    error.value = extractErrorMessage(err, 'No se pudo completar el registro.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthCard title="Crear cuenta" subtitle="Registrate para empezar a usar Pulse">
    <form class="flex flex-col gap-4" novalidate @submit.prevent="handleSubmit">
      <Alert v-if="done" variant="success">
        ¡Cuenta creada! Te llevamos al inicio de sesión…
      </Alert>

      <Alert v-if="error" variant="error">{{ error }}</Alert>

      <Field
        v-model="fullName"
        label="Nombre completo (opcional)"
        type="text"
        name="full_name"
        autocomplete="name"
        placeholder="Ada Lovelace"
        :disabled="submitting || done"
        :maxlength="FULL_NAME_MAX_LENGTH"
      />

      <Field
        v-model="email"
        label="Email"
        type="email"
        name="email"
        autocomplete="email"
        placeholder="usuario@pulse.app"
        :disabled="submitting || done"
        required
      />

      <Field
        v-model="password"
        label="Contraseña"
        type="password"
        name="password"
        autocomplete="new-password"
        placeholder="••••••••••••"
        :disabled="submitting || done"
        :hint="`Mínimo ${PASSWORD_MIN_LENGTH} caracteres.`"
        :error="passwordError"
        required
      />

      <SubmitButton
        :loading="submitting"
        :disabled="!canSubmit"
        loading-label="Creando cuenta…"
      >
        Crear cuenta
      </SubmitButton>
    </form>

    <template #footer>
      ¿Ya tenés cuenta?
      <RouterLink
        to="/login"
        class="font-semibold text-indigo-600 hover:text-indigo-700"
      >
        Iniciá sesión
      </RouterLink>
    </template>
  </AuthCard>
</template>
