<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import { formatTime12h } from '@/utils/time'

import type { CorrectionRequest } from '../interface/attendance.interface'

const props = withDefaults(
  defineProps<{
    open: boolean
    request: CorrectionRequest | null
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
      status: 'approved' | 'rejected'
      review_note?: string | null
    },
  ]
}>()

const form = reactive({
  review_note: '',
})

const resetForm = () => {
  form.review_note = ''
}

const handleClose = () => {
  resetForm()
  emit('close')
}

const handleSubmit = (status: 'approved' | 'rejected') => {
  if (!props.request) {
    return
  }

  emit('submit', {
    id: props.request.id,
    status,
    review_note: form.review_note.trim() || null,
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
    title="Review Correction Request"
    width="42rem"
    @close="handleClose"
    @update:model-value="(value) => !value && handleClose()"
  >
    <div class="space-y-5">
      <div class="grid grid-cols-1 gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Employee</p>
          <p class="mt-1 text-sm font-medium text-slate-900">
            {{ request?.employee?.name ?? request?.attendance?.employee?.name ?? '--' }}
          </p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Attendance Date</p>
          <p class="mt-1 text-sm font-medium text-slate-900">
            {{ request?.attendanceDate ?? request?.attendance?.attendanceDate ?? '--' }}
          </p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Requested Check-In</p>
          <p class="mt-1 text-sm font-medium text-slate-900">
            {{ formatTime12h(request?.requestedCheckInTime) }}
          </p>
        </div>
        <div>
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Requested Check-Out</p>
          <p class="mt-1 text-sm font-medium text-slate-900">
            {{ formatTime12h(request?.requestedCheckOutTime) }}
          </p>
        </div>
        <div class="md:col-span-2">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Reason</p>
          <p class="mt-1 text-sm text-slate-900">
            {{ request?.reason ?? '--' }}
          </p>
        </div>
      </div>

      <BaseTextarea
        v-model="form.review_note"
        label="Review Note"
        placeholder="Add an optional note for this decision."
      />

      <div class="flex justify-end gap-3">
        <BaseButton variant="ghost" @click="handleClose">Cancel</BaseButton>
        <BaseButton :loading="submitting" variant="danger" @click="handleSubmit('rejected')">
          Reject
        </BaseButton>
        <BaseButton :loading="submitting" @click="handleSubmit('approved')">
          Approve
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
