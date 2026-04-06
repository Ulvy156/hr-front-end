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
  <BaseModal :open="open" title="Unterminate Employee" @close="$emit('close')">
    <div class="employee-unterminate-body">
      <p class="employee-unterminate-text">
        Restore
        <strong>{{ employeeName || 'this employee' }}</strong>
        to active status?
      </p>
      <p class="employee-unterminate-helper">
        This will clear the termination status and make the employee active again.
      </p>
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">Cancel</BaseButton>
      <BaseButton :loading="loading" @click="$emit('confirm')">
        Confirm
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.employee-unterminate-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.employee-unterminate-text {
  color: hsl(var(--foreground));
}

.employee-unterminate-helper {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-sm);
}
</style>
