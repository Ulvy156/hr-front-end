<script setup lang="ts">
import { CalendarDays, Eye, Users } from 'lucide-vue-next'

import ActionMenu, { type ActionMenuItem } from '@/components/ui/ActionMenu.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseTable, { type BaseTableColumn } from '@/components/ui/BaseTable.vue'

import type { PayrollRun, PayrollRunListResponse } from '../interface/payroll.interface'
import {
  formatPayrollAmount,
  formatPayrollMonthLabel,
  formatPayrollStatusLabel,
} from '../utils/payroll'
import PayrollRunStatusBadge from './PayrollRunStatusBadge.vue'

const props = withDefaults(
  defineProps<{
    runs: PayrollRunListResponse | null
    loading?: boolean
    error?: string
    resolveActions?: (run: PayrollRun) => ActionMenuItem[]
  }>(),
  {
    loading: false,
    error: '',
    resolveActions: undefined,
  },
)

const emit = defineEmits<{
  retry: []
  viewDetails: [run: PayrollRun]
  navigateByUrl: [url: string]
  action: [payload: { run: PayrollRun; actionKey: string }]
}>()

const columns: BaseTableColumn[] = [
  { key: 'month', label: 'Payroll Month' },
  { key: 'status', label: 'Status' },
  { key: 'employee_count', label: 'Employees', align: 'right' },
  { key: 'base', label: 'Base Total', align: 'right' },
  { key: 'overtime', label: 'OT Total', align: 'right' },
  { key: 'deduction', label: 'Deduction Total', align: 'right' },
  { key: 'net', label: 'Net Total', align: 'right' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

const rows = computed(() =>
  (props.runs?.data ?? []).map((run) => ({
    id: run.id,
    month: run.payroll_month,
    status: run.status,
    employee_count: run.employee_count,
    base: run.total_base_salary,
    overtime: run.total_overtime_pay,
    deduction: run.total_unpaid_leave_deduction,
    net: run.total_net_salary,
    actions: run.id,
    raw: run,
  })),
)

const hasRuns = computed(() => (props.runs?.data.length ?? 0) > 0)

const pageSummary = computed(() => {
  if (!props.runs?.meta) {
    return 'No payroll runs loaded.'
  }

  const { from, to, total, current_page, last_page } = props.runs.meta

  return `Showing ${from ?? 0}-${to ?? 0} of ${total} runs | Page ${current_page} of ${last_page}`
})

const getActionItems = (run: PayrollRun) => {
  const actions = props.resolveActions?.(run) ?? []

  if (actions.length > 0) {
    return actions
  }

  return [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      tone: 'primary',
    },
  ] satisfies ActionMenuItem[]
}

const handleActionSelect = (run: PayrollRun, actionKey: string) => {
  if (actionKey === 'view') {
    emit('viewDetails', run)
    return
  }

  emit('action', {
    run,
    actionKey,
  })
}

const navigateByUrl = (url: string | null | undefined) => {
  if (!url) {
    return
  }

  emit('navigateByUrl', url)
}
</script>

<template>
  <section class="payroll-table-section">
    <div class="payroll-table-header">
      <div>
        <h2 class="payroll-table-title">Payroll Runs</h2>
        <p class="payroll-table-text">
          Review monthly payroll snapshots, lifecycle status, and employee totals.
        </p>
      </div>

      <BaseButton :loading="loading" variant="ghost" @click="emit('retry')">
        Refresh
      </BaseButton>
    </div>

    <div v-if="loading && !hasRuns" class="payroll-table-state">
      <BaseSpinner />
      <p class="payroll-table-text">Loading payroll runs...</p>
    </div>

    <div v-else-if="error && !hasRuns" class="payroll-table-state payroll-table-state-error">
      <p class="payroll-table-text">{{ error }}</p>
      <BaseButton variant="secondary" @click="emit('retry')">Try Again</BaseButton>
    </div>

    <template v-else>
      <BaseTable :columns="columns" :rows="rows" empty-text="No payroll runs matched the current filters.">
        <template #cell-month="{ row }">
          <button
            class="payroll-row-link"
            type="button"
            @click="emit('viewDetails', row.raw as PayrollRun)"
          >
            <span class="payroll-row-link-text">
              <CalendarDays :size="16" />
              {{ formatPayrollMonthLabel(String(row.month)) }}
            </span>
          </button>
        </template>

        <template #cell-status="{ value }">
          <PayrollRunStatusBadge :status="String(value)" />
        </template>

        <template #cell-employee_count="{ value }">
          <span class="payroll-number-cell">
            <Users :size="14" />
            {{ value }}
          </span>
        </template>

        <template #cell-base="{ value }">
          {{ formatPayrollAmount(String(value)) }}
        </template>

        <template #cell-overtime="{ value }">
          {{ formatPayrollAmount(String(value)) }}
        </template>

        <template #cell-deduction="{ value }">
          {{ formatPayrollAmount(String(value)) }}
        </template>

        <template #cell-net="{ value }">
          <strong class="payroll-net-cell">{{ formatPayrollAmount(String(value)) }}</strong>
        </template>

        <template #cell-actions="{ row }">
          <div class="payroll-actions-cell">
            <ActionMenu
              :aria-label="`Open actions for payroll run ${row.id}`"
              :items="getActionItems(row.raw as PayrollRun)"
              @select="handleActionSelect(row.raw as PayrollRun, $event)"
            />
          </div>
        </template>
      </BaseTable>

      <div v-if="runs?.meta && runs.meta.total > 0" class="payroll-table-footer">
        <p class="payroll-table-text">{{ pageSummary }}</p>

        <div class="payroll-pagination-controls">
          <BaseButton
            :disabled="!runs.links.first || loading"
            variant="ghost"
            @click="navigateByUrl(runs.links.first)"
          >
            First
          </BaseButton>
          <BaseButton
            :disabled="!runs.links.prev || loading"
            variant="ghost"
            @click="navigateByUrl(runs.links.prev)"
          >
            Previous
          </BaseButton>
          <BaseButton
            :disabled="!runs.links.next || loading"
            variant="ghost"
            @click="navigateByUrl(runs.links.next)"
          >
            Next
          </BaseButton>
          <BaseButton
            :disabled="!runs.links.last || loading"
            variant="ghost"
            @click="navigateByUrl(runs.links.last)"
          >
            Last
          </BaseButton>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.payroll-table-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payroll-table-header,
.payroll-table-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.payroll-table-title,
.payroll-net-cell {
  color: hsl(var(--foreground));
}

.payroll-table-title {
  font-size: 1rem;
  font-weight: 700;
}

.payroll-table-text {
  color: hsl(var(--muted-foreground));
}

.payroll-table-state {
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

.payroll-table-state-error {
  gap: 1rem;
}

.payroll-row-link {
  border: 0;
  background: transparent;
  color: hsl(var(--primary));
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  padding: 0;
}

.payroll-row-link:hover {
  text-decoration: underline;
}

.payroll-row-link-text,
.payroll-number-cell {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.payroll-actions-cell,
.payroll-pagination-controls {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.payroll-pagination-controls {
  flex-wrap: wrap;
}

.payroll-net-cell {
  font-weight: 700;
}

@media (max-width: 768px) {
  .payroll-table-header,
  .payroll-table-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .payroll-actions-cell,
  .payroll-pagination-controls {
    justify-content: flex-start;
  }
}
</style>
