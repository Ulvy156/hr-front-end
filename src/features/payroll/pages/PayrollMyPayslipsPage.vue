<script setup lang="ts">
import { RefreshCw } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'

import PayrollPayslipDetailModal from '../components/PayrollPayslipDetailModal.vue'
import PayrollPayslipsTable from '../components/PayrollPayslipsTable.vue'
import { usePayroll } from '../composable/usePayroll'
import type {
  PayrollOwnPayslip,
  PayrollOwnPayslipFiltersState,
  PayrollOwnPayslipListParams,
} from '../interface/payroll.interface'
import { PAYROLL_RUN_STATUS } from '../interface/payroll.interface'
import {
  createDefaultPayrollOwnPayslipFilters,
  formatPayrollStatusLabel,
} from '../utils/payroll'

const {
  payrollOwnPayslips,
  payrollOwnPayslipDetail,
  isPayrollOwnPayslipsLoading,
  isPayrollOwnPayslipDetailLoading,
  payrollOwnPayslipsError,
  payrollOwnPayslipDetailError,
  fetchPayrollOwnPayslips,
  fetchPayrollOwnPayslipsByUrl,
  fetchPayrollOwnPayslipDetail,
  clearPayrollOwnPayslipDetail,
} = usePayroll()

const filters = reactive<PayrollOwnPayslipFiltersState>(createDefaultPayrollOwnPayslipFilters())
const currentListUrl = ref<string | null>(null)
const selectedPayslipId = ref<number | null>(null)
const isDetailModalOpen = ref(false)

const statusOptions: BaseDropdownOption[] = [
  { label: 'All statuses', value: '' },
  { label: formatPayrollStatusLabel(PAYROLL_RUN_STATUS.DRAFT), value: PAYROLL_RUN_STATUS.DRAFT },
  {
    label: formatPayrollStatusLabel(PAYROLL_RUN_STATUS.APPROVED),
    value: PAYROLL_RUN_STATUS.APPROVED,
  },
  { label: formatPayrollStatusLabel(PAYROLL_RUN_STATUS.PAID), value: PAYROLL_RUN_STATUS.PAID },
  {
    label: formatPayrollStatusLabel(PAYROLL_RUN_STATUS.CANCELLED),
    value: PAYROLL_RUN_STATUS.CANCELLED,
  },
]

const perPageOptions: BaseDropdownOption[] = [
  { label: '10 per page', value: 10 },
  { label: '20 per page', value: 20 },
  { label: '50 per page', value: 50 },
]

const buildListParams = (): PayrollOwnPayslipListParams => {
  const params: PayrollOwnPayslipListParams = {
    per_page: filters.per_page,
  }

  if (filters.month) {
    params.month = filters.month
  }

  if (filters.status) {
    params.status = filters.status
  }

  return params
}

const loadPayslips = async () => {
  currentListUrl.value = null

  try {
    await fetchPayrollOwnPayslips(buildListParams())
  } catch {
    return
  }
}

const refreshPayslips = async () => {
  try {
    if (currentListUrl.value) {
      await fetchPayrollOwnPayslipsByUrl(currentListUrl.value)
      return
    }

    await fetchPayrollOwnPayslips(buildListParams())
  } catch {
    return
  }
}

const applyFilters = async () => {
  await loadPayslips()
}

const resetFilters = async () => {
  Object.assign(filters, createDefaultPayrollOwnPayslipFilters())
  await loadPayslips()
}

const handleNavigateByUrl = async (url: string) => {
  currentListUrl.value = url

  try {
    await fetchPayrollOwnPayslipsByUrl(url)
  } catch {
    return
  }
}

const openPayslipDetail = async (payslip: PayrollOwnPayslip) => {
  selectedPayslipId.value = payslip.id
  isDetailModalOpen.value = true

  try {
    await fetchPayrollOwnPayslipDetail(payslip.id)
  } catch {
    return
  }
}

