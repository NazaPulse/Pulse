<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'

import { useAuth } from '../auth/useAuth'
import Alert from '../components/Alert.vue'
import AuthCard from '../components/AuthCard.vue'
import Field from '../components/Field.vue'
import SubmitButton from '../components/SubmitButton.vue'
import { extractErrorMessage, loginRequest } from '../lib/api'
import { isNonEmpty, isValidEmail } from '../lib/validation'

const router = useRouter()
const { setToken } = useAuth()

// Bandera puesta por RegisterView al redirigir tras un alta exitosa.
const justRegistered = Boolean(window.history.state?.registered)

const email = ref('')
const password = ref('')
const submitting = ref(false)
const error = ref<string | null>(null)

const canSubmit = computed(
  () => isValidEmail(email.value) && isNonEmpty(password.value) && !submitting.value,
)

async function handleSubmit() {
  if (!canSubmit.value) return

  submitting.value = true
  error.value = null
  try {
    const { access_token } = await loginRequest({
      email: email.value.trim(),
      password: password.value,
    })
    setToken(access_token)
    await router.replace('/dashboard')
  } catch (err) {
    error.value = extractErrorMessage(err, 'Credenciales incorrectas.')
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <AuthCard title="Iniciar sesión" subtitle="Accedé a tu cuenta de Pulse">
    <form class="flex flex-col gap-4" novalidate @submit.prevent="handleSubmit">
      <Alert v-if="justRegistered" variant="success">
        Cuenta creada correctamente. Iniciá sesión para continuar.
      </Alert>

      <Alert v-if="error" variant="error">{{ error }}</Alert>

      <Field
        v-model="email"
        label="Email"
        type="email"
        name="email"
        autocomplete="email"
        placeholder="usuario@pulse.app"
        :disabled="submitting"
        required
      />

      <Field
        v-model="password"
        label="Contraseña"
        type="password"
        name="password"
        autocomplete="current-password"
        placeholder="••••••••••••"
        :disabled="submitting"
        required
      />

      <SubmitButton
        :loading="submitting"
        :disabled="!canSubmit"
        loading-label="Ingresando…"
      >
        Ingresar
      </SubmitButton>
    </form>

    <template #footer>
      ¿No tenés cuenta?
      <RouterLink
        to="/register"
        class="font-semibold text-indigo-600 hover:text-indigo-700"
      >
        Registrate
      </RouterLink>
    </template>
  </AuthCard>
</template>
