<script setup lang="ts">
import { storeToRefs } from 'pinia'

import { CirclePlus, RefreshCw } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseSelect, { type BaseSelectOption } from '@/components/ui/BaseSelect.vue'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermission } from '@/features/auth/composable/usePermission'
import { useEmployeeStore } from '@/features/employees/store/employeeStore'

import PayrollSalaryFormModal from '../components/PayrollSalaryFormModal.vue'
import PayrollSalariesTable from '../components/PayrollSalariesTable.vue'
import { usePayroll } from '../composable/usePayroll'
import type {
  PayrollSalary,
  PayrollSalaryFiltersState,
  PayrollSalaryFormSubmitPayload,
} from '../interface/payroll.interface'
import {
  createDefaultPayrollSalaryFilters,
  getPayrollSalarySaveErrorMessage,
} from '../utils/payroll'
import { PAYROLL_SALARY_STATUS } from '../interface/payroll.interface'

const { hasPermission } = usePermission()
const canManagePayrollSalaries = computed(() =>
  hasPermission(PERMISSIONS.PAYROLL_SALARY_MANAGE),
)

const employeeStore = useEmployeeStore()
const {
  employees,
  isLoading: isEmployeesLoading,
  error: employeesError,
} = storeToRefs(employeeStore)

const {
  payrollSalaries,
  isPayrollSalariesLoading,
  isSavingPayrollSalary,
  payrollSalariesError,
  fetchPayrollSalariesWithFilters,
  fetchPayrollSalariesByUrl,
  savePayrollSalary,
} = usePayroll()

const filters = reactive<PayrollSalaryFiltersState>(createDefaultPayrollSalaryFilters())
const currentListUrl = ref<string | null>(null)
const isSalaryModalOpen = ref(false)
const salaryFormMode = ref<'create' | 'edit'>('create')
const activeSalary = ref<PayrollSalary | null>(null)
const formSubmitError = ref('')
const pageFeedback = ref('')
const hasLoadedEmployeeOptions = ref(false)

const perPageOptions: BaseDropdownOption[] = [
  { label: '10 per page', value: 10 },
  { label: '20 per page', value: 20 },
  { label: '50 per page', value: 50 },
]

const statusOptions: BaseDropdownOption[] = [
  { label: 'Current', value: PAYROLL_SALARY_STATUS.CURRENT },
  { label: 'Ended', value: PAYROLL_SALARY_STATUS.ENDED },
  { label: 'All', value: PAYROLL_SALARY_STATUS.ALL },
]

const employeeOptions = computed<BaseSelectOption[]>(() =>
  (employees.value?.data ?? []).map((employee) => ({
    label: employee.employee_code
      ? `${employee.full_name} (${employee.employee_code})`
      : employee.full_name,
    value: employee.id,
  })),
)

const hasEmployeeOptions = computed(() => employeeOptions.value.length > 0)

const employeeFilterMessage = computed(() => {
  if (employeesError.value && !hasEmployeeOptions.value) {
    return employeesError.value
  }

  if (isEmployeesLoading.value && !hasEmployeeOptions.value) {
    return 'Loading employees...'
  }

  if (hasLoadedEmployeeOptions.value && !hasEmployeeOptions.value) {
    return 'No employees available.'
  }

  return ''
})

const employeeFilterModel = computed({
  get: () => filters.employee_id ?? undefined,
  set: (value: string | number | undefined) => {
    if (value === undefined || value === null || value === '') {
      filters.employee_id = null
      return
    }

    const parsedValue = Number(value)
    filters.employee_id = Number.isFinite(parsedValue) ? parsedValue : null
  },
})

const ensureEmployeeOptionsLoaded = async () => {
  if (hasLoadedEmployeeOptions.value || isEmployeesLoading.value || hasEmployeeOptions.value) {
    hasLoadedEmployeeOptions.value = true
    return
  }

  try {
    await employeeStore.fetchEmployees({
      status: 'active',
      per_page: 100,
    })
  } catch {
    return
  } finally {
    hasLoadedEmployeeOptions.value = true
  }
}

const loadPayrollSalaries = async () => {
  pageFeedback.value = ''
  currentListUrl.value = null

  try {
    await fetchPayrollSalariesWithFilters(filters)
  } catch {
    return
  }
}

const refreshPayrollSalaries = async () => {
  pageFeedback.value = ''

  try {
    if (currentListUrl.value) {
      await fetchPayrollSalariesByUrl(currentListUrl.value)
      return
    }

    await fetchPayrollSalariesWithFilters(filters)
  } catch {
    return
  }
}

const applyFilters = async () => {
  await loadPayrollSalaries()
}

const resetFilters = async () => {
  Object.assign(filters, createDefaultPayrollSalaryFilters())
  await loadPayrollSalaries()
}

const handleNavigateByUrl = async (url: string) => {
  pageFeedback.value = ''
  currentListUrl.value = url

  try {
    await fetchPayrollSalariesByUrl(url)
  } catch {
    return
  }
}

const openCreateModal = () => {
  salaryFormMode.value = 'create'
  activeSalary.value = null
  formSubmitError.value = ''
  isSalaryModalOpen.value = true
}

const openEditModal = (salary: PayrollSalary) => {
  salaryFormMode.value = 'edit'
  activeSalary.value = salary
  formSubmitError.value = ''
  isSalaryModalOpen.value = true
}

const closeSalaryModal = () => {
  isSalaryModalOpen.value = false
  activeSalary.value = null
  formSubmitError.value = ''
}

