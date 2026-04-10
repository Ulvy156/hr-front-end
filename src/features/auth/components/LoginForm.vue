<script setup lang="ts">
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Mail } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

import { useLogin } from '../composable/useLogin'

const form = ref({
  email: '',
  password: '',
})
const showPassword = ref(false)
const showValidation = ref(false)

const { login, loading, error } = useLogin()

const emailError = computed(() => {
  if (!showValidation.value || form.value.email.trim()) {
    return ''
  }

  return 'Email is required.'
})

const passwordError = computed(() => {
  if (!showValidation.value || form.value.password.trim()) {
    return ''
  }

  return 'Password is required.'
})

const hasValidationErrors = computed(() => Boolean(emailError.value || passwordError.value))
const submitLabel = computed(() => (loading.value ? 'Signing in...' : 'Sign In'))

const handleSubmit = async () => {
  showValidation.value = true

  if (hasValidationErrors.value) {
    return
  }

  try {
    await login({
      email: form.value.email.trim(),
      password: form.value.password,
    })
  } catch {
    // Error state is already handled by the composable.
  }
}
</script>

<template>
  <div class="login-form">
    <div class="login-form-header">
      <p class="login-form-eyebrow">Secure sign in</p>
      <h1 class="login-form-title">Welcome back</h1>
      <p class="login-form-subtitle">
        Sign in to access attendance, leave requests, and employee information.
      </p>
    </div>

    <div v-if="error" class="login-form-alert" role="alert" aria-live="polite">
      <div class="login-form-alert-icon">
        <LockKeyhole :size="16" />
      </div>
      <div class="login-form-alert-copy">
        <strong class="login-form-alert-title">Unable to sign in</strong>
        <p class="login-form-alert-text">{{ error }}</p>
      </div>
    </div>

    <form class="login-form-body" @submit.prevent="handleSubmit">
      <BaseInput
        id="login-email"
        v-model="form.email"
        autocomplete="email"
        autofocus
        :disabled="loading"
        :error="emailError"
        label="Email Address"
        name="email"
        placeholder="you@example.com"
        required
        type="email"
      >
        <template #suffix>
          <span class="login-form-field-icon" aria-hidden="true">
            <Mail :size="18" />
          </span>
        </template>
      </BaseInput>

      <BaseInput
        id="login-password"
        v-model="form.password"
        autocomplete="current-password"
        :disabled="loading"
        :error="passwordError"
        label="Password"
        name="password"
        placeholder="Enter your password"
        required
        :type="showPassword ? 'text' : 'password'"
      >
        <template #suffix>
          <button
            :aria-label="showPassword ? 'Hide password' : 'Show password'"
            class="login-form-password-toggle"
            :disabled="loading"
            type="button"
            @click="showPassword = !showPassword"
          >
            <EyeOff v-if="showPassword" :size="18" />
            <Eye v-else :size="18" />
          </button>
        </template>
      </BaseInput>

      <div class="login-form-helper-row">
        <p class="login-form-helper-text">Use your work email and account password.</p>
        <p v-if="loading" class="login-form-loading-text">
          <LoaderCircle :size="14" class="login-form-loading-icon" />
          Verifying your account...
        </p>
      </div>

      <BaseButton block :disabled="loading" :loading="loading" type="submit">
        {{ submitLabel }}
      </BaseButton>
    </form>

    <p class="login-form-footer">
      Need help accessing your account? Contact your HR administrator.
    </p>
  </div>
</template>

<style scoped>
.login-form {
  width: min(100%, 26rem);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.login-form-header,
.login-form-body {
  display: flex;
  flex-direction: column;
}

.login-form-header {
  gap: 0.6rem;
}

.login-form-eyebrow {
  color: hsl(var(--primary));
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.login-form-title,
.login-form-alert-title {
  color: hsl(var(--foreground));
}

.login-form-title {
  font-size: clamp(1.85rem, 2vw, 2.35rem);
  line-height: 1.08;
  letter-spacing: -0.03em;
}

.login-form-subtitle,
.login-form-helper-text,
.login-form-footer {
  color: hsl(var(--muted-foreground));
}

.login-form-subtitle {
  line-height: 1.65;
}

.login-form-alert {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.8rem;
  padding: 0.95rem 1rem;
  border: 1px solid hsl(var(--destructive) / 0.18);
  border-radius: calc(var(--radius) + 0.05rem);
  background: hsl(var(--destructive) / 0.08);
}

.login-form-alert-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: hsl(var(--destructive) / 0.12);
  color: hsl(var(--destructive));
}

.login-form-alert-copy {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.login-form-alert-text {
  color: hsl(var(--destructive));
  font-size: var(--text-sm);
  line-height: 1.5;
}

.login-form-body {
  gap: 1rem;
}

.login-form-field-icon,
.login-form-password-toggle,
.login-form-loading-text {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.login-form-field-icon {
  color: hsl(var(--muted-foreground));
}

.login-form-password-toggle {
  min-width: 2.1rem;
  min-height: 2.1rem;
  padding: 0;
  border: 0;
  border-radius: 9999px;
  background: transparent;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;
}

.login-form-password-toggle:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.login-form-password-toggle:hover {
  background: hsl(var(--secondary));
  color: hsl(var(--foreground));
}

.login-form-password-toggle:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px hsl(var(--ring) / 0.16);
}

.login-form-helper-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  min-height: 1.5rem;
}

.login-form-helper-text,
.login-form-loading-text,
.login-form-footer {
  font-size: var(--text-sm);
}

.login-form-loading-text {
  gap: 0.4rem;
  color: hsl(var(--primary));
  font-weight: 600;
  white-space: nowrap;
}

.login-form-loading-icon {
  animation: login-form-spin 0.9s linear infinite;
}

.login-form-footer {
  line-height: 1.6;
}

@keyframes login-form-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 640px) {
  .login-form {
    width: 100%;
    gap: 1.25rem;
  }

  .login-form-helper-row {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
