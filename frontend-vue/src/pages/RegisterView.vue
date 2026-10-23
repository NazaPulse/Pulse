<script setup lang="ts">
import { REGISTER_COPY, REGISTER_FIELDS } from '@shared/authForms'
import AuthCard from '../components/AuthCard.vue'
import AuthFooter from '../components/AuthFooter.vue'
import AuthForm from '../components/AuthForm.vue'
import { useRegisterForm } from '../composables/useRegisterForm'

const form = useRegisterForm()
</script>

<template>
  <AuthCard :title="REGISTER_COPY.title" :subtitle="REGISTER_COPY.subtitle">
    <AuthForm
      :fields="REGISTER_FIELDS"
      :values="form.values"
      :copy="REGISTER_COPY"
      :show-success="form.done.value"
      :locked="form.submitting.value || form.done.value"
      :submitting="form.submitting.value"
      :can-submit="form.canSubmit.value"
      :error="form.error.value"
      @update:field="(key, value) => Object.assign(form.values, { [key]: value })"
      @submit="form.handleSubmit"
    />

    <template #footer>
      <AuthFooter :copy="REGISTER_COPY" />
    </template>
  </AuthCard>
</template>
