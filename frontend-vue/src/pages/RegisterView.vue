<script setup lang="ts">
import { RouterLink } from 'vue-router'

import Alert from '../components/Alert.vue'
import AuthCard from '../components/AuthCard.vue'
import Field from '../components/Field.vue'
import SubmitButton from '../components/SubmitButton.vue'
import { useRegisterForm } from '../composables/useRegisterForm'
import { FULL_NAME_MAX_LENGTH, PASSWORD_MIN_LENGTH } from '@shared/validation'
import { passwordError } from '@shared/utils/registerForm'

const { values, submitting, error, done, canSubmit, handleSubmit } = useRegisterForm()
</script>

<template>
  <AuthCard title="Crear cuenta" subtitle="Registrate para empezar a usar Pulse">
    <form class="flex flex-col gap-4" novalidate @submit.prevent="handleSubmit">
      <Alert v-if="done" variant="success">
        ¡Cuenta creada! Te llevamos al inicio de sesión…
      </Alert>

      <Alert v-if="error" variant="error">{{ error }}</Alert>

      <Field
        v-model="values.fullName"
        label="Nombre completo (opcional)"
        type="text"
        name="full_name"
        autocomplete="name"
        placeholder="Ada Lovelace"
        :disabled="submitting || done"
        :maxlength="FULL_NAME_MAX_LENGTH"
      />

      <Field
        v-model="values.email"
        label="Email"
        type="email"
        name="email"
        autocomplete="email"
        placeholder="usuario@pulse.app"
        :disabled="submitting || done"
        required
      />

      <Field
        v-model="values.password"
        label="Contraseña"
        type="password"
        name="password"
        autocomplete="new-password"
        placeholder="••••••••••••"
        :disabled="submitting || done"
        :hint="`Mínimo ${PASSWORD_MIN_LENGTH} caracteres.`"
        :error="passwordError(values.password)"
        required
      />

      <SubmitButton :loading="submitting" :disabled="!canSubmit" loading-label="Creando cuenta…">
        Crear cuenta
      </SubmitButton>
    </form>

    <template #footer>
      ¿Ya tenés cuenta?
      <RouterLink to="/login" class="font-semibold text-accent hover:text-accent-hover">
        Iniciá sesión
      </RouterLink>
    </template>
  </AuthCard>
</template>
