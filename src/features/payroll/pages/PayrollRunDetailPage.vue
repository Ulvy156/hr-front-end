<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { ArrowLeft, Check, Download, RefreshCw, RotateCcw } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseTable, { type BaseTableColumn } from '@/components/ui/BaseTable.vue'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermission } from '@/features/auth/composable/usePermission'

import PayrollRunStatusBadge from '../components/PayrollRunStatusBadge.vue'
import { usePayroll } from '../composable/usePayroll'
import type { PayrollRunItem } from '../interface/payroll.interface'
import {
  canApprovePayrollRun,
  canRegeneratePayrollRun,
  formatPayrollAmount,
  formatPayrollDateTime,
  formatPayrollInteger,
  formatPayrollMonthLabel,
  getPayrollRequestErrorMessage,
  formatPayrollSalarySourceLabel,
  getPayrollSalarySourceVariant,
} from '../utils/payroll'

const route = useRoute()
const router = useRouter()
const { hasPermission } = usePermission()

const {
  payrollRunDetail,
  isPayrollRunDetailLoading,
  isMutatingPayrollRun,
  mutatingPayrollRunId,
  payrollRunMutationKind,
  payrollRunDetailError,
  fetchPayrollRunDetail,
  clearPayrollRunDetail,
  approvePayrollRun,
  regeneratePayrollRun,
  exportPayrollRunExcel,
} = usePayroll()

const payrollRunId = computed(() => {
  const rawId = route.params.id
  const normalizedId = Array.isArray(rawId) ? rawId[0] : rawId
  const parsedId = Number(normalizedId)

  return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null
})

const currentPayrollRun = computed(() => payrollRunDetail.value)
const canApproveCurrentRun = computed(
  () =>
    !!currentPayrollRun.value &&
    hasPermission(PERMISSIONS.PAYROLL_RUN_APPROVE) &&
    canApprovePayrollRun(currentPayrollRun.value),
)
const canRegenerateCurrentRun = computed(
  () =>
    !!currentPayrollRun.value &&
    hasPermission(PERMISSIONS.PAYROLL_RUN_REGENERATE) &&
    canRegeneratePayrollRun(currentPayrollRun.value),
)
const canExportCurrentRun = computed(
  () => !!currentPayrollRun.value && hasPermission(PERMISSIONS.PAYROLL_EXPORT),
)

const isCurrentRunMutating = computed(
  () =>
    !!currentPayrollRun.value &&
    isMutatingPayrollRun.value &&
    mutatingPayrollRunId.value === currentPayrollRun.value.id,
)

const isApprovingCurrentRun = computed(
  () => isCurrentRunMutating.value && payrollRunMutationKind.value === 'approve',
)
const isRegeneratingCurrentRun = computed(
  () => isCurrentRunMutating.value && payrollRunMutationKind.value === 'regenerate',
)
const isExportingCurrentRun = ref(false)

const primarySummaryMetric = computed(() => {
  if (!currentPayrollRun.value) {
    return null
  }

  return {
    label: 'Net Salary',
    value: formatPayrollAmount(currentPayrollRun.value.total_net_salary),
    helper: 'Final payout captured in this payroll snapshot.',
  }
})

const secondarySummaryItems = computed(() => {
  if (!currentPayrollRun.value) {
    return []
  }

  return [
    {
      key: 'employees',
      label: 'Employee Count',
      value: formatPayrollInteger(currentPayrollRun.value.employee_count),
      helper: 'Employees included in this run.',
      tone: 'default',
    },
  ]
})

const supportingSummaryGroups = computed(() => {
  if (!currentPayrollRun.value) {
    return []
  }

  return [
    {
      key: 'salary',
      label: 'Salary',
      tone: 'default',
      items: [
        {
          key: 'base-total',
          label: 'Base Salary',
          value: formatPayrollAmount(currentPayrollRun.value.total_base_salary),
          tone: 'default',
        },
        {
          key: 'prorated-total',
          label: 'Prorated Base',
          value: formatPayrollAmount(currentPayrollRun.value.total_prorated_base_salary),
          tone: 'default',
        },
      ],
    },
    {
      key: 'adjustment',
      label: 'Adjustments',
      tone: 'primary',
      items: [
        {
          key: 'overtime-total',
          label: 'Overtime',
          value: formatPayrollAmount(currentPayrollRun.value.total_overtime_pay),
          tone: Number(currentPayrollRun.value.total_overtime_pay) > 0 ? 'primary' : 'default',
        },
        {
          key: 'deduction-total',
          label: 'Deduction',
          value: formatPayrollAmount(currentPayrollRun.value.total_unpaid_leave_deduction),
          tone:
            Number(currentPayrollRun.value.total_unpaid_leave_deduction) > 0
              ? 'danger'
              : 'default',
        },
      ],
    },
    {
      key: 'work-info',
      label: 'Work Info',
      tone: 'secondary',
      items: [
        {
          key: 'working-days',
          label: 'Working Days',
          value: formatPayrollInteger(currentPayrollRun.value.company_working_days),
          tone: 'default',
        },
        {
          key: 'working-hours',
          label: 'Monthly Hours',
          value: formatPayrollInteger(currentPayrollRun.value.monthly_working_hours),
          tone: 'default',
        },
      ],
    },
  ]
})

