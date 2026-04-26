<script setup lang="ts">
import { storeToRefs } from 'pinia'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSelect, { type BaseSelectOption } from '@/components/ui/BaseSelect.vue'
import { number, object, string, useForm } from '@/plugins/vee-validate'
import { useEmployeeStore } from '@/features/employees/store/employeeStore'

import type {
  PayrollSalary,
  PayrollSalaryFormSubmitPayload,
} from '../interface/payroll.interface'
import { payrollService } from '../services/payrollService'
import {
  formatPayrollAmount,
  formatPayrollDate,
  getPayrollSalaryStatusLabel,
  shiftPayrollDateByDays,
} from '../utils/payroll'

type SalaryFormValues = {
  employee_id: number | null
  amount: number | null
  effective_date: string
}

const props = withDefaults(
  defineProps<{
    open: boolean
    mode: 'create' | 'edit'
    salary?: PayrollSalary | null
    knownSalaries?: PayrollSalary[]
    submitting?: boolean
    submitError?: string
  }>(),
  {
    salary: null,
    knownSalaries: () => [],
    submitting: false,
    submitError: '',
  },
)

const emit = defineEmits<{
  close: []
  save: [payload: PayrollSalaryFormSubmitPayload]
}>()

const employeeStore = useEmployeeStore()
const {
  employees,
  isLoading: isEmployeesLoading,
  error: employeesError,
} = storeToRefs(employeeStore)

const hasLoadedEmployeeOptions = ref(false)
const employeeSalaryHistory = ref<PayrollSalary[]>([])
const isEmployeeSalaryHistoryLoading = ref(false)
const employeeSalaryHistoryError = ref('')
const localSubmitError = ref('')
const employeeSalaryHistoryCache = new Map<number, PayrollSalary[]>()

const currentSalaryRecord = computed(
  () => employeeSalaryHistory.value.find((salary) => salary.is_current) ?? null,
)

const validationSchema = computed(() =>
  object({
    employee_id:
      props.mode === 'create'
        ? number()
            .typeError('Employee is required.')
            .required('Employee is required.')
            .integer('Employee is required.')
            .positive('Employee is required.')
        : number().nullable(),
    amount: number()
      .typeError('Amount is required.')
      .required('Amount is required.')
      .moreThan(0, 'Amount must be greater than 0.'),
    effective_date: string()
      .required('Effective date is required.')
      .test(
        'effective-date-after-current-salary',
        'New effective date must be after the current salary effective date.',
        (value) => {
          if (!value || props.mode !== 'create' || !currentSalaryRecord.value?.effective_date) {
            return true
          }

          return value > currentSalaryRecord.value.effective_date
        },
      ),
  }),
)

const { errors, handleSubmit, resetForm, setValues, values, setFieldValue } = useForm<SalaryFormValues>({
  validationSchema,
  initialValues: {
    employee_id: null,
    amount: null,
    effective_date: '',
  },
})

const selectedEmployeeId = computed(() =>
  props.mode === 'create' ? values.employee_id : props.salary?.employee_id ?? null,
)

const isSalaryChangeFlow = computed(() => props.mode === 'create' && Boolean(currentSalaryRecord.value))

const modalTitle = computed(() => {
  if (props.mode === 'edit') {
    return 'Update Salary'
  }

  return isSalaryChangeFlow.value ? 'Update Salary' : 'Create Salary'
})

const modalEyebrow = computed(() => {
  if (props.mode === 'edit') {
    return 'Edit Salary'
  }

  return isSalaryChangeFlow.value ? 'Salary Update' : 'New Salary'
})

const modalDescription = computed(() => {
  if (props.mode === 'edit') {
    return 'Update the salary amount or effective date for the selected salary record.'
  }

  if (isSalaryChangeFlow.value) {
    return 'This employee already has a current salary record. Review the current salary and choose the next effective date.'
  }

  return 'Create a salary record used as payroll source-of-truth for the selected employee.'
})

const submitLabel = computed(() => {
  if (props.mode === 'edit') {
    return 'Save Changes'
  }

  return isSalaryChangeFlow.value ? 'Update Salary' : 'Create Salary'
})

const footerText = computed(() => {
  if (props.mode === 'edit') {
    return 'Save the updated salary details when ready.'
  }

  if (isSalaryChangeFlow.value) {
    return 'Previous salary will be ended automatically by the system.'
  }

  return 'The system will automatically handle salary replacement when needed.'
})

