import api from '@/lib/http'

import type {
  PayrollExcelExportResponse,
  PayrollOwnPayslip,
  PayrollOwnPayslipListParams,
  PayrollOwnPayslipListResponse,
  PayrollRun,
  PayrollRunDetail,
  PayrollRunGeneratePayload,
  PayrollRunListParams,
  PayrollRunListResponse,
  PayrollSalary,
  PayrollSalaryCreatePayload,
  PayrollSalaryListParams,
  PayrollSalaryListResponse,
  PayrollSalaryUpdatePayload,
} from '../interface/payroll.interface'

const DEFAULT_EXPORT_FILENAME = 'payroll-run-export.xlsx'

const getFilenameFromDisposition = (contentDisposition: string | undefined) => {
  if (!contentDisposition) {
    return DEFAULT_EXPORT_FILENAME
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const filenameMatch = contentDisposition.match(/filename=\"?([^\"]+)\"?/i)

  return filenameMatch?.[1] ?? DEFAULT_EXPORT_FILENAME
}

export const payrollService = {
  async getPayrollSalaries(params?: PayrollSalaryListParams) {
    const { data } = await api.get<PayrollSalaryListResponse>('/payroll/salaries', {
      params,
    })

    return data
  },

  async getPayrollSalariesByUrl(url: string) {
    const { data } = await api.get<PayrollSalaryListResponse>(url)

    return data
  },

  async createPayrollSalary(payload: PayrollSalaryCreatePayload) {
    const { data } = await api.post<PayrollSalary>('/payroll/salaries', payload)

    return data
  },

  async updatePayrollSalary(employeeSalaryId: number, payload: PayrollSalaryUpdatePayload) {
    const { data } = await api.patch<PayrollSalary>(
      `/payroll/salaries/${employeeSalaryId}`,
      payload,
    )

    return data
  },

  async generatePayrollRun(payload: PayrollRunGeneratePayload) {
    const { data } = await api.post<PayrollRun>('/payroll/runs', payload)

    return data
  },

  async getPayrollRuns(params?: PayrollRunListParams) {
    const { data } = await api.get<PayrollRunListResponse>('/payroll/runs', {
      params,
    })

    return data
  },

  async getPayrollRunsByUrl(url: string) {
    const { data } = await api.get<PayrollRunListResponse>(url)

    return data
  },

  async getPayrollRunDetail(payrollRunId: number) {
    const { data } = await api.get<PayrollRunDetail>(`/payroll/runs/${payrollRunId}`)

    return data
  },

  async approvePayrollRun(payrollRunId: number) {
    const { data } = await api.patch<PayrollRun>(`/payroll/runs/${payrollRunId}/approve`)

    return data
  },

  async markPayrollRunPaid(payrollRunId: number) {
    const { data } = await api.patch<PayrollRun>(`/payroll/runs/${payrollRunId}/mark-paid`)

    return data
  },

  async cancelPayrollRun(payrollRunId: number) {
    const { data } = await api.patch<PayrollRun>(`/payroll/runs/${payrollRunId}/cancel`)

    return data
  },

  async regeneratePayrollRun(payrollRunId: number) {
    const { data } = await api.patch<PayrollRun>(`/payroll/runs/${payrollRunId}/regenerate`)

    return data
  },

  async getMyPayslips(params?: PayrollOwnPayslipListParams) {
    const { data } = await api.get<PayrollOwnPayslipListResponse>('/payroll/me/payslips', {
      params,
    })

    return data
  },

  async getMyPayslipsByUrl(url: string) {
    const { data } = await api.get<PayrollOwnPayslipListResponse>(url)

    return data
  },

  async getMyPayslip(payrollItemId: number) {
    const { data } = await api.get<PayrollOwnPayslip>(`/payroll/me/payslips/${payrollItemId}`)

    return data
  },

  async exportPayrollRunExcel(payrollRunId: number) {
    const response = await api.get<Blob>(`/payroll/runs/${payrollRunId}/export/excel`, {
      responseType: 'blob',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })

    return {
      blob: response.data,
      filename: getFilenameFromDisposition(response.headers['content-disposition']),
    } satisfies PayrollExcelExportResponse
  },
}
