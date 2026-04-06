<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'

import {
  formatAttendanceActionLabel,
  isSelfServiceAttendanceAction,
} from '../utils/selfService'

defineProps<{
  nextAction: string | null
  correctionStatus: string | null
  canCorrectionAction?: boolean
  actionLoading?: boolean
  requestLoading?: boolean
  actionError?: string
  actionSuccess?: string
}>()

defineEmits<{
  primaryAction: []
  correctionAction: []
  missingAttendanceAction: []
  scanAction: []
}>()
</script>

<template>
  <BaseCard class="employee-actions-card">
    <div class="employee-actions-body">
      <div>
        <h3 class="employee-actions-title">Attendance Actions</h3>
        <p class="employee-actions-text">
          Use quick actions to record attendance or open the scan page.
        </p>
      </div>

      <div class="employee-actions-buttons">
        <BaseButton
          :disabled="!isSelfServiceAttendanceAction(nextAction)"
          :loading="actionLoading"
          :variant="nextAction === 'check_in' || nextAction === 'check_out' ? 'primary' : 'secondary'"
          @click="$emit('primaryAction')"
        >
          {{ formatAttendanceActionLabel(nextAction) }}
        </BaseButton>
        <BaseButton variant="ghost" @click="$emit('scanAction')">
          Open QR Scan Flow
        </BaseButton>
        <BaseButton
          :disabled="!canCorrectionAction"
          :loading="requestLoading"
          variant="secondary"
          @click="$emit('correctionAction')"
        >
          Correction Request
        </BaseButton>
        <BaseButton :loading="requestLoading" variant="ghost" @click="$emit('missingAttendanceAction')">
          Missing Attendance Request
        </BaseButton>
      </div>

      <p v-if="actionSuccess" class="employee-actions-feedback employee-actions-feedback-success">
        {{ actionSuccess }}
      </p>
      <p v-else-if="actionError" class="employee-actions-feedback employee-actions-feedback-error">
        {{ actionError }}
      </p>

      <p class="employee-actions-helper">
        Current correction status:
        <strong>{{ correctionStatus ?? 'none' }}</strong
        >.
        {{
          canCorrectionAction
            ? 'Use Correction Request for dates that already have attendance recorded.'
            : 'Correction Request is not available right now.'
        }}
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

.employee-actions-feedback {
  border-radius: calc(var(--radius) - 0.125rem);
  padding: 0.75rem 0.875rem;
  font-size: var(--text-sm);
  font-weight: 500;
}

.employee-actions-feedback-success {
  background: hsl(142 76% 96%);
  color: hsl(142 72% 24%);
}

.employee-actions-feedback-error {
  background: hsl(0 86% 97%);
  color: hsl(0 72% 42%);
}

.employee-actions-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}
</style>
