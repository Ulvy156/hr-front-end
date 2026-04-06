<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

import type { UserAccount, UserResetPasswordPayload } from '../interface/user.interface'

const props = withDefaults(
  defineProps<{
    open: boolean
    user?: UserAccount | null
    submitting?: boolean
  }>(),
  {
    user: null,
    submitting: false,
  },
)

const emit = defineEmits<{
  close: []
  confirm: [payload: UserResetPasswordPayload]
}>()

const form = reactive({
  new_password: '',
  new_password_confirmation: '',
})

const resetForm = () => {
  form.new_password = ''
  form.new_password_confirmation = ''
}

const handleClose = () => {
  resetForm()
  emit('close')
}

const handleConfirm = () => {
  if (!form.new_password.trim()) {
    ElMessage.error('New password is required.')
    return
  }

  if (!form.new_password_confirmation.trim()) {
    ElMessage.error('Password confirmation is required.')
    return
  }

  if (form.new_password !== form.new_password_confirmation) {
    ElMessage.error('Password confirmation does not match.')
    return
  }

  emit('confirm', {
    new_password: form.new_password,
    new_password_confirmation: form.new_password_confirmation,
  })
}

watch(
  () => props.open,
  (open) => {
    if (!open) {
      resetForm()
    }
  },
)
</script>

<template>
  <BaseModal
    :model-value="open"
    title="Reset User Password"
    width="32rem"
    @close="handleClose"
    @update:model-value="(value) => !value && handleClose()"
  >
    <div class="space-y-5">
      <p class="text-sm text-slate-500">
        Set a new password for <span class="font-semibold text-slate-900">{{ user?.name || 'this user' }}</span>.
      </p>

      <div class="space-y-4">
        <BaseInput
          v-model="form.new_password"
          label="New Password"
          placeholder="Enter new password"
          required
          type="password"
        />
        <BaseInput
          v-model="form.new_password_confirmation"
          label="Confirm New Password"
          placeholder="Confirm new password"
          required
          type="password"
        />
      </div>

      <div class="flex justify-end gap-3">
        <BaseButton variant="ghost" @click="handleClose">Cancel</BaseButton>
        <BaseButton :loading="submitting" @click="handleConfirm">Reset Password</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
