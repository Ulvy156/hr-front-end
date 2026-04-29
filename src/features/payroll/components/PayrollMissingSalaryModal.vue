<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'

import type { PayrollMissingSalaryEmployee } from '../interface/payroll.interface'
import { formatPayrollMonthLabel } from '../utils/payroll'

const props = defineProps<{
  open: boolean
  month: string
  employees: PayrollMissingSalaryEmployee[]
  canOpenSalarySetup?: boolean
}>()

const emit = defineEmits<{
  close: []
  goToSalarySetup: []
}>()
</script>

<template>
  <BaseModal :open="open" title="Cannot Generate Payroll" @close="emit('close')">
    <div class="payroll-missing-salary-modal">
      <div class="payroll-missing-salary-copy">
        <p class="payroll-missing-salary-text">
          Some employees do not have valid salary for the selected month.
        </p>
        <p class="payroll-missing-salary-text">
          Payroll month: {{ formatPayrollMonthLabel(month) }}
        </p>
        <p v-if="!canOpenSalarySetup" class="payroll-missing-salary-text">
          Salary Setup is unavailable for this account. Contact an authorized payroll administrator
          to update salary records.
        </p>
      </div>

      <div
        v-if="employees.length > 0"
        class="payroll-missing-salary-list"
      >
        <div
          v-for="employee in employees"
          :key="employee.id"
          class="payroll-missing-salary-item"
        >
          <strong class="payroll-missing-salary-name">{{ employee.full_name }}</strong>
          <span class="payroll-missing-salary-code">
            {{ employee.employee_code || '--' }}
          </span>
        </div>
      </div>

      <div v-else class="payroll-missing-salary-empty">
        <p class="payroll-missing-salary-text">No employees were found for this payroll check.</p>
      </div>
    </div>

    <template #footer>
      <BaseButton variant="ghost" @click="emit('close')">Cancel</BaseButton>
      <BaseButton v-if="canOpenSalarySetup" @click="emit('goToSalarySetup')">
        Go to Salary Setup
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.payroll-missing-salary-modal,
.payroll-missing-salary-copy,
.payroll-missing-salary-list,
.payroll-missing-salary-item,
.payroll-missing-salary-empty {
  display: flex;
  flex-direction: column;
}

.payroll-missing-salary-modal,
.payroll-missing-salary-list {
  gap: 1rem;
}

.payroll-missing-salary-copy,
.payroll-missing-salary-item {
  gap: 0.35rem;
}

.payroll-missing-salary-list {
  max-height: 18rem;
  overflow-y: auto;
}

.payroll-missing-salary-item,
.payroll-missing-salary-empty {
  padding: 0.9rem 1rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--secondary) / 0.12);
}

.payroll-missing-salary-name {
  color: hsl(var(--foreground));
}

.payroll-missing-salary-text,
.payroll-missing-salary-code {
  color: hsl(var(--muted-foreground));
}
</style>
