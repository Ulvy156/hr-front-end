<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

import type { EmployeeTerminatePayload } from '../interface/employee.interface'

const props = defineProps<{
  open: boolean
  employeeName?: string
  loading?: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: [payload: Required<EmployeeTerminatePayload>]
}>()

const terminationDate = ref<string | null>(null)
const lastWorkingDate = ref<string | null>(null)

const validationMessage = computed(() => {
  if (!terminationDate.value || !lastWorkingDate.value) {
    return 'Please select both termination date and last working date.'
  }

  if (lastWorkingDate.value < terminationDate.value) {
    return 'Last working date must be the same as or after the termination date.'
  }

  return ''
})

const isSubmitDisabled = computed(() => Boolean(validationMessage.value) || props.loading)

const resetForm = () => {
  terminationDate.value = null
  lastWorkingDate.value = null
}

const submit = () => {
  if (isSubmitDisabled.value || !terminationDate.value || !lastWorkingDate.value) {
    return
  }

  emit('confirm', {
    termination_date: terminationDate.value,
    last_working_date: lastWorkingDate.value,
  })
}

watch(
  () => props.open,
  (open) => {
    if (open) {
      resetForm()
    }
  },
)
</script>

<template>
  <BaseModal :open="open" title="Terminate Employee" @close="$emit('close')">
    <div class="employee-terminate-body">
      <p class="employee-terminate-text">
        Set the termination details for
        <strong>{{ employeeName || 'this employee' }}</strong>.
      </p>

      <div class="employee-terminate-fields">
        <BaseDatePicker
          v-model="terminationDate"
          label="Termination Date"
          required
          value-format="YYYY-MM-DD"
        />
        <BaseDatePicker
          v-model="lastWorkingDate"
          label="Last Working Date"
          required
          value-format="YYYY-MM-DD"
        />
      </div>

      <p v-if="validationMessage" class="employee-terminate-helper">
        {{ validationMessage }}
      </p>
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="$emit('close')">Cancel</BaseButton>
      <BaseButton :disabled="isSubmitDisabled" :loading="loading" variant="danger" @click="submit">
        Terminate
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.employee-terminate-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.employee-terminate-text {
  color: hsl(var(--foreground));
}

.employee-terminate-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.employee-terminate-helper {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-sm);
}
</style>
