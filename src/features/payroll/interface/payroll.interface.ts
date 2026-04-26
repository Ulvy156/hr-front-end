export const PAYROLL_RUN_STATUS = {
  DRAFT: 'draft',
  APPROVED: 'approved',
  PAID: 'paid',
  CANCELLED: 'cancelled',
} as const

export type PayrollRunStatus = (typeof PAYROLL_RUN_STATUS)[keyof typeof PAYROLL_RUN_STATUS]

export const PAYROLL_SALARY_SOURCE = {
  EMPLOYEE_SALARIES: 'employee_salaries',
  EMPLOYEE_POSITIONS_FALLBACK: 'employee_positions_fallback',
  MISSING: 'missing',
} as const

export type PayrollSalarySource =
  (typeof PAYROLL_SALARY_SOURCE)[keyof typeof PAYROLL_SALARY_SOURCE]

export const PAYROLL_SALARY_STATUS = {
  CURRENT: 'current',
  ENDED: 'ended',
  ALL: 'all',
} as const

export type PayrollSalaryStatus =
  Exclude<(typeof PAYROLL_SALARY_STATUS)[keyof typeof PAYROLL_SALARY_STATUS], 'all'>

export type PayrollSalaryFilterStatus =
  (typeof PAYROLL_SALARY_STATUS)[keyof typeof PAYROLL_SALARY_STATUS]

export interface PayrollPaginationLink {
  url: string | null
  label: string
  active: boolean
}

export interface PayrollPaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  links: PayrollPaginationLink[]
  path: string
  per_page: number
  to: number | null
  total: number
}

export interface PayrollPaginatedResponse<T> {
  data: T[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: PayrollPaginationMeta
}

export interface PayrollSalaryEmployee {
  id: number
  employee_code: string | null
  full_name: string
}

export interface PayrollSalary {
  id: number
  employee_id: number
  employee?: PayrollSalaryEmployee
  amount: string
  status?: PayrollSalaryStatus | null
  effective_date: string | null
  end_date: string | null
  is_current: boolean
  created_at: string | null
  updated_at: string | null
}

export type PayrollSalaryListResponse = PayrollPaginatedResponse<PayrollSalary>

export interface PayrollSalaryListParams {
  status?: PayrollSalaryFilterStatus
  employee_id?: number
  effective_date?: string
  per_page?: number
  page?: number
}

export interface PayrollSalaryFiltersState {
  status: PayrollSalaryFilterStatus
  employee_id: number | null
  effective_date: string
  per_page: number
}

export interface PayrollSalaryCreatePayload {
  employee_id: number
  amount: number
  effective_date: string
}

export interface PayrollSalaryUpdatePayload {
  amount?: number
  effective_date?: string
  end_date?: string | null
}

export interface PayrollSalarySaveParams {
  mode: 'create' | 'edit'
  payload: PayrollSalaryCreatePayload | PayrollSalaryUpdatePayload
  currentSalary?: PayrollSalary | null
  salaryId?: number | null
}

export interface PayrollSalarySaveResult {
  action: 'created' | 'updated' | 'replaced'
  salary: PayrollSalary
}

export interface PayrollSalaryFormSubmitPayload {
  payload: PayrollSalaryCreatePayload | PayrollSalaryUpdatePayload
  currentSalary: PayrollSalary | null
}

export interface PayrollRunItem {
  id: number
  employee_id: number
  employee_code: string | null
  employee_name: string
  salary_source: PayrollSalarySource
  base_salary: string
  prorated_base_salary: string
  hourly_rate: string
  daily_rate: string
  eligible_working_days: number
  company_working_days: number
  monthly_working_hours: number
  overtime_normal_hours: string
  overtime_weekend_hours: string
  overtime_holiday_hours: string
  overtime_pay: string
  unpaid_leave_units: string
  unpaid_leave_deduction: string
  raw_net_salary: string
  net_salary: string
  created_at: string | null
  updated_at: string | null
}

export interface PayrollRun {
  id: number
  payroll_month: string | null
  status: PayrollRunStatus
  company_working_days: number
  monthly_working_hours: number
  employee_count: number
  total_base_salary: string
  total_prorated_base_salary: string
  total_overtime_pay: string
  total_unpaid_leave_deduction: string
  total_net_salary: string
  created_at: string | null
  updated_at: string | null
}

export interface PayrollRunDetail extends PayrollRun {
  items: PayrollRunItem[]
}

export type PayrollRunListResponse = PayrollPaginatedResponse<PayrollRun>

export interface PayrollRunListParams {
  month?: string
  status?: PayrollRunStatus
  per_page?: number
}

export interface PayrollRunFiltersState {
  month: string
  status: '' | PayrollRunStatus
  per_page: number
}

export interface PayrollRunGeneratePayload {
  month: string
}

export interface PayrollMissingSalaryEmployee {
  id: number
  full_name: string
  employee_code: string | null
}

export interface PayrollGeneratePrecheckResult {
  status: 'generated' | 'missing-salary' | 'no-employees'
  month: string
  missingEmployees: PayrollMissingSalaryEmployee[]
  run?: PayrollRun
}

export interface PayrollOwnPayslip {
  id: number
  payroll_run_id: number
  payroll_month: string | null
  payroll_status: PayrollRunStatus | null
  salary_source: PayrollSalarySource
  base_salary: string
  prorated_base_salary: string
  hourly_rate: string
  daily_rate: string
  eligible_working_days: number
  company_working_days: number
  monthly_working_hours: number
  overtime_normal_hours: string
  overtime_weekend_hours: string
  overtime_holiday_hours: string
  overtime_pay: string
  unpaid_leave_units: string
  unpaid_leave_deduction: string
  raw_net_salary: string
  net_salary: string
  created_at: string | null
  updated_at: string | null
}

export type PayrollOwnPayslipListResponse = PayrollPaginatedResponse<PayrollOwnPayslip>

export interface PayrollOwnPayslipListParams {
  month?: string
  status?: PayrollRunStatus
  per_page?: number
}

export interface PayrollOwnPayslipFiltersState {
  month: string
  status: '' | PayrollRunStatus
  per_page: number
}

export interface PayrollExcelExportResponse {
  blob: Blob
  filename: string
}
