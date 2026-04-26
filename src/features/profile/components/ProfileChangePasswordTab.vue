<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import { authService } from '@/features/auth/services/authService'
import { getEmployeeRequestErrorMessage } from '@/features/employees/utils/employee'

const form = reactive({
  current_password: '',
  new_password: '',
  confirm_password: '',
})

const isSaving = ref(false)

const resetForm = () => {
  form.current_password = ''
  form.new_password = ''
  form.confirm_password = ''
}

const validationMessage = computed(() => {
  if (!form.current_password.trim()) {
    return 'Current password is required.'
  }

  if (!form.new_password.trim()) {
    return 'New password is required.'
  }

  if (!form.confirm_password.trim()) {
    return 'Please confirm the new password.'
  }

  if (form.new_password !== form.confirm_password) {
    return 'New password and confirm password must match.'
  }

  return ''
})

const submit = async () => {
  if (validationMessage.value) {
    ElMessage.error(validationMessage.value)
    return
  }

  isSaving.value = true

  try {
    const response = await authService.changePassword({
      current_password: form.current_password,
      new_password: form.new_password,
      new_password_confirmation: form.confirm_password,
    })
    ElMessage.success(response.message || 'Password changed successfully.')
    resetForm()
  } catch (error) {
    ElMessage.error(getEmployeeRequestErrorMessage(error))
  } finally {
    isSaving.value = false
  }
}
</script>

<template>
  <BaseCard class="border border-slate-200 shadow-sm">
    <div class="space-y-5 p-5">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Change Password</h3>
          <p class="text-sm text-slate-500">
            Update your password using your current password for confirmation.
          </p>
        </div>

        <BaseButton :loading="isSaving" @click="submit">
          Update Password
        </BaseButton>
      </div>

      <div class="grid gap-4 md:grid-cols-2">
        <BaseInput
          v-model="form.current_password"
          autocomplete="current-password"
          label="Current Password"
          placeholder="Enter your current password"
          required
          size="large"
          type="password"
        />
        <div />
        <BaseInput
          v-model="form.new_password"
          autocomplete="new-password"
          label="New Password"
          placeholder="Enter your new password"
          required
          size="large"
          type="password"
        />
        <BaseInput
          v-model="form.confirm_password"
          autocomplete="new-password"
          label="Confirm Password"
          placeholder="Re-enter your new password"
          required
          size="large"
          type="password"
        />
      </div>
    </div>
  </BaseCard>
</template>
