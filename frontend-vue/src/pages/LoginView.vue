<script setup lang="ts">
import { RouterLink } from 'vue-router'

import Alert from '../components/Alert.vue'
import AuthCard from '../components/AuthCard.vue'
import Field from '../components/Field.vue'
import SubmitButton from '../components/SubmitButton.vue'
import { useLoginForm } from '../composables/useLoginForm'

// Bandera puesta por RegisterView al redirigir tras un alta exitosa.
const justRegistered = Boolean(window.history.state?.registered)

const { values, submitting, error, canSubmit, handleSubmit } = useLoginForm()
</script>

<template>
  <AuthCard title="Iniciar sesión" subtitle="Accedé a tu cuenta de Pulse">
    <form class="flex flex-col gap-4" novalidate @submit.prevent="handleSubmit">
      <Alert v-if="justRegistered" variant="success">
        Cuenta creada correctamente. Iniciá sesión para continuar.
      </Alert>

      <Alert v-if="error" variant="error">{{ error }}</Alert>

      <Field
        v-model="values.email"
        label="Email"
        type="email"
        name="email"
        autocomplete="email"
        placeholder="usuario@pulse.app"
        :disabled="submitting"
        required
      />

      <Field
        v-model="values.password"
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