const metadataItems = computed(() => {
  if (!currentPayrollRun.value) {
    return []
  }

  return [
    {
      key: 'created-at',
      label: 'Created At',
      value: formatPayrollDateTime(currentPayrollRun.value.created_at),
    },
    {
      key: 'updated-at',
      label: 'Updated At',
      value: formatPayrollDateTime(currentPayrollRun.value.updated_at),
    },
  ]
})

const breakdownColumns: BaseTableColumn[] = [
  { key: 'employee', label: 'Employee Name' },
  { key: 'base_salary', label: 'Base Salary', align: 'right' },
  { key: 'overtime', label: 'Overtime', align: 'right' },
  { key: 'deductions', label: 'Deductions', align: 'right' },
  { key: 'net_salary', label: 'Net Salary', align: 'right' },
]

const breakdownRows = computed(() =>
  (payrollRunDetail.value?.items ?? []).map((item) => ({
    id: item.id,
    employee: item.employee_name,
    base_salary: item.base_salary,
    overtime: item.overtime_pay,
    deductions: item.unpaid_leave_deduction,
    net_salary: item.net_salary,
    raw: item,
  })),
)

const additionalColumns: BaseTableColumn[] = [
  { key: 'employee', label: 'Employee Name' },
  { key: 'salary_source', label: 'Salary Source' },
  { key: 'working', label: 'Working Days / Hours' },
  { key: 'overtime_hours', label: 'OT Hours', align: 'right' },
  { key: 'leave', label: 'Leave Deduction', align: 'right' },
  { key: 'raw_net', label: 'Raw Net Salary', align: 'right' },
]

const additionalRows = computed(() =>
  (payrollRunDetail.value?.items ?? []).map((item) => ({
    id: item.id,
    employee: item.employee_name,
    salary_source: item.salary_source,
    working: `${formatPayrollInteger(item.eligible_working_days)} days / ${formatPayrollInteger(item.monthly_working_hours)} hours`,
    overtime_hours:
      Number(item.overtime_normal_hours) +
      Number(item.overtime_weekend_hours) +
      Number(item.overtime_holiday_hours),
    leave: item.unpaid_leave_deduction,
    raw_net: item.raw_net_salary,
    raw: item,
  })),
)

const asPayrollRunItem = (row: Record<string, unknown>) => {
  return row.raw as PayrollRunItem
}

const loadPayrollRunDetail = async () => {
  if (!payrollRunId.value) {
    return
  }

  try {
    await fetchPayrollRunDetail(payrollRunId.value)
  } catch (error) {
    ElMessage.error(
      getPayrollRequestErrorMessage(error, 'Unable to load payroll run details.'),
    )
  }
}

const downloadExportFile = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl)
  }, 0)
}

const handleApproveRun = async () => {
  if (!currentPayrollRun.value || !canApproveCurrentRun.value) {
    return
  }

  try {
    await ElMessageBox.confirm(
      `Approve the ${currentPayrollRun.value.payroll_month ?? 'selected'} payroll run?`,
      'Approve Payroll Run',
      {
        confirmButtonText: 'Approve',
        cancelButtonText: 'Keep Current',
        type: 'info',
      },
    )
  } catch {
    return
  }

  try {
    await approvePayrollRun(currentPayrollRun.value.id)
    ElMessage.success('Payroll run approved successfully.')
    await loadPayrollRunDetail()
  } catch (error) {
    ElMessage.error(getPayrollRequestErrorMessage(error))
  }
}

