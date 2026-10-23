<script setup lang="ts">
import { LOGIN_COPY, LOGIN_FIELDS } from '@shared/authForms'
import AuthCard from '../components/AuthCard.vue'
import AuthFooter from '../components/AuthFooter.vue'
import AuthForm from '../components/AuthForm.vue'
import { useLoginForm } from '../composables/useLoginForm'

// Bandera puesta por RegisterView al redirigir tras un alta exitosa.
const justRegistered = Boolean(window.history.state?.registered)

const form = useLoginForm()
</script>

<template>
  <AuthCard :title="LOGIN_COPY.title" :subtitle="LOGIN_COPY.subtitle">
    <AuthForm
      :fields="LOGIN_FIELDS"
      :values="form.values"
      :copy="LOGIN_COPY"
      :show-success="justRegistered"
      :locked="form.submitting.value"
      :submitting="form.submitting.value"
      :can-submit="form.canSubmit.value"
      :error="form.error.value"
      @update:field="(key, value) => Object.assign(form.values, { [key]: value })"
      @submit="form.handleSubmit"
    />

    <template #footer>
      <AuthFooter :copy="LOGIN_COPY" />
    </template>
  </AuthCard>
</template>
