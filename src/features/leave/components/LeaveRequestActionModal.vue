<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

defineProps<{
  open: boolean
  title: string
  description: string
  confirmLabel: string
  confirmVariant?: 'primary' | 'danger'
  loading?: boolean
}>()

defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <BaseModal :open="open" :title="title" width="30rem" @close="$emit('close')">
    <div class="leave-action-body">
      <p class="leave-action-text">{{ description }}</p>
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">Cancel</BaseButton>
      <BaseButton :loading="loading" :variant="confirmVariant ?? 'primary'" @click="$emit('confirm')">
        {{ confirmLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.leave-action-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.leave-action-text {
  color: hsl(var(--foreground));
}
</style>