const handleRegenerateRun = async () => {
  if (!currentPayrollRun.value || !canRegenerateCurrentRun.value) {
    return
  }

  try {
    await ElMessageBox.confirm(
      `Regenerate the ${currentPayrollRun.value.payroll_month ?? 'selected'} payroll run from current payroll data?`,
      'Regenerate Payroll Run',
      {
        confirmButtonText: 'Regenerate',
        cancelButtonText: 'Keep Current',
        type: 'info',
      },
    )
  } catch {
    return
  }

  try {
    await regeneratePayrollRun(currentPayrollRun.value.id)
    ElMessage.success('Payroll run regenerated successfully.')
    await loadPayrollRunDetail()
  } catch (error) {
    ElMessage.error(getPayrollRequestErrorMessage(error))
  }
}

const handleExportRun = async () => {
  if (!currentPayrollRun.value || !canExportCurrentRun.value || isExportingCurrentRun.value) {
    return
  }

  isExportingCurrentRun.value = true

  try {
    const response = await exportPayrollRunExcel(currentPayrollRun.value.id)
    downloadExportFile(response.blob, response.filename)
    ElMessage.success('Payroll run export started successfully.')
  } catch (error) {
    ElMessage.error(getPayrollRequestErrorMessage(error, 'Failed to export payroll run.'))
  } finally {
    isExportingCurrentRun.value = false
  }
}

const goBack = async () => {
  await router.push({ name: 'payroll-runs' })
}

watch(
  payrollRunId,
  async () => {
    clearPayrollRunDetail()
    await loadPayrollRunDetail()
  },
  {
    immediate: true,
  },
)

onBeforeUnmount(() => {
  clearPayrollRunDetail()
})
</script>

