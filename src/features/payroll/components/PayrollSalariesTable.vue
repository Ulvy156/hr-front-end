<script setup lang="ts">
import { Eye, PencilLine, UserRound } from 'lucide-vue-next'

import ActionMenu, { type ActionMenuItem } from '@/components/ui/ActionMenu.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseTable, { type BaseTableColumn } from '@/components/ui/BaseTable.vue'

import type { PayrollSalary, PayrollSalaryListResponse } from '../interface/payroll.interface'
import {
  formatPayrollAmount,
  formatPayrollDate,
  getPayrollSalaryStatusLabel,
  getPayrollSalaryStatusVariant,
} from '../utils/payroll'

const props = withDefaults(
  defineProps<{
    salaries: PayrollSalaryListResponse | null
    loading?: boolean
    error?: string
    canManage?: boolean
  }>(),
  {
    loading: false,
    error: '',
    canManage: false,
  },
)

const emit = defineEmits<{
  retry: []
  navigateByUrl: [url: string]
  edit: [salary: PayrollSalary]
}>()

const columns = computed<BaseTableColumn[]>(() => {
  const baseColumns: BaseTableColumn[] = [
    { key: 'employee', label: 'Employee' },
    { key: 'amount', label: 'Amount', align: 'right' },
    { key: 'effective_date', label: 'Effective Date' },
    { key: 'end_date', label: 'End Date' },
    { key: 'status', label: 'Status' },
  ]

  if (props.canManage) {
    baseColumns.push({ key: 'actions', label: 'Actions', align: 'right' })
  }

  return baseColumns
})

const rows = computed(() =>
  (props.salaries?.data ?? []).map((salary) => ({
    id: salary.id,
    employee: salary.employee?.full_name ?? '--',
    amount: salary.amount,
    effective_date: salary.effective_date,
    end_date: salary.end_date,
    status: salary.status ?? (salary.end_date ? 'ended' : 'current'),
    actions: salary.id,
    raw: salary,
  })),
)

const hasSalaries = computed(() => (props.salaries?.data.length ?? 0) > 0)

const pageSummary = computed(() => {
  if (!props.salaries?.meta) {
    return 'No salary records loaded.'
  }

  const { from, to, total, current_page, last_page } = props.salaries.meta

  return `Showing ${from ?? 0}-${to ?? 0} of ${total} salary records | Page ${current_page} of ${last_page}`
})

const getActionItems = (salary: PayrollSalary) => {
  if (!props.canManage) {
    return []
  }

  return [
    {
      key: 'edit',
      label: 'Edit Salary',
      icon: PencilLine,
      tone: 'primary',
    },
  ] satisfies ActionMenuItem[]
}

const handleActionSelect = (salary: PayrollSalary, actionKey: string) => {
  if (actionKey === 'edit') {
    emit('edit', salary)
  }
}

const navigateByUrl = (url: string | null | undefined) => {
  if (!url) {
    return
  }

  emit('navigateByUrl', url)
}
</script>

<template>
  <section class="payroll-salaries-table-section">
    <div class="payroll-salaries-table-header">
      <div>
        <h2 class="payroll-salaries-table-title">Salary Records</h2>
        <p class="payroll-salaries-table-text">
          Review current salary records by default, or switch the status filter to view salary history.
        </p>
      </div>

      <BaseButton :loading="loading" variant="ghost" @click="emit('retry')">
        Refresh
      </BaseButton>
    </div>

    <div v-if="loading && !hasSalaries" class="payroll-salaries-table-state">
      <BaseSpinner />
      <p class="payroll-salaries-table-text">Loading salary records...</p>
    </div>

    <div
      v-else-if="error && !hasSalaries"
      class="payroll-salaries-table-state payroll-salaries-table-state-error"
    >
      <p class="payroll-salaries-table-text">{{ error }}</p>
      <BaseButton variant="secondary" @click="emit('retry')">Try Again</BaseButton>
    </div>

    <template v-else>
      <BaseTable
        :columns="columns"
        :rows="rows"
        empty-text="No salary records matched the current filters."
      >
        <template #cell-employee="{ row }">
          <div class="payroll-salaries-employee">
            <strong class="payroll-salaries-value">
              {{ (row.raw as PayrollSalary).employee?.full_name || '--' }}
            </strong>
            <span class="payroll-salaries-table-text">
              <UserRound :size="14" />
              {{ (row.raw as PayrollSalary).employee?.employee_code || '--' }}
            </span>
          </div>
        </template>

        <template #cell-amount="{ value }">
          <strong class="payroll-salaries-value">
            {{ formatPayrollAmount(String(value)) }}
          </strong>
        </template>

        <template #cell-effective_date="{ value }">
          {{ formatPayrollDate(String(value)) }}
        </template>

        <template #cell-end_date="{ value }">
          {{ value ? formatPayrollDate(String(value)) : '--' }}
        </template>

        <template #cell-status="{ row }">
          <BaseBadge :variant="getPayrollSalaryStatusVariant(row.raw as PayrollSalary)">
            {{ getPayrollSalaryStatusLabel(row.raw as PayrollSalary) }}
          </BaseBadge>
        </template>

        <template v-if="canManage" #cell-actions="{ row }">
          <div class="payroll-salaries-actions">
            <ActionMenu
              :aria-label="`Open actions for salary ${row.id}`"
              :items="getActionItems(row.raw as PayrollSalary)"
              @select="handleActionSelect(row.raw as PayrollSalary, $event)"
            />
          </div>
        </template>
      </BaseTable>

      <div v-if="salaries?.meta && salaries.meta.total > 0" class="payroll-salaries-table-footer">
        <p class="payroll-salaries-table-text">{{ pageSummary }}</p>

        <div class="payroll-salaries-pagination-controls">
          <BaseButton
            :disabled="!salaries.links.first || loading"
            variant="ghost"
            @click="navigateByUrl(salaries.links.first)"
          >
            First
          </BaseButton>
          <BaseButton
            :disabled="!salaries.links.prev || loading"
            variant="ghost"
            @click="navigateByUrl(salaries.links.prev)"
          >
            Previous
          </BaseButton>
          <BaseButton
            :disabled="!salaries.links.next || loading"
            variant="ghost"
            @click="navigateByUrl(salaries.links.next)"
          >
            Next
          </BaseButton>
          <BaseButton
            :disabled="!salaries.links.last || loading"
            variant="ghost"
            @click="navigateByUrl(salaries.links.last)"
          >
            Last
          </BaseButton>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.payroll-salaries-table-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payroll-salaries-table-header,
.payroll-salaries-table-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.payroll-salaries-table-title,
.payroll-salaries-value {
  color: hsl(var(--foreground));
}

.payroll-salaries-table-title {
  font-size: 1rem;
  font-weight: 700;
}

.payroll-salaries-table-text {
  color: hsl(var(--muted-foreground));
}

.payroll-salaries-table-state {
  display: flex;
  min-height: 16rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
}

.payroll-salaries-table-state-error {
  gap: 1rem;
}

.payroll-salaries-employee {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.payroll-salaries-employee .payroll-salaries-table-text {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.payroll-salaries-actions,
.payroll-salaries-pagination-controls {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.payroll-salaries-pagination-controls {
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .payroll-salaries-table-header,
  .payroll-salaries-table-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .payroll-salaries-actions,
  .payroll-salaries-pagination-controls {
    justify-content: flex-start;
  }
}
</style>
