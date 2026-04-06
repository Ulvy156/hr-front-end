<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

defineProps<{
  open: boolean
  employeeName?: string
  loading?: boolean
}>()

defineEmits<{
  close: []
  confirm: []
}>()
</script>

<template>
  <BaseModal :open="open" title="Deactivate Employee" @close="$emit('close')">
    <div class="employee-delete-body">
      <p class="employee-delete-text">
        Deactivate
        <strong>{{ employeeName || 'this employee' }}</strong>
        in the employee directory?
      </p>
      <p class="employee-delete-helper">
        This will make the employee inactive in the current directory list.
      </p>
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">Cancel</BaseButton>
      <BaseButton :loading="loading" variant="danger" @click="$emit('confirm')">
        Deactivate
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.employee-delete-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.employee-delete-text {
  color: hsl(var(--foreground));
}

.employee-delete-helper {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-sm);
}
</style>
