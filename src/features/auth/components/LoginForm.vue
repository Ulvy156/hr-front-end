<script setup lang="ts">
import { ref } from 'vue'

import { useLogin } from '../composable/useLogin'

const form = ref({
  email: '',
  password: '',
})

const { login, loading, error } = useLogin()

const handleSubmit = async () => {
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
  <ElCard shadow="hover" class="login-card w-full max-w-md rounded-2xl">
    <div class="mb-6 space-y-2 text-center">
      <h1 class="login-title text-2xl font-semibold">Login</h1>
      <p class="login-subtitle text-sm">Sign in with your email and password.</p>
    </div>

    <ElAlert
      v-if="error"
      :closable="false"
      :title="error"
      type="error"
      class="mb-4"
      show-icon
    />

    <ElForm label-position="top" @submit.prevent="handleSubmit">
      <ElFormItem label="Email">
        <ElInput
          v-model="form.email"
          autocomplete="email"
          placeholder="you@example.com"
          type="email"
        />
      </ElFormItem>

      <ElFormItem label="Password">
        <ElInput
          v-model="form.password"
          autocomplete="current-password"
          placeholder="Enter your password"
          show-password
          type="password"
        />
      </ElFormItem>

      <ElButton
        :loading="loading"
        class="mt-2 w-full"
        native-type="submit"
        type="primary"
      >
        Sign In
      </ElButton>
    </ElForm>
  </ElCard>
</template>

<style scoped>
.login-card {
  background: hsl(var(--card));
  border-color: hsl(var(--border-gray));
  color: hsl(var(--foreground));
  box-shadow: var(--shadow-card);
}

.login-title {
  color: hsl(var(--foreground));
}

.login-subtitle {
  color: hsl(var(--muted-foreground));
}
</style>