<template>
  <main class="payroll-detail-page">
    <div class="payroll-detail-page-header">
      <div class="payroll-detail-page-copy">
        <BaseButton variant="ghost" @click="goBack">
          <ArrowLeft :size="16" />
          Back to Payroll Runs
        </BaseButton>

        <div class="payroll-detail-page-title-block">
          <p class="payroll-detail-eyebrow">Payroll Run</p>
          <div class="payroll-detail-page-heading">
            <h1 class="payroll-detail-page-title">
              {{ payrollRunDetail ? formatPayrollMonthLabel(payrollRunDetail.payroll_month) : 'Payroll Run Details' }}
            </h1>
            <PayrollRunStatusBadge v-if="payrollRunDetail" :status="payrollRunDetail.status" />
          </div>
          <p class="payroll-detail-page-subtitle">
            Review payroll totals, employee breakdowns, and salary-related deductions for the selected payroll run.
          </p>
        </div>
      </div>

      <div class="payroll-detail-page-actions">
        <BaseButton :loading="isPayrollRunDetailLoading" variant="ghost" @click="loadPayrollRunDetail">
          <RefreshCw :size="16" />
          Refresh
        </BaseButton>
        <BaseButton
          v-if="canApproveCurrentRun"
          :loading="isApprovingCurrentRun"
          @click="handleApproveRun"
        >
          <Check :size="16" />
          Approve
        </BaseButton>
        <BaseButton
          v-if="canRegenerateCurrentRun"
          :loading="isRegeneratingCurrentRun"
          variant="secondary"
          @click="handleRegenerateRun"
        >
          <RotateCcw :size="16" />
          Regenerate
        </BaseButton>
        <BaseButton
          v-if="canExportCurrentRun"
          :loading="isExportingCurrentRun"
          variant="ghost"
          @click="handleExportRun"
        >
          <Download :size="16" />
          Export Excel
        </BaseButton>
      </div>
    </div>

    <BaseCard v-if="!payrollRunId" class="payroll-detail-state-card">
      <div class="payroll-detail-state">
        <h2 class="payroll-detail-state-title">Invalid payroll run</h2>
        <p class="payroll-detail-state-text">
          The selected payroll run ID is invalid or missing from the current route.
        </p>
        <BaseButton variant="ghost" @click="goBack">Back to Payroll Runs</BaseButton>
      </div>
    </BaseCard>

    <BaseCard v-else-if="isPayrollRunDetailLoading" class="payroll-detail-state-card">
      <div class="payroll-detail-state">
        <BaseSpinner />
        <h2 class="payroll-detail-state-title">Loading payroll run</h2>
        <p class="payroll-detail-state-text">
          Fetching the latest payroll run detail and employee breakdown data.
        </p>
      </div>
    </BaseCard>

    <BaseCard v-else-if="payrollRunDetailError" class="payroll-detail-state-card">
      <div class="payroll-detail-state">
        <h2 class="payroll-detail-state-title">Unable to load payroll run</h2>
        <p class="payroll-detail-state-text">{{ payrollRunDetailError }}</p>
        <div class="payroll-detail-state-actions">
          <BaseButton variant="ghost" @click="goBack">Back</BaseButton>
          <BaseButton @click="loadPayrollRunDetail">
            <RefreshCw :size="16" />
            Try Again
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <template v-else-if="payrollRunDetail">
      <BaseCard class="payroll-detail-summary-card">
        <div class="payroll-detail-summary-panel">
          <div class="payroll-detail-summary-header">
            <div class="payroll-detail-summary-copy">
              <p class="payroll-detail-eyebrow">Payroll Summary</p>
            </div>
          </div>

          <div class="payroll-detail-summary-top-grid">
            <div
              v-if="primarySummaryMetric"
              class="payroll-detail-summary-item payroll-detail-summary-item-primary"
            >
              <p class="payroll-detail-summary-label">{{ primarySummaryMetric.label }}</p>
              <p class="payroll-detail-summary-value payroll-detail-summary-value-primary">
                {{ primarySummaryMetric.value }}
              </p>
              <p class="payroll-detail-summary-helper">{{ primarySummaryMetric.helper }}</p>
            </div>

            <div class="payroll-detail-secondary-grid">
              <div
                v-for="item in secondarySummaryItems"
                :key="item.key"
                :class="[
                  'payroll-detail-summary-item',
                  'payroll-detail-summary-item-secondary',
                  `payroll-detail-summary-tone-${item.tone}`,
                ]"
              >
                <p class="payroll-detail-summary-label">{{ item.label }}</p>
                <p class="payroll-detail-summary-value payroll-detail-summary-value-secondary">
                  {{ item.value }}
                </p>
                <p class="payroll-detail-summary-helper">{{ item.helper }}</p>
              </div>
            </div>
          </div>

          <div class="payroll-detail-summary-groups">
            <div
              v-for="group in supportingSummaryGroups"
              :key="group.key"
              :class="[
                'payroll-detail-summary-group',
                `payroll-detail-summary-group-${group.tone}`,
              ]"
            >
              <div class="payroll-detail-summary-group-header">
                <p class="payroll-detail-summary-group-label">{{ group.label }}</p>
              </div>

              <div class="payroll-detail-summary-grid">
                <div
                  v-for="item in group.items"
                  :key="item.key"
                  :class="[
                    'payroll-detail-summary-item',
                    'payroll-detail-summary-item-compact',
                    `payroll-detail-summary-tone-${item.tone}`,
                  ]"
                >
                  <p class="payroll-detail-summary-label">{{ item.label }}</p>
                  <p class="payroll-detail-summary-value payroll-detail-summary-value-compact">
                    {{ item.value }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div v-if="metadataItems.length" class="payroll-detail-meta-row">
            <div
              v-for="item in metadataItems"
              :key="item.key"
              class="payroll-detail-meta-chip"
            >
              <span class="payroll-detail-meta-label">{{ item.label }}</span>
              <span class="payroll-detail-meta-value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="payroll-detail-breakdown-card">
        <div class="payroll-detail-section">
          <div class="payroll-detail-section-header">
            <div>
              <h3 class="payroll-detail-section-title">Payroll Breakdown</h3>
              <p class="payroll-detail-section-text">
                Review the employee-by-employee payroll snapshot captured in this run.
              </p>
            </div>
          </div>

          <div class="payroll-detail-breakdown-table">
            <BaseTable
              :columns="breakdownColumns"
              :rows="breakdownRows"
              empty-text="No payroll item breakdowns are available for this run."
            >
              <template #cell-employee="{ row }">
                <div class="payroll-detail-employee">
                  <strong class="payroll-detail-value">{{ asPayrollRunItem(row).employee_name }}</strong>
                  <span class="payroll-detail-section-text">
                    {{ asPayrollRunItem(row).employee_code || '--' }}
                  </span>
                </div>
              </template>

              <template #cell-base_salary="{ value }">
                {{ formatPayrollAmount(String(value)) }}
              </template>

              <template #cell-overtime="{ value }">
                {{ formatPayrollAmount(String(value)) }}
              </template>

              <template #cell-deductions="{ value }">
                {{ formatPayrollAmount(String(value)) }}
              </template>

              <template #cell-net_salary="{ value }">
                <strong class="payroll-detail-net-value">
                  {{ formatPayrollAmount(String(value)) }}
                </strong>
              </template>
            </BaseTable>
          </div>
        </div>
      </BaseCard>

      <BaseCard v-if="additionalRows.length" class="payroll-detail-metadata-card">
        <div class="payroll-detail-section">
          <div class="payroll-detail-section-header">
            <div>
              <h3 class="payroll-detail-section-title">Supporting Breakdown</h3>
              <p class="payroll-detail-section-text">
                Review salary source, attendance context, overtime hours, and leave deductions by employee.
              </p>
            </div>
          </div>

          <BaseTable
            :columns="additionalColumns"
            :rows="additionalRows"
            empty-text="No additional payroll metrics are available for this run."
          >
            <template #cell-employee="{ row }">
              <div class="payroll-detail-employee">
                <strong class="payroll-detail-value">{{ asPayrollRunItem(row).employee_name }}</strong>
                <span class="payroll-detail-section-text">
                  {{ asPayrollRunItem(row).employee_code || '--' }}
                </span>
              </div>
            </template>

            <template #cell-salary_source="{ value }">
              <BaseBadge :variant="getPayrollSalarySourceVariant(String(value))">
                {{ formatPayrollSalarySourceLabel(String(value)) }}
              </BaseBadge>
            </template>

            <template #cell-overtime_hours="{ row }">
              <span class="payroll-detail-table-value">
                {{ formatPayrollAmount(asPayrollRunItem(row).overtime_normal_hours) }}
                /
                {{ formatPayrollAmount(asPayrollRunItem(row).overtime_weekend_hours) }}
                /
                {{ formatPayrollAmount(asPayrollRunItem(row).overtime_holiday_hours) }}
              </span>
            </template>

            <template #cell-leave="{ row }">
              <span class="payroll-detail-table-value">
                {{ formatPayrollAmount(asPayrollRunItem(row).unpaid_leave_deduction) }}
                ({{ formatPayrollAmount(asPayrollRunItem(row).unpaid_leave_units) }} units)
              </span>
            </template>

            <template #cell-raw_net="{ value }">
              {{ formatPayrollAmount(String(value)) }}
            </template>
          </BaseTable>
        </div>
      </BaseCard>
    </template>

    <BaseCard v-else class="payroll-detail-state-card">
      <div class="payroll-detail-state">
        <h2 class="payroll-detail-state-title">Payroll run not found</h2>
        <p class="payroll-detail-state-text">
          No payroll run details are available for this selection.
        </p>
        <BaseButton variant="ghost" @click="goBack">Back to Payroll Runs</BaseButton>
      </div>
    </BaseCard>
  </main>
</template>

<style scoped>
.payroll-detail-page,
.payroll-detail-page-copy,
.payroll-detail-page-title-block,
.payroll-detail-summary-panel,
.payroll-detail-summary-copy,
.payroll-detail-section,
.payroll-detail-state,
.payroll-detail-employee {
  display: flex;
  flex-direction: column;
}

.payroll-detail-page,
.payroll-detail-section {
  gap: 1.5rem;
}

.payroll-detail-page-header,
.payroll-detail-section-header,
.payroll-detail-page-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.payroll-detail-page-actions,
.payroll-detail-secondary-grid,
.payroll-detail-meta-row,
.payroll-detail-state-actions {
  display: flex;
  gap: 0.75rem;
}

.payroll-detail-page-copy,
.payroll-detail-page-title-block,
.payroll-detail-summary-copy,
.payroll-detail-employee,
.payroll-detail-state {
  gap: 0.5rem;
}

.payroll-detail-page-title,
.payroll-detail-summary-title,
.payroll-detail-section-title,
.payroll-detail-state-title,
.payroll-detail-summary-value,
.payroll-detail-summary-helper,
.payroll-detail-value,
.payroll-detail-net-value,
.payroll-detail-meta-value {
  color: hsl(var(--foreground));
}

.payroll-detail-page-subtitle,
.payroll-detail-section-text,
.payroll-detail-state-text,
.payroll-detail-eyebrow,
.payroll-detail-summary-label,
.payroll-detail-meta-label {
  color: hsl(var(--muted-foreground));
}

.payroll-detail-eyebrow,
.payroll-detail-summary-label,
.payroll-detail-meta-label {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.payroll-detail-summary-card,
.payroll-detail-breakdown-card,
.payroll-detail-metadata-card,
.payroll-detail-state-card {
  overflow: hidden;
}

.payroll-detail-summary-panel,
.payroll-detail-section {
  padding: 1.25rem;
}

.payroll-detail-summary-top-grid {
  display: grid;
  grid-template-columns: minmax(18rem, 1.7fr) minmax(12rem, 1fr);
  gap: 1rem;
}

.payroll-detail-secondary-grid {
  flex-direction: column;
}

.payroll-detail-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.payroll-detail-summary-groups {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.payroll-detail-summary-group,
.payroll-detail-summary-item {
  display: flex;
  flex-direction: column;
}

.payroll-detail-summary-group {
  gap: 0.75rem;
  padding: 0.875rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
  box-shadow: var(--shadow-card);
}

.payroll-detail-summary-group-default {
  background: hsl(var(--secondary) / 0.08);
}

.payroll-detail-summary-group-primary {
  background: hsl(var(--primary) / 0.04);
}

.payroll-detail-summary-group-secondary {
  background: hsl(var(--muted) / 0.45);
}

.payroll-detail-summary-group-header {
  display: flex;
  align-items: center;
}

.payroll-detail-summary-group-label {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.payroll-detail-summary-item {
  justify-content: center;
  gap: 0.3rem;
  min-height: 6.4rem;
  padding: 0.75rem 0.875rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
}

.payroll-detail-summary-item-primary {
  min-height: 10.5rem;
  padding: 1rem 1.125rem;
  border-left: 4px solid hsl(var(--primary));
  box-shadow: var(--shadow-card);
}

.payroll-detail-summary-item-secondary {
  min-height: 10.5rem;
}

.payroll-detail-summary-item-compact {
  min-height: 5.25rem;
}

.payroll-detail-summary-item-primary,
.payroll-detail-summary-item-secondary {
  align-items: flex-start;
}

.payroll-detail-summary-tone-default {
  border-color: hsl(var(--border-gray));
}

.payroll-detail-summary-tone-primary {
  border-color: hsl(var(--primary) / 0.24);
  background: hsl(var(--primary) / 0.05);
}

.payroll-detail-summary-tone-primary .payroll-detail-summary-value {
  color: hsl(var(--primary));
}

.payroll-detail-summary-tone-danger {
  border-color: hsl(var(--destructive) / 0.22);
  background: hsl(var(--destructive) / 0.05);
}

.payroll-detail-summary-tone-danger .payroll-detail-summary-value {
  color: hsl(var(--destructive));
}

.payroll-detail-summary-value {
  font-size: 1.125rem;
  font-weight: 700;
}

.payroll-detail-summary-value-primary {
  font-size: clamp(2.4rem, 5vw, 3.75rem);
  line-height: 0.95;
}

.payroll-detail-summary-value-secondary {
  font-size: 2rem;
}

.payroll-detail-summary-value-compact {
  font-size: 1.4rem;
}

.payroll-detail-summary-helper {
  font-size: var(--text-sm);
  color: hsl(var(--muted-foreground));
}

.payroll-detail-net-value {
  font-weight: 700;
  color: hsl(var(--primary));
}

.payroll-detail-meta-row {
  flex-wrap: wrap;
}

.payroll-detail-meta-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 0.875rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 9999px;
  background: hsl(var(--card));
}

.payroll-detail-meta-value {
  font-weight: 600;
}

.payroll-detail-table-value {
  color: hsl(var(--foreground));
}

.payroll-detail-state {
  align-items: center;
  justify-content: center;
  min-height: 16rem;
  padding: 1.5rem;
  text-align: center;
}

.payroll-detail-breakdown-table :deep(.base-table thead th:last-child),
.payroll-detail-breakdown-table :deep(.base-table tbody td:last-child) {
  box-shadow: inset 3px 0 0 hsl(var(--primary) / 0.24);
}

.payroll-detail-breakdown-table :deep(.base-table tbody tr:nth-child(even)) {
  background: hsl(var(--secondary) / 0.12);
}

.payroll-detail-breakdown-table :deep(.base-table tbody tr:hover) {
  background: hsl(var(--muted));
}

.payroll-detail-breakdown-table :deep(.base-table tbody td:last-child) {
  font-weight: 700;
  color: hsl(var(--primary));
}

@media (max-width: 768px) {
  .payroll-detail-page-header,
  .payroll-detail-section-header,
  .payroll-detail-page-heading {
    flex-direction: column;
    align-items: stretch;
  }

  .payroll-detail-page-actions,
  .payroll-detail-summary-top-grid,
  .payroll-detail-secondary-grid {
    display: flex;
    flex-direction: column;
  }

  .payroll-detail-summary-groups,
  .payroll-detail-summary-grid {
    grid-template-columns: 1fr;
  }

  .payroll-detail-state-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
