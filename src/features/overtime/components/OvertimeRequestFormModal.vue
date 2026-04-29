<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseTimePicker from '@/components/ui/BaseTimePicker.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'

import type { OvertimeRequestCreatePayload } from '../interface/overtime.interface'

const props = withDefaults(
  defineProps<{
    open: boolean
    submitting?: boolean
  }>(),
  {
    submitting: false,
  },
)

const emit = defineEmits<{
  close: []
  submit: [payload: OvertimeRequestCreatePayload]
}>()

const form = reactive<OvertimeRequestCreatePayload>({
  overtime_date: '',
  start_time: '',
  end_time: '',
  reason: '',
})

const resetForm = () => {
  form.overtime_date = ''
  form.start_time = ''
  form.end_time = ''
  form.reason = ''
}

const handleClose = () => {
  if (props.submitting) {
    return
  }

  resetForm()
  emit('close')
}

const handleSubmit = () => {
  if (!form.overtime_date) {
    ElMessage.error('Overtime date is required.')
    return
  }

  if (!form.start_time) {
    ElMessage.error('Start time is required.')
    return
  }

  if (!form.end_time) {
    ElMessage.error('End time is required.')
    return
  }

  if (form.end_time <= form.start_time) {
    ElMessage.error('End time must be later than the start time.')
    return
  }

  if (!form.reason.trim()) {
    ElMessage.error('Reason is required.')
    return
  }

  emit('submit', {
    overtime_date: form.overtime_date,
    start_time: form.start_time,
    end_time: form.end_time,
    reason: form.reason.trim(),
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
    width="42rem"
    @close="handleClose"
    @update:model-value="(value) => !value && handleClose()"
  >
    <template #header>
      <div class="overtime-form-header">
        <p class="overtime-form-eyebrow">New Request</p>
        <h2 class="overtime-form-title">New Overtime Request</h2>
        <p class="overtime-form-description">
          Enter the overtime date, start time, end time, and a short reason. Requested hours and
          overtime type are calculated by the backend.
        </p>
      </div>
    </template>

    <div class="overtime-form-layout">
      <div class="overtime-form-grid">
        <BaseDatePicker
          v-model="form.overtime_date"
          format="YYYY-MM-DD"
          label="Date"
          required
          type="date"
          value-format="YYYY-MM-DD"
        />
        <div />
        <BaseTimePicker
          v-model="form.start_time"
          format="hh:mm A"
          label="Start Time"
          placeholder="06:00 PM"
          required
          value-format="HH:mm"
        />
        <BaseTimePicker
          v-model="form.end_time"
          format="hh:mm A"
          label="End Time"
          placeholder="08:00 PM"
          required
          value-format="HH:mm"
        />
      </div>

      <BaseTextarea
        v-model="form.reason"
        label="Reason"
        placeholder="Explain why this overtime was needed."
        required
      />

      <p class="overtime-form-helper">
        Times are shown in 12-hour format here and sent to the API using the required `HH:mm` value
        format.
      </p>
    </div>

    <template #footer>
      <BaseButton :disabled="submitting" variant="secondary" @click="handleClose">Close</BaseButton>
      <BaseButton :loading="submitting" @click="handleSubmit">Submit Request</BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.overtime-form-header,
.overtime-form-layout {
  display: flex;
  flex-direction: column;
}

.overtime-form-header {
  gap: 0.35rem;
}

.overtime-form-layout {
  gap: 1rem;
}

.overtime-form-eyebrow,
.overtime-form-description,
.overtime-form-helper {
  color: hsl(var(--muted-foreground));
}

.overtime-form-eyebrow {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.overtime-form-title {
  margin: 0;
  color: hsl(var(--foreground));
  font-size: 1.3rem;
  font-weight: 700;
  line-height: 1.2;
}

.overtime-form-description,
.overtime-form-helper {
  font-size: var(--text-sm);
  line-height: 1.55;
}

.overtime-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

@media (max-width: 768px) {
  .overtime-form-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
