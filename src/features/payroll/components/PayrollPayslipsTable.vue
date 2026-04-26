<script setup lang="ts">
import { CalendarDays, Eye } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseTable, { type BaseTableColumn } from '@/components/ui/BaseTable.vue'

import type {
  PayrollOwnPayslip,
  PayrollOwnPayslipListResponse,
} from '../interface/payroll.interface'
import {
  formatPayrollAmount,
  formatPayrollMonthLabel,
  getPayslipPageSummary,
} from '../utils/payroll'
import PayrollRunStatusBadge from './PayrollRunStatusBadge.vue'

const props = withDefaults(
  defineProps<{
    payslips: PayrollOwnPayslipListResponse | null
    loading?: boolean
    error?: string
  }>(),
  {
    loading: false,
    error: '',
  },
)

const emit = defineEmits<{
  retry: []
  navigateByUrl: [url: string]
  viewDetails: [payslip: PayrollOwnPayslip]
}>()

const columns: BaseTableColumn[] = [
  { key: 'month', label: 'Payroll Month' },
  { key: 'status', label: 'Status' },
  { key: 'base', label: 'Base Salary', align: 'right' },
  { key: 'prorated', label: 'Prorated Base', align: 'right' },
  { key: 'overtime', label: 'Overtime Pay', align: 'right' },
  { key: 'deduction', label: 'Unpaid Leave Deduction', align: 'right' },
  { key: 'net', label: 'Net Salary', align: 'right' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

const rows = computed(() =>
  (props.payslips?.data ?? []).map((payslip) => ({
    id: payslip.id,
    month: payslip.payroll_month,
    status: payslip.payroll_status,
    base: payslip.base_salary,
    prorated: payslip.prorated_base_salary,
    overtime: payslip.overtime_pay,
    deduction: payslip.unpaid_leave_deduction,
    net: payslip.net_salary,
    actions: payslip.id,
    raw: payslip,
  })),
)

const hasPayslips = computed(() => (props.payslips?.data.length ?? 0) > 0)
const pageSummary = computed(() => getPayslipPageSummary(props.payslips))

const navigateByUrl = (url: string | null | undefined) => {
  if (!url) {
    return
  }

  emit('navigateByUrl', url)
}
</script>

<template>
  <section class="payroll-payslips-table-section">
    <div class="payroll-payslips-table-header">
      <div>
        <h2 class="payroll-payslips-table-title">My Payslips</h2>
        <p class="payroll-payslips-table-text">
          Review monthly payroll snapshots and open the full salary breakdown for each month.
        </p>
      </div>

      <BaseButton :loading="loading" variant="ghost" @click="emit('retry')">
        Refresh
      </BaseButton>
    </div>

    <div v-if="loading && !hasPayslips" class="payroll-payslips-table-state">
      <BaseSpinner />
      <p class="payroll-payslips-table-text">Loading payslips...</p>
    </div>

    <div
      v-else-if="error && !hasPayslips"
      class="payroll-payslips-table-state payroll-payslips-table-state-error"
    >
      <p class="payroll-payslips-table-text">{{ error }}</p>
      <BaseButton variant="secondary" @click="emit('retry')">Try Again</BaseButton>
    </div>

    <template v-else>
      <BaseTable :columns="columns" :rows="rows" empty-text="No payslips matched the current filters.">
        <template #cell-month="{ row }">
          <button
            class="payroll-payslips-row-link"
            type="button"
            @click="emit('viewDetails', row.raw as PayrollOwnPayslip)"
          >
            <span class="payroll-payslips-row-link-text">
              <CalendarDays :size="16" />
              {{ formatPayrollMonthLabel((row.raw as PayrollOwnPayslip).payroll_month) }}
            </span>
          </button>
        </template>

        <template #cell-status="{ row }">
          <PayrollRunStatusBadge :status="(row.raw as PayrollOwnPayslip).payroll_status" />
        </template>

        <template #cell-base="{ value }">
          {{ formatPayrollAmount(String(value)) }}
        </template>

        <template #cell-prorated="{ value }">
          {{ formatPayrollAmount(String(value)) }}
        </template>

        <template #cell-overtime="{ value }">
          {{ formatPayrollAmount(String(value)) }}
        </template>

        <template #cell-deduction="{ value }">
          {{ formatPayrollAmount(String(value)) }}
        </template>

        <template #cell-net="{ value }">
          <strong class="payroll-payslips-net-cell">
            {{ formatPayrollAmount(String(value)) }}
          </strong>
        </template>

        <template #cell-actions="{ row }">
          <div class="payroll-payslips-actions">
            <BaseButton variant="ghost" @click="emit('viewDetails', row.raw as PayrollOwnPayslip)">
              <Eye :size="16" />
              View
            </BaseButton>
          </div>
        </template>
      </BaseTable>

      <div v-if="payslips?.meta && payslips.meta.total > 0" class="payroll-payslips-table-footer">
        <p class="payroll-payslips-table-text">{{ pageSummary }}</p>

        <div class="payroll-payslips-pagination-controls">
          <BaseButton
            :disabled="!payslips.links.first || loading"
            variant="ghost"
            @click="navigateByUrl(payslips.links.first)"
          >
            First
          </BaseButton>
          <BaseButton
            :disabled="!payslips.links.prev || loading"
            variant="ghost"
            @click="navigateByUrl(payslips.links.prev)"
          >
            Previous
          </BaseButton>
          <BaseButton
            :disabled="!payslips.links.next || loading"
            variant="ghost"
            @click="navigateByUrl(payslips.links.next)"
          >
            Next
          </BaseButton>
          <BaseButton
            :disabled="!payslips.links.last || loading"
            variant="ghost"
            @click="navigateByUrl(payslips.links.last)"
          >
            Last
          </BaseButton>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.payroll-payslips-table-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.payroll-payslips-table-header,
.payroll-payslips-table-footer {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.payroll-payslips-table-title,
.payroll-payslips-net-cell {
  color: hsl(var(--foreground));
}

.payroll-payslips-table-title {
  font-size: 1rem;
  font-weight: 700;
}

.payroll-payslips-table-text {
  color: hsl(var(--muted-foreground));
}

.payroll-payslips-table-state {
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

.payroll-payslips-table-state-error {
  gap: 1rem;
}

.payroll-payslips-row-link {
  border: 0;
  background: transparent;
  color: hsl(var(--primary));
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  padding: 0;
}

.payroll-payslips-row-link:hover {
  text-decoration: underline;
}

.payroll-payslips-row-link-text {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.payroll-payslips-actions,
.payroll-payslips-pagination-controls {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
}

.payroll-payslips-pagination-controls {
  flex-wrap: wrap;
}

.payroll-payslips-net-cell {
  font-weight: 700;
}

@media (max-width: 768px) {
  .payroll-payslips-table-header,
  .payroll-payslips-table-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .payroll-payslips-actions,
  .payroll-payslips-pagination-controls {
    justify-content: flex-start;
  }
}
</style>