const employeeOptions = computed<BaseSelectOption[]>(() =>
  (employees.value?.data ?? []).map((employee) => ({
    label: employee.employee_code
      ? `${employee.full_name} (${employee.employee_code})`
      : employee.full_name,
    value: employee.id,
  })),
)

const hasEmployeeOptions = computed(() => employeeOptions.value.length > 0)

const employeeFieldMessage = computed(() => {
  if (props.mode !== 'create') {
    return ''
  }

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

const currentSalaryHelperText = computed(() => {
  if (!currentSalaryRecord.value) {
    return ''
  }

  return 'The system will automatically handle salary replacement.'
})

const automaticPreviousSalaryEndDate = computed(() => {
  if (!currentSalaryRecord.value || props.mode !== 'create' || !values.effective_date) {
    return ''
  }

  return shiftPayrollDateByDays(values.effective_date, -1)
})

const currentSalaryContextMessage = computed(() => {
  if (props.mode !== 'create' || !selectedEmployeeId.value) {
    return ''
  }

  if (isEmployeeSalaryHistoryLoading.value) {
    return 'Checking current salary...'
  }

  if (employeeSalaryHistoryError.value) {
    return employeeSalaryHistoryError.value
  }

  return ''
})

const displaySubmitError = computed(() => localSubmitError.value || props.submitError)

const employeeSelectModel = computed({
  get: () => values.employee_id ?? undefined,
  set: (value: string | number | undefined) => {
    if (value === undefined || value === null || value === '') {
      setFieldValue('employee_id', null)
      return
    }

    const parsedValue = Number(value)
    setFieldValue('employee_id', Number.isFinite(parsedValue) ? parsedValue : null)
  },
})

const amountModel = computed({
  get: () => (values.amount == null ? '' : String(values.amount)),
  set: (value: string) => {
    if (!value.trim()) {
      setFieldValue('amount', null)
      return
    }

    const parsedValue = Number(value)
    setFieldValue('amount', Number.isFinite(parsedValue) ? parsedValue : null)
  },
})

const effectiveDateModel = computed({
  get: () => values.effective_date || '',
  set: (value: string | number | Date | null | undefined) => {
    localSubmitError.value = ''
    setFieldValue('effective_date', typeof value === 'string' ? value : '')
  },
})

const isSubmitDisabled = computed(() => {
  if (props.submitting) {
    return true
  }

  if (props.mode !== 'create') {
    return false
  }

  return isEmployeesLoading.value || !hasEmployeeOptions.value
})

const getKnownSalaryHistory = (employeeId: number) => {
  return props.knownSalaries.filter((salary) => salary.employee_id === employeeId)
}

const loadEmployeeOptions = async () => {
  if (props.mode !== 'create' || hasLoadedEmployeeOptions.value || isEmployeesLoading.value) {
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

const resolveEmployeeSalaryHistory = async (employeeId: number) => {
  employeeSalaryHistoryError.value = ''
  localSubmitError.value = ''

  const knownSalaryHistory = getKnownSalaryHistory(employeeId)

  if (knownSalaryHistory.some((salary) => salary.is_current)) {
    employeeSalaryHistory.value = knownSalaryHistory
    employeeSalaryHistoryCache.set(employeeId, knownSalaryHistory)
    return
  }

  const cachedSalaryHistory = employeeSalaryHistoryCache.get(employeeId)

  if (cachedSalaryHistory) {
    employeeSalaryHistory.value = cachedSalaryHistory
    return
  }

  isEmployeeSalaryHistoryLoading.value = true

  try {
    const response = await payrollService.getPayrollSalaries({
      employee_id: employeeId,
      per_page: 100,
    })
    employeeSalaryHistory.value = response.data
    employeeSalaryHistoryCache.set(employeeId, response.data)
  } catch (error) {
    employeeSalaryHistory.value = knownSalaryHistory
    employeeSalaryHistoryError.value =
      error instanceof Error ? error.message : 'Failed to load salary history.'
  } finally {
    isEmployeeSalaryHistoryLoading.value = false
  }
}

const syncForm = () => {
  setValues({
    employee_id: props.mode === 'create' ? null : props.salary?.employee_id ?? null,
    amount: props.salary?.amount ? Number(props.salary.amount) : null,
    effective_date: props.salary?.effective_date ?? '',
  })
}

const handleClose = () => {
  localSubmitError.value = ''
  emit('close')
}

const onSubmit = handleSubmit((formValues) => {
  localSubmitError.value = ''

  if (props.mode === 'create') {
    emit('save', {
      payload: {
        employee_id: formValues.employee_id as number,
        amount: formValues.amount as number,
        effective_date: formValues.effective_date,
      },
      currentSalary: currentSalaryRecord.value,
    })

    return
  }

  emit('save', {
    payload: {
      amount: formValues.amount as number,
      effective_date: formValues.effective_date,
    },
    currentSalary: null,
  })
})

watch(
  selectedEmployeeId,
  (employeeId) => {
    if (props.mode !== 'create' || !props.open || !employeeId) {
      employeeSalaryHistory.value = []
      employeeSalaryHistoryError.value = ''
      localSubmitError.value = ''
      return
    }

    void resolveEmployeeSalaryHistory(employeeId)
  },
  { immediate: true },
)

watch(
  () => [props.open, props.mode, props.salary],
  () => {
    if (!props.open) {
      resetForm()
      employeeSalaryHistory.value = []
      employeeSalaryHistoryError.value = ''
      localSubmitError.value = ''
      return
    }

    syncForm()

    if (props.mode === 'create') {
      void loadEmployeeOptions()
    }
  },
  { immediate: true },
)
</script>

<template>
  <BaseModal
    :model-value="open"
    width="44rem"
    @close="handleClose"
    @update:model-value="(value) => !value && handleClose()"
  >
    <template #header>
      <div class="payroll-salary-form-header">
        <p class="payroll-salary-form-eyebrow">{{ modalEyebrow }}</p>
        <h2 class="payroll-salary-form-title">{{ modalTitle }}</h2>
        <p class="payroll-salary-form-description">{{ modalDescription }}</p>
      </div>
    </template>

    <form class="payroll-salary-form-layout" @submit.prevent="onSubmit">
      <section class="payroll-salary-form-section">
        <div class="payroll-salary-form-section-header">
          <div>
            <h3 class="payroll-salary-form-section-title">Salary Details</h3>
            <p class="payroll-salary-form-section-text">
              Enter the amount and effective date used by payroll.
            </p>
          </div>
        </div>

        <div class="payroll-salary-form-grid">
          <div v-if="mode === 'create'" class="payroll-salary-form-select-field">
            <BaseSelect
              v-model="employeeSelectModel"
              :disabled="submitting || (isEmployeesLoading && !hasEmployeeOptions)"
              :error="errors.employee_id"
              :loading="isEmployeesLoading"
              :no-data-text="employeeFieldMessage || 'No employees available.'"
              :options="employeeOptions"
              filterable
              label="Employee"
              placeholder="Select employee"
              required
            />
            <p
              v-if="employeeFieldMessage && !errors.employee_id"
              class="payroll-salary-form-select-message"
              :class="{
                'payroll-salary-form-select-message-error': Boolean(
                  employeesError && !hasEmployeeOptions,
                ),
              }"
            >
              {{ employeeFieldMessage }}
            </p>
          </div>

          <div
            v-if="mode === 'create' && currentSalaryRecord"
            class="payroll-salary-form-summary-item payroll-salary-form-summary-item-wide"
          >
            <p class="payroll-salary-form-summary-label">Current Salary</p>
            <p class="payroll-salary-form-summary-value">
              {{ formatPayrollAmount(currentSalaryRecord.amount) }}
            </p>
            <p class="payroll-salary-form-summary-helper">
              Effective Date: {{ formatPayrollDate(currentSalaryRecord.effective_date) }}
            </p>
            <p class="payroll-salary-form-summary-helper">
              Status: {{ getPayrollSalaryStatusLabel(currentSalaryRecord) }}
            </p>
            <p class="payroll-salary-form-summary-helper">
              {{ currentSalaryHelperText }}
            </p>
            <p
              v-if="automaticPreviousSalaryEndDate"
              class="payroll-salary-form-summary-helper payroll-salary-form-summary-helper-strong"
            >
              Previous salary will end automatically on
              {{ formatPayrollDate(automaticPreviousSalaryEndDate) }}.
            </p>
          </div>

          <div v-else class="payroll-salary-form-summary-item payroll-salary-form-summary-item-wide">
            <p class="payroll-salary-form-summary-label">Employee</p>
            <p class="payroll-salary-form-summary-value">
              {{ salary?.employee?.full_name || '--' }}
            </p>
            <p class="payroll-salary-form-summary-helper">
              Employee ID: {{ salary?.employee_id ?? '--' }} | Code: {{ salary?.employee?.employee_code || '--' }}
            </p>
          </div>

          <BaseInput
            v-model="amountModel"
            :disabled="submitting"
            :error="errors.amount"
            label="Amount"
            placeholder="Salary amount"
            required
            size="large"
            type="number"
          />

          <div class="payroll-salary-form-date-field">
            <BaseDatePicker
              v-model="effectiveDateModel"
              :disabled="submitting"
              label="Effective Date"
              required
              type="date"
              value-format="YYYY-MM-DD"
            />
            <p v-if="errors.effective_date" class="payroll-salary-form-error">
              {{ errors.effective_date }}
            </p>
            <p
              v-else-if="currentSalaryContextMessage"
              class="payroll-salary-form-select-message"
              :class="{
                'payroll-salary-form-select-message-error': Boolean(employeeSalaryHistoryError),
              }"
            >
              {{ currentSalaryContextMessage }}
            </p>
          </div>

        </div>
      </section>

      <p v-if="displaySubmitError" class="payroll-salary-form-submit-error">
        {{ displaySubmitError }}
      </p>
    </form>

    <template #footer>
      <div class="payroll-salary-form-footer">
        <div class="payroll-salary-form-footer-copy">
          <p class="payroll-salary-form-footer-title">
            {{ mode === 'create'
              ? (isSalaryChangeFlow
                ? 'Review the current salary before changing it.'
                : 'Create the salary record when ready.')
              : 'Save the salary changes when ready.' }}
          </p>
          <p class="payroll-salary-form-footer-text">
            {{ footerText }}
          </p>
        </div>

        <div class="payroll-salary-form-footer-actions">
          <BaseButton variant="ghost" @click="handleClose">Cancel</BaseButton>
          <BaseButton :disabled="isSubmitDisabled" :loading="submitting" @click="onSubmit">
            {{ submitLabel }}
          </BaseButton>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.payroll-salary-form-header,
.payroll-salary-form-layout,
.payroll-salary-form-section-header,
.payroll-salary-form-footer-copy {
  display: flex;
  flex-direction: column;
}

.payroll-salary-form-header,
.payroll-salary-form-section-header,
.payroll-salary-form-footer-copy {
  gap: 0.35rem;
}

.payroll-salary-form-layout {
  gap: 1rem;
}

.payroll-salary-form-eyebrow,
.payroll-salary-form-description,
.payroll-salary-form-section-text,
.payroll-salary-form-summary-label,
.payroll-salary-form-summary-helper,
.payroll-salary-form-footer-text {
  color: hsl(var(--muted-foreground));
}

.payroll-salary-form-eyebrow,
.payroll-salary-form-summary-label {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.payroll-salary-form-title,
.payroll-salary-form-section-title,
.payroll-salary-form-summary-value,
.payroll-salary-form-footer-title {
  color: hsl(var(--foreground));
}

.payroll-salary-form-title {
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.2;
}

.payroll-salary-form-description {
  max-width: 38rem;
  font-size: var(--text-sm);
  line-height: 1.55;
}

.payroll-salary-form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 1rem;
  background: hsl(var(--secondary) / 0.18);
}

.payroll-salary-form-section-title {
  font-size: var(--text-base);
  font-weight: 700;
  line-height: 1.35;
}

.payroll-salary-form-section-text {
  font-size: var(--text-sm);
  line-height: 1.55;
}

.payroll-salary-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 1.25rem;
}

.payroll-salary-form-date-field {
  display: flex;
  flex-direction: column;
}

.payroll-salary-form-select-field {
  display: flex;
  flex-direction: column;
}

.payroll-salary-form-error,
.payroll-salary-form-select-message,
.payroll-salary-form-submit-error {
  margin-top: 0.375rem;
  font-size: var(--text-xs);
}

.payroll-salary-form-error,
.payroll-salary-form-submit-error,
.payroll-salary-form-select-message-error {
  color: hsl(var(--destructive));
}

.payroll-salary-form-select-message {
  color: hsl(var(--muted-foreground));
}

.payroll-salary-form-submit-error {
  margin-top: 0;
}

.payroll-salary-form-summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
}

.payroll-salary-form-summary-item-wide {
  grid-column: span 2;
}

.payroll-salary-form-summary-value {
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: 1.45;
}

.payroll-salary-form-summary-helper-strong {
  color: hsl(var(--foreground));
  font-weight: 600;
}

.payroll-salary-form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.payroll-salary-form-footer-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .payroll-salary-form-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .payroll-salary-form-summary-item-wide {
    grid-column: span 1;
  }

  .payroll-salary-form-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .payroll-salary-form-footer-actions {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
}
</style>
