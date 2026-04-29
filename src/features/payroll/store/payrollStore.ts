import { ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'
import type { EmployeeListItem, EmployeeListParams } from '@/features/employees/interface/employee.interface'
import { employeeService } from '@/features/employees/services/employeeService'
import { useEmployeeStore } from '@/features/employees/store/employeeStore'

import type {
  PayrollOwnPayslip,
  PayrollOwnPayslipListParams,
  PayrollOwnPayslipListResponse,
  PayrollGeneratePrecheckResult,
  PayrollMissingSalaryEmployee,
  PayrollSalary,
  PayrollSalaryCreatePayload,
  PayrollSalaryFiltersState,
  PayrollSalaryListParams,
  PayrollSalaryListResponse,
  PayrollSalarySaveParams,
  PayrollSalarySaveResult,
  PayrollSalaryUpdatePayload,
  PayrollRun,
  PayrollRunDetail,
  PayrollRunGeneratePayload,
  PayrollRunListParams,
  PayrollRunListResponse,
} from '../interface/payroll.interface'
import { payrollService } from '../services/payrollService'
import {
  buildPayrollSalaryListParams,
  getPayrollRequestErrorMessage,
  getPayrollMonthDateRange,
  getPayrollSalarySaveErrorMessage,
  isPayrollSalaryValidForMonth,
  shiftPayrollDateByDays,
} from '../utils/payroll'

type PayrollRunMutationKind = 'approve' | 'cancel' | 'mark-paid' | 'regenerate' | null

export const usePayrollStore = defineStore('payroll', () => {
  const payrollOwnPayslips = ref<PayrollOwnPayslipListResponse | null>(null)
  const payrollSalaries = ref<PayrollSalaryListResponse | null>(null)
  const payrollRuns = ref<PayrollRunListResponse | null>(null)
  const payrollRunDetail = shallowRef<PayrollRunDetail | null>(null)
  const payrollOwnPayslipDetail = shallowRef<PayrollOwnPayslip | null>(null)
  const isPayrollOwnPayslipsLoading = ref(false)
  const isPayrollSalariesLoading = ref(false)
  const isPayrollRunsLoading = ref(false)
  const isPayrollRunDetailLoading = ref(false)
  const isPayrollOwnPayslipDetailLoading = ref(false)
  const isSavingPayrollSalary = ref(false)
  const isGeneratingPayrollRun = ref(false)
  const isCheckingPayrollGeneration = ref(false)
  const isMutatingPayrollRun = ref(false)
  const mutatingPayrollRunId = ref<number | null>(null)
  const payrollRunMutationKind = ref<PayrollRunMutationKind>(null)
  const payrollOwnPayslipsError = ref('')
  const payrollSalariesError = ref('')
  const payrollRunsError = ref('')
  const payrollRunDetailError = ref('')
  const payrollOwnPayslipDetailError = ref('')
  const payrollGenerationCheckError = ref('')
  const payrollGenerationMissingEmployees = ref<PayrollMissingSalaryEmployee[]>([])
  const payrollGenerationCheckMonth = ref('')
  const payrollSalaryCoverageCache = ref<PayrollSalary[] | null>(null)
  const payrollGenerationEmployeeCache = ref<EmployeeListItem[] | null>(null)

  const fetchAllEmployeePages = async (params: EmployeeListParams) => {
    const firstPage = await employeeService.getEmployees({
      ...params,
      page: 1,
      per_page: params.per_page ?? 100,
    })

    if (firstPage.meta.last_page <= 1) {
      return firstPage.data
    }

    const remainingPages = Array.from({ length: firstPage.meta.last_page - 1 }, (_, index) =>
      employeeService.getEmployees({
        ...params,
        page: index + 2,
        per_page: params.per_page ?? 100,
      }),
    )

    const remainingResponses = await Promise.all(remainingPages)

    return [firstPage.data, ...remainingResponses.map((response) => response.data)].flat()
  }

  const fetchAllPayrollSalaryPages = async (params: PayrollSalaryListParams) => {
    const firstPage = await payrollService.getPayrollSalaries({
      ...params,
      page: 1,
      per_page: params.per_page ?? 100,
    })

    if (firstPage.meta.last_page <= 1) {
      return firstPage.data
    }

    const remainingPages = Array.from({ length: firstPage.meta.last_page - 1 }, (_, index) =>
      payrollService.getPayrollSalaries({
        ...params,
        page: index + 2,
        per_page: params.per_page ?? 100,
      }),
    )

    const remainingResponses = await Promise.all(remainingPages)

    return [firstPage.data, ...remainingResponses.map((response) => response.data)].flat()
  }

  const resolvePayrollGenerationEmployees = async () => {
    if (payrollGenerationEmployeeCache.value) {
      return payrollGenerationEmployeeCache.value
    }

    const employeeStore = useEmployeeStore()
    const cachedEmployees = employeeStore.employees

    if (
      cachedEmployees?.meta &&
      cachedEmployees.meta.total === cachedEmployees.data.length &&
      cachedEmployees.data.every((employee) => employee.status === 'active')
    ) {
      payrollGenerationEmployeeCache.value = cachedEmployees.data
      return cachedEmployees.data
    }

    const employees = await fetchAllEmployeePages({
      status: 'active',
      per_page: 100,
    })

    payrollGenerationEmployeeCache.value = employees
    return employees
  }

  const resolvePayrollSalaryCoverage = async () => {
    if (payrollSalaryCoverageCache.value) {
      return payrollSalaryCoverageCache.value
    }

    const salaries = await fetchAllPayrollSalaryPages({
      status: 'all',
      per_page: 100,
    })

    payrollSalaryCoverageCache.value = salaries
    return salaries
  }

  const clearPayrollGenerationCheck = () => {
    payrollGenerationCheckError.value = ''
    payrollGenerationMissingEmployees.value = []
    payrollGenerationCheckMonth.value = ''
  }

  const invalidatePayrollSalaryCoverageCache = () => {
    payrollSalaryCoverageCache.value = null
    clearPayrollGenerationCheck()
  }

  const fetchPayrollOwnPayslips = async (params?: PayrollOwnPayslipListParams) => {
    isPayrollOwnPayslipsLoading.value = true
    payrollOwnPayslipsError.value = ''

    try {
      const response = await payrollService.getMyPayslips(params)
      payrollOwnPayslips.value = response

      return response
    } catch (err) {
      payrollOwnPayslips.value = null
      payrollOwnPayslipsError.value = getPayrollRequestErrorMessage(
        err,
        'Unable to load payslips right now.',
      )
      throw err
    } finally {
      isPayrollOwnPayslipsLoading.value = false
    }
  }

  const fetchPayrollOwnPayslipsByUrl = async (url: string) => {
    isPayrollOwnPayslipsLoading.value = true
    payrollOwnPayslipsError.value = ''

    try {
      const response = await payrollService.getMyPayslipsByUrl(url)
      payrollOwnPayslips.value = response

      return response
    } catch (err) {
      payrollOwnPayslips.value = null
      payrollOwnPayslipsError.value = getPayrollRequestErrorMessage(
        err,
        'Unable to load payslips right now.',
      )
      throw err
    } finally {
      isPayrollOwnPayslipsLoading.value = false
    }
  }

  const fetchPayrollOwnPayslipDetail = async (payrollItemId: number) => {
    isPayrollOwnPayslipDetailLoading.value = true
    payrollOwnPayslipDetailError.value = ''

    try {
      const response = await payrollService.getMyPayslip(payrollItemId)
      payrollOwnPayslipDetail.value = response

      return response
    } catch (err) {
      payrollOwnPayslipDetail.value = null
      payrollOwnPayslipDetailError.value = getPayrollRequestErrorMessage(
        err,
        'Unable to load payslip details right now.',
      )
      throw err
    } finally {
      isPayrollOwnPayslipDetailLoading.value = false
    }
  }

  const fetchPayrollSalaries = async (params?: PayrollSalaryListParams) => {
    isPayrollSalariesLoading.value = true
    payrollSalariesError.value = ''

    try {
      const response = await payrollService.getPayrollSalaries(params)
      payrollSalaries.value = response

      return response
    } catch (err) {
      payrollSalaries.value = null
      payrollSalariesError.value = getPayrollRequestErrorMessage(
        err,
        'Failed to load payroll salaries.',
      )
      throw err
    } finally {
      isPayrollSalariesLoading.value = false
    }
  }

  const fetchPayrollSalariesWithFilters = async (filters: PayrollSalaryFiltersState) => {
    return fetchPayrollSalaries(buildPayrollSalaryListParams(filters))
  }

  const fetchPayrollSalariesByUrl = async (url: string) => {
    isPayrollSalariesLoading.value = true
    payrollSalariesError.value = ''

    try {
      const response = await payrollService.getPayrollSalariesByUrl(url)
      payrollSalaries.value = response

      return response
    } catch (err) {
      payrollSalaries.value = null
      payrollSalariesError.value = getPayrollRequestErrorMessage(
        err,
        'Failed to load payroll salaries.',
      )
      throw err
    } finally {
      isPayrollSalariesLoading.value = false
    }
  }

  const fetchPayrollRuns = async (params?: PayrollRunListParams) => {
    isPayrollRunsLoading.value = true
    payrollRunsError.value = ''

    try {
      const response = await payrollService.getPayrollRuns(params)
      payrollRuns.value = response

      return response
    } catch (err) {
      payrollRuns.value = null
      payrollRunsError.value =
        err instanceof Error ? err.message : 'Failed to load payroll runs.'
      throw err
    } finally {
      isPayrollRunsLoading.value = false
    }
  }

  const fetchPayrollRunsByUrl = async (url: string) => {
    isPayrollRunsLoading.value = true
    payrollRunsError.value = ''

    try {
      const response = await payrollService.getPayrollRunsByUrl(url)
      payrollRuns.value = response

      return response
    } catch (err) {
      payrollRuns.value = null
      payrollRunsError.value =
        err instanceof Error ? err.message : 'Failed to load payroll runs.'
      throw err
    } finally {
      isPayrollRunsLoading.value = false
    }
  }

  const fetchPayrollRunDetail = async (payrollRunId: number) => {
    isPayrollRunDetailLoading.value = true
    payrollRunDetailError.value = ''

    try {
      const response = await payrollService.getPayrollRunDetail(payrollRunId)
      payrollRunDetail.value = response

      return response
    } catch (err) {
      payrollRunDetail.value = null
      payrollRunDetailError.value =
        err instanceof Error ? err.message : 'Failed to load payroll run details.'
      throw err
    } finally {
      isPayrollRunDetailLoading.value = false
    }
  }

  const clearPayrollRunDetail = () => {
    payrollRunDetail.value = null
    payrollRunDetailError.value = ''
    isPayrollRunDetailLoading.value = false
  }

  const clearPayrollOwnPayslipDetail = () => {
    payrollOwnPayslipDetail.value = null
    payrollOwnPayslipDetailError.value = ''
    isPayrollOwnPayslipDetailLoading.value = false
  }

  const generatePayrollRun = async (payload: PayrollRunGeneratePayload) => {
    isGeneratingPayrollRun.value = true

    try {
      return await payrollService.generatePayrollRun(payload)
    } finally {
      isGeneratingPayrollRun.value = false
    }
  }

  const checkAndGeneratePayroll = async (month: string): Promise<PayrollGeneratePrecheckResult> => {
    const monthRange = getPayrollMonthDateRange(month)

    if (!monthRange) {
      throw new Error('Select a valid payroll month before generating payroll.')
    }

    isCheckingPayrollGeneration.value = true
    clearPayrollGenerationCheck()
    payrollGenerationCheckMonth.value = month

    try {
      const [employees, salaries] = await Promise.all([
        resolvePayrollGenerationEmployees(),
        resolvePayrollSalaryCoverage(),
      ])

      if (!employees.length) {
        return {
          status: 'no-employees',
          month,
          missingEmployees: [],
        }
      }

      const missingEmployees = employees
        .filter((employee) => {
          return !salaries.some(
            (salary) =>
              salary.employee_id === employee.id &&
              isPayrollSalaryValidForMonth(salary, month),
          )
        })
        .map<PayrollMissingSalaryEmployee>((employee) => ({
          id: employee.id,
          full_name: employee.full_name,
          employee_code: employee.employee_code,
        }))

      payrollGenerationMissingEmployees.value = missingEmployees

      if (missingEmployees.length > 0) {
        return {
          status: 'missing-salary',
          month,
          missingEmployees,
        }
      }

      const run = await generatePayrollRun({ month })

      return {
        status: 'generated',
        month,
        missingEmployees: [],
        run,
      }
    } catch (error) {
      payrollGenerationCheckError.value = getPayrollRequestErrorMessage(
        error,
        'Unable to check salary coverage before generating payroll.',
      )
      throw new Error(payrollGenerationCheckError.value)
    } finally {
      isCheckingPayrollGeneration.value = false
    }
  }

  const runPayrollSalaryMutation = async <T>(callback: () => Promise<T>) => {
    isSavingPayrollSalary.value = true

    try {
      return await callback()
    } finally {
      isSavingPayrollSalary.value = false
    }
  }

  const createPayrollSalary = async (payload: PayrollSalaryCreatePayload) => {
    return runPayrollSalaryMutation(async () => {
      const response = await payrollService.createPayrollSalary(payload)
      invalidatePayrollSalaryCoverageCache()
      return response
    })
  }

  const updatePayrollSalary = async (
    employeeSalaryId: number,
    payload: PayrollSalaryUpdatePayload,
  ) => {
    return runPayrollSalaryMutation(async () => {
      const response = await payrollService.updatePayrollSalary(employeeSalaryId, payload)
      invalidatePayrollSalaryCoverageCache()
      return response
    })
  }

  const savePayrollSalary = async ({
    mode,
    payload,
    currentSalary,
    salaryId,
  }: PayrollSalarySaveParams): Promise<PayrollSalarySaveResult> => {
    return runPayrollSalaryMutation(async () => {
      if (mode === 'edit') {
        if (!salaryId) {
          throw new Error('Unable to update salary because the salary record is missing.')
        }

        const salary = await payrollService.updatePayrollSalary(
          salaryId,
          payload as PayrollSalaryUpdatePayload,
        )
        invalidatePayrollSalaryCoverageCache()

        return {
          action: 'updated',
          salary,
        }
      }

      if (!currentSalary?.id) {
        const salary = await payrollService.createPayrollSalary(
          payload as PayrollSalaryCreatePayload,
        )
        invalidatePayrollSalaryCoverageCache()

        return {
          action: 'created',
          salary,
        }
      }

      const createPayload = payload as PayrollSalaryCreatePayload
      const previousSalaryEndDate = shiftPayrollDateByDays(createPayload.effective_date, -1)

      try {
        await payrollService.updatePayrollSalary(currentSalary.id, {
          end_date: previousSalaryEndDate,
        })
      } catch (error) {
        throw new Error(
          getPayrollSalarySaveErrorMessage(
            error,
            'Unable to end the current salary before saving the new one.',
          ),
        )
      }

      try {
        const salary = await payrollService.createPayrollSalary(createPayload)
        invalidatePayrollSalaryCoverageCache()

        return {
          action: 'replaced',
          salary,
        }
      } catch (error) {
        const details = getPayrollRequestErrorMessage(
          error,
          'Review the salary dates and try again.',
        )

        throw new Error(
          `The previous salary was ended automatically, but the new salary could not be created. ${details}`.trim(),
        )
      }
    })
  }

  const runPayrollMutation = async (
    payrollRunId: number,
    kind: Exclude<PayrollRunMutationKind, null>,
    callback: () => Promise<PayrollRun>,
  ) => {
    isMutatingPayrollRun.value = true
    mutatingPayrollRunId.value = payrollRunId
    payrollRunMutationKind.value = kind

    try {
      return await callback()
    } finally {
      isMutatingPayrollRun.value = false
      mutatingPayrollRunId.value = null
      payrollRunMutationKind.value = null
    }
  }

  const approvePayrollRun = async (payrollRunId: number) => {
    return runPayrollMutation(payrollRunId, 'approve', () =>
      payrollService.approvePayrollRun(payrollRunId),
    )
  }

  const markPayrollRunPaid = async (payrollRunId: number) => {
    return runPayrollMutation(payrollRunId, 'mark-paid', () =>
      payrollService.markPayrollRunPaid(payrollRunId),
    )
  }

  const cancelPayrollRun = async (payrollRunId: number) => {
    return runPayrollMutation(payrollRunId, 'cancel', () =>
      payrollService.cancelPayrollRun(payrollRunId),
    )
  }

  const regeneratePayrollRun = async (payrollRunId: number) => {
    return runPayrollMutation(payrollRunId, 'regenerate', () =>
      payrollService.regeneratePayrollRun(payrollRunId),
    )
  }

  const exportPayrollRunExcel = async (payrollRunId: number) => {
    return payrollService.exportPayrollRunExcel(payrollRunId)
  }

  return {
    payrollOwnPayslips,
    payrollSalaries,
    payrollRuns,
    payrollRunDetail,
    payrollOwnPayslipDetail,
    isPayrollOwnPayslipsLoading,
    isPayrollSalariesLoading,
    isPayrollRunsLoading,
    isPayrollRunDetailLoading,
    isPayrollOwnPayslipDetailLoading,
    isSavingPayrollSalary,
    isGeneratingPayrollRun,
    isCheckingPayrollGeneration,
    isMutatingPayrollRun,
    mutatingPayrollRunId,
    payrollRunMutationKind,
    payrollOwnPayslipsError,
    payrollSalariesError,
    payrollRunsError,
    payrollRunDetailError,
    payrollOwnPayslipDetailError,
    payrollGenerationCheckError,
    payrollGenerationMissingEmployees,
    payrollGenerationCheckMonth,
    fetchPayrollOwnPayslips,
    fetchPayrollOwnPayslipsByUrl,
    fetchPayrollSalaries,
    fetchPayrollSalariesWithFilters,
    fetchPayrollSalariesByUrl,
    fetchPayrollRuns,
    fetchPayrollRunsByUrl,
    fetchPayrollOwnPayslipDetail,
    fetchPayrollRunDetail,
    clearPayrollOwnPayslipDetail,
    clearPayrollRunDetail,
    clearPayrollGenerationCheck,
    checkAndGeneratePayroll,
    savePayrollSalary,
    createPayrollSalary,
    updatePayrollSalary,
    generatePayrollRun,
    approvePayrollRun,
    markPayrollRunPaid,
    cancelPayrollRun,
    regeneratePayrollRun,
    exportPayrollRunExcel,
  }
})