const handleSaveSalary = async ({ payload, currentSalary }: PayrollSalaryFormSubmitPayload) => {
  formSubmitError.value = ''

  try {
    const result = await savePayrollSalary({
      mode: salaryFormMode.value,
      payload,
      currentSalary,
      salaryId: activeSalary.value?.id ?? null,
    })

    ElMessage.success(
      result.action === 'replaced'
        ? 'Salary updated successfully. The previous salary was ended automatically.'
        : result.action === 'updated'
          ? 'Salary record updated successfully.'
          : 'Salary record created successfully.',
    )

    closeSalaryModal()
    await refreshPayrollSalaries()
  } catch (err) {
    formSubmitError.value = getPayrollSalarySaveErrorMessage(err)
    ElMessage.error(formSubmitError.value)
  }
}

onMounted(() => {
  void ensureEmployeeOptionsLoaded()
  void loadPayrollSalaries()
})
</script>

<template>
  <main class="payroll-salaries-page">
    <header class="payroll-salaries-page-header">
      <div class="payroll-salaries-page-copy">
        <h1 class="payroll-salaries-page-title">Payroll Salary Setup</h1>
        <p class="payroll-salaries-page-subtitle">
          Manage employee salary records used by payroll generation as the salary source-of-truth.
        </p>
        <p v-if="pageFeedback" class="payroll-salaries-page-feedback">{{ pageFeedback }}</p>
      </div>

      <div class="payroll-salaries-page-actions">
        <BaseButton v-if="canManagePayrollSalaries" @click="openCreateModal">
          <CirclePlus :size="16" />
          Create Salary
        </BaseButton>
        <BaseButton :loading="isPayrollSalariesLoading" variant="ghost" @click="refreshPayrollSalaries">
          <RefreshCw :size="16" />
          Refresh
        </BaseButton>
      </div>
    </header>

    <BaseCard class="payroll-salaries-filters-card">
      <div class="payroll-salaries-section-header">
        <div>
          <h2 class="payroll-salaries-section-title">Filters</h2>
          <p class="payroll-salaries-section-text">
            Narrow salary records by status, employee, effective date, and rows per page.
          </p>
        </div>
      </div>

      <form class="payroll-salaries-filters-grid" @submit.prevent="applyFilters">
        <BaseDropdown
          v-model="filters.status"
          :clearable="false"
          :options="statusOptions"
          label="Status"
        />
        <div class="payroll-salaries-filter-field">
          <BaseSelect
            v-model="employeeFilterModel"
            :loading="isEmployeesLoading"
            :no-data-text="employeeFilterMessage || 'No employees available.'"
            :options="employeeOptions"
            filterable
            label="Employee"
            placeholder="All employees"
          />
          <p
            v-if="employeeFilterMessage"
            class="payroll-salaries-filter-message"
            :class="{
              'payroll-salaries-filter-message-error': Boolean(
                employeesError && !hasEmployeeOptions,
              ),
            }"
          >
            {{ employeeFilterMessage }}
          </p>
        </div>
        <BaseDatePicker
          v-model="filters.effective_date"
          label="Effective Date"
          type="date"
          value-format="YYYY-MM-DD"
        />
        <BaseDropdown
          v-model="filters.per_page"
          :clearable="false"
          :options="perPageOptions"
          label="Rows Per Page"
        />

        <div class="payroll-salaries-filter-actions">
          <BaseButton type="submit">Apply Filters</BaseButton>
          <BaseButton type="button" variant="ghost" @click="resetFilters">Reset</BaseButton>
        </div>
      </form>
    </BaseCard>

    <PayrollSalariesTable
      :can-manage="canManagePayrollSalaries"
      :error="payrollSalariesError"
      :loading="isPayrollSalariesLoading"
      :salaries="payrollSalaries"
      @edit="openEditModal"
      @navigate-by-url="handleNavigateByUrl"
      @retry="refreshPayrollSalaries"
    />

    <PayrollSalaryFormModal
      :known-salaries="payrollSalaries?.data ?? []"
      :mode="salaryFormMode"
      :open="isSalaryModalOpen"
      :salary="activeSalary"
      :submit-error="formSubmitError"
      :submitting="isSavingPayrollSalary"
      @close="closeSalaryModal"
      @save="handleSaveSalary"
    />
  </main>
</template>

<style scoped>
.payroll-salaries-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.payroll-salaries-page-header,
.payroll-salaries-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.payroll-salaries-page-copy {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.payroll-salaries-page-actions,
.payroll-salaries-filter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.payroll-salaries-page-title,
.payroll-salaries-section-title {
  color: hsl(var(--foreground));
}

.payroll-salaries-page-title {
  font-size: 1.9rem;
  font-weight: 700;
  line-height: 1.1;
}

.payroll-salaries-page-subtitle,
.payroll-salaries-section-text {
  color: hsl(var(--muted-foreground));
}

.payroll-salaries-page-feedback {
  color: hsl(var(--destructive));
}

.payroll-salaries-filters-card {
  padding: 1.5rem;
}

.payroll-salaries-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.payroll-salaries-filter-field {
  display: flex;
  flex-direction: column;
}

.payroll-salaries-filter-message {
  margin-top: 0.375rem;
  font-size: var(--text-xs);
  color: hsl(var(--muted-foreground));
}

.payroll-salaries-filter-message-error {
  color: hsl(var(--destructive));
}

@media (max-width: 768px) {
  .payroll-salaries-page-header,
  .payroll-salaries-section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .payroll-salaries-page-actions,
  .payroll-salaries-filter-actions {
    align-items: stretch;
  }
}
</style>
