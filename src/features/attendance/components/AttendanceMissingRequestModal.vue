<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseTimePicker from '@/components/ui/BaseTimePicker.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    existingAttendanceDates?: string[]
    submitting?: boolean
  }>(),
  {
    existingAttendanceDates: () => [],
    submitting: false,
  },
)

const emit = defineEmits<{
  close: []
  submit: [
    payload: {
      request_date: string
      requested_check_in_time?: string | null
      requested_check_out_time?: string | null
      reason: string
    },
  ]
}>()

const form = reactive({
  request_date: '',
  requested_check_in_time: '08:00',
  requested_check_out_time: '17:00',
  reason: '',
})

const existingDateSet = computed(() => new Set(props.existingAttendanceDates))

const formatDateOnly = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

const isUnavailableRequestDate = (date: Date) => {
  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)

  if (date.getTime() > endOfToday.getTime()) {
    return true
  }

  return existingDateSet.value.has(formatDateOnly(date))
}

const resetForm = () => {
  form.request_date = ''
  form.requested_check_in_time = '08:00'
  form.requested_check_out_time = '17:00'
  form.reason = ''
}

const handleClose = () => {
  resetForm()
  emit('close')
}

const handleSubmit = () => {
  if (!form.request_date) {
    ElMessage.error('Request date is required.')
    return
  }

  if (!form.requested_check_in_time && !form.requested_check_out_time) {
    ElMessage.error('Enter a requested check-in time or check-out time.')
    return
  }

  if (
    form.requested_check_in_time &&
    form.requested_check_out_time &&
    form.requested_check_out_time < form.requested_check_in_time
  ) {
    ElMessage.error('Requested check-out time must be after or equal to requested check-in time.')
    return
  }

  if (!form.reason.trim()) {
    ElMessage.error('Reason is required.')
    return
  }

  if (existingDateSet.value.has(form.request_date)) {
    ElMessage.error('Select a date that does not already have attendance recorded.')
    return
  }

  emit('submit', {
    request_date: form.request_date,
    requested_check_in_time: form.requested_check_in_time || null,
    requested_check_out_time: form.requested_check_out_time || null,
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
    :model-value="open"
    title="Missing Attendance Request"
    width="40rem"
    @close="handleClose"
    @update:model-value="(value) => !value && handleClose()"
  >
    <div class="space-y-5">
      <div class="space-y-2">
        <p class="text-sm text-slate-600">
          Choose the date that is missing attendance, then enter the time you meant to record.
        </p>
        <p class="text-sm text-slate-500">
          Requested times use 24-hour format and only need the hour and minute.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BaseDatePicker
          v-model="form.request_date"
          :disabled-date="isUnavailableRequestDate"
          format="YYYY-MM-DD"
          label="Request Date"
          required
          type="date"
          value-format="YYYY-MM-DD"
        />
        <div />
        <BaseTimePicker
          v-model="form.requested_check_in_time"
          label="Requested Check-In"
          placeholder="HH:MM"
        />
        <BaseTimePicker
          v-model="form.requested_check_out_time"
          label="Requested Check-Out"
          placeholder="HH:MM"
        />
      </div>

      <BaseTextarea
        v-model="form.reason"
        label="Reason"
        placeholder="Explain why this attendance is missing."
        required
      />

      <div class="flex justify-end gap-3">
        <BaseButton variant="ghost" @click="handleClose">Cancel</BaseButton>
        <BaseButton :loading="submitting" @click="handleSubmit">Send Request</BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
