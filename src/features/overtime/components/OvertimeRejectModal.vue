<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import { formatShortDate, formatTime12h } from '@/utils/time'

import type { OvertimeRequest } from '../interface/overtime.interface'

const props = withDefaults(
  defineProps<{
    open: boolean
    request: OvertimeRequest | null
    submitting?: boolean
  }>(),
  {
    submitting: false,
  },
)

const emit = defineEmits<{
  close: []
  submit: [
    payload: {
      id: number
      rejection_reason: string
    },
  ]
}>()

const form = reactive({
  rejection_reason: '',
})

const resetForm = () => {
  form.rejection_reason = ''
}

const handleClose = () => {
  if (props.submitting) {
    return
  }

  resetForm()
  emit('close')
}

const handleSubmit = () => {
  if (!props.request) {
    return
  }

  if (!form.rejection_reason.trim()) {
    ElMessage.error('A rejection reason is required.')
    return
  }

  emit('submit', {
    id: props.request.id,
    rejection_reason: form.rejection_reason.trim(),
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
    :close-on-escape="!submitting"
    :close-on-overlay="!submitting"
    :model-value="open"
    title="Reject Overtime Request"
    width="42rem"
    @close="handleClose"
    @update:model-value="(value) => !value && handleClose()"
  >
    <div class="overtime-reject-layout">
      <div class="overtime-reject-summary">
        <div>
          <p class="overtime-reject-label">Employee</p>
          <p class="overtime-reject-value">{{ request?.employee?.name ?? '--' }}</p>
        </div>
        <div>
          <p class="overtime-reject-label">Date</p>
          <p class="overtime-reject-value">{{ formatShortDate(request?.overtime_date) }}</p>
        </div>
        <div>
          <p class="overtime-reject-label">Start Time</p>
          <p class="overtime-reject-value">{{ formatTime12h(request?.start_time) }}</p>
        </div>
        <div>
          <p class="overtime-reject-label">End Time</p>
          <p class="overtime-reject-value">{{ formatTime12h(request?.end_time) }}</p>
        </div>
        <div class="overtime-reject-summary-wide">
          <p class="overtime-reject-label">Reason</p>
          <p class="overtime-reject-value">{{ request?.reason ?? '--' }}</p>
        </div>
      </div>

      <BaseTextarea
        v-model="form.rejection_reason"
        label="Rejection Reason"
        placeholder="Explain why this overtime request is being rejected."
        required
      />
    </div>

    <template #footer>
      <BaseButton :disabled="submitting" variant="secondary" @click="handleClose">Back</BaseButton>
      <BaseButton :loading="submitting" variant="danger" @click="handleSubmit"
        >Reject Request</BaseButton
      >
    </template>
  </BaseModal>
</template>

<style scoped>
.overtime-reject-layout {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.overtime-reject-summary {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.95rem 1rem;
  padding: 1rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--secondary) / 0.18);
}

.overtime-reject-summary-wide {
  grid-column: span 2;
}

.overtime-reject-label {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.overtime-reject-value {
  margin-top: 0.35rem;
  color: hsl(var(--foreground));
  font-size: var(--text-sm);
  line-height: 1.5;
}

@media (max-width: 768px) {
  .overtime-reject-summary {
    grid-template-columns: minmax(0, 1fr);
  }

  .overtime-reject-summary-wide {
    grid-column: span 1;
  }
}
</style>
