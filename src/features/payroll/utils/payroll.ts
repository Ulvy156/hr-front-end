import axios from 'axios'

import type {
  PayrollOwnPayslip,
  PayrollOwnPayslipFiltersState,
  PayrollSalary,
  PayrollSalaryFilterStatus,
  PayrollSalaryFiltersState,
  PayrollRun,
  PayrollRunFiltersState,
  PayrollRunStatus,
} from '../interface/payroll.interface'
import { PAYROLL_RUN_STATUS, PAYROLL_SALARY_STATUS } from '../interface/payroll.interface'

type PayrollRequestErrorPayload = {
  message?: string
  errors?:
    | Record<string, string[]>
    | Array<{
        employee_id?: number
        employee_code?: string
        employee_name?: string
        reason?: string
      }>
}

export const createDefaultPayrollRunFilters = (): PayrollRunFiltersState => ({
  month: '',
  status: '',
  per_page: 10,
})

export const createDefaultPayrollSalaryFilters = (): PayrollSalaryFiltersState => ({
  status: PAYROLL_SALARY_STATUS.CURRENT,
  employee_id: null,
  effective_date: '',
  per_page: 10,
})

export const createDefaultPayrollOwnPayslipFilters = (): PayrollOwnPayslipFiltersState => ({
  month: '',
  status: '',
  per_page: 10,
})

const PAYROLL_SALARY_OVERLAP_ERROR_MESSAGE =
  'The salary period overlaps an existing salary record for this employee.'

export const getCurrentPayrollMonth = () => {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')

  return `${today.getFullYear()}-${month}`
}

