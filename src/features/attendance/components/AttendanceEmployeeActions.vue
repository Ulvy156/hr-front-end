<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'

defineProps<{
  nextAction: string | null
  correctionStatus: string | null
}>()

defineEmits<{
  primaryAction: []
  correctionAction: []
}>()

const formatActionLabel = (value: string | null) => {
  if (!value) return 'Attendance Action'

  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
</script>

<template>
  <BaseCard class="employee-actions-card">
    <div class="employee-actions-body">
      <div>
        <h3 class="employee-actions-title">Attendance Actions</h3>
        <p class="employee-actions-text">
          Self-service actions are prepared from your current attendance state.
        </p>
      </div>

      <div class="employee-actions-buttons">
        <BaseButton
          :disabled="true"
          :variant="nextAction === 'check_in' || nextAction === 'check_out' ? 'primary' : 'secondary'"
          @click="$emit('primaryAction')"
        >
          {{ formatActionLabel(nextAction) }}
        </BaseButton>
        <BaseButton :disabled="true" variant="secondary" @click="$emit('correctionAction')">
          Request Correction
        </BaseButton>
      </div>

      <p class="employee-actions-helper">
        Current correction status:
        <strong>{{ correctionStatus ?? 'none' }}</strong
        >. Scan and correction submission workflows are not connected in this page yet.
      </p>
    </div>
  </BaseCard>
</template>

<style scoped>
.employee-actions-card {
  overflow: hidden;
}

.employee-actions-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
}

.employee-actions-title {
  color: hsl(var(--foreground));
}

.employee-actions-text,
.employee-actions-helper {
  margin-top: 0.25rem;
  color: hsl(var(--muted-foreground));
}

.employee-actions-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
</style>
