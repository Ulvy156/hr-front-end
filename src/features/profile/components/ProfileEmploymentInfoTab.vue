<script setup lang="ts">
import BaseCard from '@/components/ui/BaseCard.vue'
import EmployeeStatusBadge from '@/features/employees/components/EmployeeStatusBadge.vue'
import type { AuthUserEmployee } from '@/features/auth/interface/auth.interface'
import { formatEmployeeDate, formatEmployeeStatus } from '@/features/employees/utils/employee'

defineProps<{
  employee: AuthUserEmployee | null
}>()

const infoItems = (employee: AuthUserEmployee | null) => [
  { label: 'Employee Code', value: employee?.employee_code || '--' },
  { label: 'Full Name', value: employee?.full_name || [employee?.first_name, employee?.last_name].filter(Boolean).join(' ') || '--' },
  { label: 'Department', value: employee?.department?.name || '--' },
  { label: 'Current Position', value: employee?.current_position?.title || '--' },
  { label: 'Manager', value: employee?.manager?.full_name || '--' },
  { label: 'Hire Date', value: formatEmployeeDate(employee?.hire_date) },
  { label: 'Employment Type', value: formatEmployeeStatus(employee?.employment_type) },
]
</script>

<template>
  <BaseCard class="border border-slate-200 shadow-sm">
    <div class="space-y-5 p-5">
      <div>
        <h3 class="text-lg font-semibold text-slate-900">Employment Info</h3>
        <p class="text-sm text-slate-500">
          Review your work assignment, reporting line, and employment details.
        </p>
      </div>

      <div v-if="employee" class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <div
          v-for="item in infoItems(employee)"
          :key="item.label"
          class="space-y-1 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3"
        >
          <p class="text-xs font-medium uppercase tracking-wide text-slate-500">{{ item.label }}</p>
          <p class="text-sm font-medium text-slate-900">{{ item.value }}</p>
        </div>

        <div class="space-y-1 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3">
          <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Status</p>
          <EmployeeStatusBadge :status="employee.status" />
        </div>
      </div>

      <div v-else class="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
        <h4 class="text-base font-semibold text-slate-900">No employment record</h4>
        <p class="max-w-md text-sm text-slate-500">
          No employee information is linked to this account yet.
        </p>
      </div>
    </div>
  </BaseCard>
</template>