export const formatPayrollStatusLabel = (status: PayrollRunStatus | string | null | undefined) => {
  if (!status) {
    return '--'
  }

  if (status === PAYROLL_RUN_STATUS.DRAFT) {
    return 'Draft'
  }

  if (status === PAYROLL_RUN_STATUS.APPROVED) {
    return 'Approved'
  }

  if (status === PAYROLL_RUN_STATUS.PAID) {
    return 'Paid'
  }

  if (status === PAYROLL_RUN_STATUS.CANCELLED) {
    return 'Cancelled'
  }

  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const getPayrollStatusVariant = (status: PayrollRunStatus | string | null | undefined) => {
  if (status === PAYROLL_RUN_STATUS.PAID) {
    return 'success'
  }

  if (status === PAYROLL_RUN_STATUS.APPROVED) {
    return 'primary'
  }

  if (status === PAYROLL_RUN_STATUS.DRAFT) {
    return 'warning'
  }

  if (status === PAYROLL_RUN_STATUS.CANCELLED) {
    return 'danger'
  }

  return 'default'
}

export const formatPayrollMonthLabel = (value: string | null | undefined) => {
  if (!value) {
    return '--'
  }

  const parsedDate = new Date(`${value.slice(0, 10)}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(parsedDate)
}

export const formatPayrollDateTime = (value: string | null | undefined) => {
  if (!value) {
    return '--'
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return parsedDate.toLocaleString()
}

export const formatPayrollDate = (value: string | null | undefined) => {
  if (!value) {
    return '--'
  }

  const parsedDate = new Date(`${value.slice(0, 10)}T00:00:00`)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  return parsedDate.toLocaleDateString()
}

export const shiftPayrollDateByDays = (value: string, days: number) => {
  const parsedDate = new Date(`${value}T00:00:00Z`)

  if (Number.isNaN(parsedDate.getTime())) {
    return value
  }

  parsedDate.setUTCDate(parsedDate.getUTCDate() + days)

  return parsedDate.toISOString().slice(0, 10)
}

export const getPayrollMonthDateRange = (value: string) => {
  const [yearString, monthString] = value.split('-')
  const year = Number(yearString)
  const month = Number(monthString)

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return null
  }

  const start = new Date(Date.UTC(year, month - 1, 1))
  const end = new Date(Date.UTC(year, month, 0))

  return {
    startOfMonth: start.toISOString().slice(0, 10),
    endOfMonth: end.toISOString().slice(0, 10),
  }
}

export const isPayrollSalaryValidForMonth = (
  salary: Pick<PayrollSalary, 'effective_date' | 'end_date'>,
  month: string,
) => {
  const range = getPayrollMonthDateRange(month)

  if (!range || !salary.effective_date) {
    return false
  }

  return (
    salary.effective_date <= range.endOfMonth &&
    (!salary.end_date || salary.end_date >= range.startOfMonth)
  )
}

export const formatPayrollAmount = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === '') {
    return '--'
  }

  const numericValue =
    typeof value === 'number'
      ? value
      : Number.parseFloat(typeof value === 'string' ? value : String(value))

  if (Number.isNaN(numericValue)) {
    return String(value)
  }

  return numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

export const formatPayrollInteger = (value: number | null | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--'
  }

  return value.toLocaleString('en-US')
}

export const canApprovePayrollRun = (run: PayrollRun) => {
  return run.status === PAYROLL_RUN_STATUS.DRAFT
}

export const canMarkPayrollRunPaid = (run: PayrollRun) => {
  return run.status === PAYROLL_RUN_STATUS.APPROVED
}

export const canCancelPayrollRun = (run: PayrollRun) => {
  return (
    run.status === PAYROLL_RUN_STATUS.DRAFT || run.status === PAYROLL_RUN_STATUS.APPROVED
  )
}

export const canRegeneratePayrollRun = (run: PayrollRun) => {
  return run.status === PAYROLL_RUN_STATUS.DRAFT
}

export const buildPayrollSalaryListParams = (filters: PayrollSalaryFiltersState) => ({
  status: filters.status,
  employee_id:
    typeof filters.employee_id === 'number' && Number.isFinite(filters.employee_id)
      ? filters.employee_id
      : undefined,
  effective_date: filters.effective_date || undefined,
  per_page: filters.per_page,
})

const resolvePayrollSalaryStatus = (
  salary: PayrollSalary,
): Exclude<PayrollSalaryFilterStatus, 'all'> => {
  if (salary.status === PAYROLL_SALARY_STATUS.CURRENT || salary.status === PAYROLL_SALARY_STATUS.ENDED) {
    return salary.status
  }

  return salary.end_date ? PAYROLL_SALARY_STATUS.ENDED : PAYROLL_SALARY_STATUS.CURRENT
}

export const getPayrollSalaryStatusVariant = (salary: PayrollSalary) => {
  if (resolvePayrollSalaryStatus(salary) === PAYROLL_SALARY_STATUS.CURRENT) {
    return 'success'
  }

  return 'default'
}

export const getPayrollSalaryStatusLabel = (salary: PayrollSalary) => {
  if (resolvePayrollSalaryStatus(salary) === PAYROLL_SALARY_STATUS.CURRENT) {
    return 'Current'
  }

  return 'Ended'
}

export const formatPayrollSalarySourceLabel = (value: string | null | undefined) => {
  if (!value) {
    return '--'
  }

  if (value === 'employee_salaries') {
    return 'Employee Salary'
  }

  if (value === 'employee_positions_fallback') {
    return 'Position Fallback'
  }

  if (value === 'missing') {
    return 'Missing'
  }

  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const getPayrollSalarySourceVariant = (value: string | null | undefined) => {
  if (value === 'employee_salaries') {
    return 'success'
  }

  if (value === 'employee_positions_fallback') {
    return 'warning'
  }

  if (value === 'missing') {
    return 'danger'
  }

  return 'default'
}

export const getPayslipPageSummary = (
  payslips:
    | {
        meta?: {
          from: number | null
          to: number | null
          total: number
          current_page: number
          last_page: number
        }
      }
    | null
    | undefined,
) => {
  if (!payslips?.meta) {
    return 'No payslips loaded.'
  }

  const { from, to, total, current_page, last_page } = payslips.meta

  return `Showing ${from ?? 0}-${to ?? 0} of ${total} payslips | Page ${current_page} of ${last_page}`
}

export const getPayslipSummaryCards = (payslip: PayrollOwnPayslip | null | undefined) => {
  if (!payslip) {
    return []
  }

  return [
    {
      key: 'base',
      label: 'Base Salary',
      value: formatPayrollAmount(payslip.base_salary),
    },
    {
      key: 'prorated',
      label: 'Prorated Base',
      value: formatPayrollAmount(payslip.prorated_base_salary),
    },
    {
      key: 'overtime',
      label: 'Overtime Pay',
      value: formatPayrollAmount(payslip.overtime_pay),
    },
    {
      key: 'deduction',
      label: 'Unpaid Leave Deduction',
      value: formatPayrollAmount(payslip.unpaid_leave_deduction),
    },
    {
      key: 'net',
      label: 'Net Salary',
      value: formatPayrollAmount(payslip.net_salary),
    },
  ]
}

export const getPayrollRequestErrorMessage = (
  error: unknown,
  fallback = 'Payroll request failed. Please try again.',
) => {
  if (axios.isAxiosError<PayrollRequestErrorPayload>(error)) {
    const payload = error.response?.data

    if (Array.isArray(payload?.errors) && payload.errors.length > 0) {
      const firstItem = payload.errors[0]

      if (typeof firstItem?.reason === 'string' && firstItem.reason.trim()) {
        return `${payload?.message ?? fallback} ${firstItem.reason}`.trim()
      }
    }

    if (payload?.errors && !Array.isArray(payload.errors) && typeof payload.errors === 'object') {
      const firstValidationMessage = Object.values(payload.errors)
        .flat()
        .find((message): message is string => typeof message === 'string' && message.trim() !== '')

      if (firstValidationMessage) {
        return firstValidationMessage
      }
    }

    if (typeof payload?.message === 'string' && payload.message.trim()) {
      return payload.message
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export const getPayrollSalarySaveErrorMessage = (
  error: unknown,
  fallback = 'Unable to save the salary record. Please try again.',
) => {
  const message = getPayrollRequestErrorMessage(error, fallback)

  if (message.includes(PAYROLL_SALARY_OVERLAP_ERROR_MESSAGE)) {
    return 'The employee already has an active salary for that period. Review the effective dates and try again.'
  }

  return message
}