const closePayslipDetail = () => {
  isDetailModalOpen.value = false
  selectedPayslipId.value = null
  clearPayrollOwnPayslipDetail()
}

const retryPayslipDetail = async () => {
  if (!selectedPayslipId.value) {
    return
  }

  try {
    await fetchPayrollOwnPayslipDetail(selectedPayslipId.value)
  } catch {
    return
  }
}

onMounted(() => {
  void loadPayslips()
})
</script>

<template>
  <main class="payroll-my-payslips-page">
    <header class="payroll-my-payslips-page-header">
      <div class="payroll-my-payslips-page-copy">
        <h1 class="payroll-my-payslips-page-title">My Payslips</h1>
        <p class="payroll-my-payslips-page-subtitle">
          Review your payroll history and open the full payslip breakdown for each payroll month.
        </p>
      </div>

      <div class="payroll-my-payslips-page-actions">
        <BaseButton :loading="isPayrollOwnPayslipsLoading" variant="ghost" @click="refreshPayslips">
          <RefreshCw :size="16" />
          Refresh
        </BaseButton>
      </div>
    </header>

    <BaseCard class="payroll-my-payslips-filters-card">
      <div class="payroll-my-payslips-section-header">
        <div>
          <h2 class="payroll-my-payslips-section-title">Filters</h2>
          <p class="payroll-my-payslips-section-text">
            Narrow your payslips by payroll month, status, and rows per page.
          </p>
        </div>
      </div>

      <form class="payroll-my-payslips-filters-grid" @submit.prevent="applyFilters">
        <BaseDatePicker
          v-model="filters.month"
          format="MMMM YYYY"
          label="Month"
          type="month"
          value-format="YYYY-MM"
        />
        <BaseDropdown
          v-model="filters.status"
          :options="statusOptions"
          label="Status"
          placeholder="All statuses"
        />
        <BaseDropdown
          v-model="filters.per_page"
          :clearable="false"
          :options="perPageOptions"
          label="Rows Per Page"
        />

        <div class="payroll-my-payslips-filter-actions">
          <BaseButton type="submit">Apply Filters</BaseButton>
          <BaseButton type="button" variant="ghost" @click="resetFilters">Reset</BaseButton>
        </div>
      </form>
    </BaseCard>

    <PayrollPayslipsTable
      :error="payrollOwnPayslipsError"
      :loading="isPayrollOwnPayslipsLoading"
      :payslips="payrollOwnPayslips"
      @navigate-by-url="handleNavigateByUrl"
      @retry="refreshPayslips"
      @view-details="openPayslipDetail"
    />

    <PayrollPayslipDetailModal
      :error="payrollOwnPayslipDetailError"
      :loading="isPayrollOwnPayslipDetailLoading"
      :open="isDetailModalOpen"
      :payslip="payrollOwnPayslipDetail"
      @close="closePayslipDetail"
      @retry="retryPayslipDetail"
    />
  </main>
</template>

<style scoped>
.payroll-my-payslips-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.payroll-my-payslips-page-header,
.payroll-my-payslips-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.payroll-my-payslips-page-copy {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.payroll-my-payslips-page-actions,
.payroll-my-payslips-filter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.payroll-my-payslips-page-title,
.payroll-my-payslips-section-title {
  color: hsl(var(--foreground));
}

.payroll-my-payslips-page-title {
  font-size: 1.9rem;
  font-weight: 700;
  line-height: 1.1;
}

.payroll-my-payslips-page-subtitle,
.payroll-my-payslips-section-text {
  color: hsl(var(--muted-foreground));
}

.payroll-my-payslips-filters-card {
  padding: 1.5rem;
}

.payroll-my-payslips-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

@media (max-width: 768px) {
  .payroll-my-payslips-page-header,
  .payroll-my-payslips-section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .payroll-my-payslips-page-actions,
  .payroll-my-payslips-filter-actions {
    align-items: stretch;
  }
}
</style>
