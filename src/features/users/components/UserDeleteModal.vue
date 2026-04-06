<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

import type { UserAccount } from '../interface/user.interface'

defineProps<{
  open: boolean
  user: UserAccount | null
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <BaseModal
    :model-value="open"
    title="Delete User"
    width="30rem"
    @close="emit('close')"
    @update:model-value="(value) => !value && emit('close')"
  >
    <div class="space-y-5">
      <div class="space-y-2">
        <p class="text-sm text-slate-600">
          Delete <span class="font-semibold text-slate-900">{{ user?.name || 'this user' }}</span> permanently.
        </p>
        <p class="text-sm text-slate-500">
          This action uses the admin delete endpoint and cannot be undone.
        </p>
      </div>

      <div class="flex justify-end gap-3">
        <BaseButton variant="ghost" @click="emit('close')">Cancel</BaseButton>
        <BaseButton :loading="loading" variant="danger" @click="emit('confirm')">
          Delete User
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
