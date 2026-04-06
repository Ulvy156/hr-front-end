import api from '@/lib/http'

import type {
  AttendanceActionResponse,
  AttendanceAuditListParams,
  AttendanceAuditListResponse,
  AttendanceCorrectionPayload,
  AttendanceDetailResponse,
  AttendanceExportParams,
  AttendanceListParams,
  AttendanceListResponse,
  AttendanceMonthlySummaryParams,
  AttendanceMonthlySummaryResponse,
  AttendanceOutageRecoveryApplyPayload,
  AttendanceOutageRecoveryApplyResponse,
  AttendanceOutageRecoveryPreviewParams,
  AttendanceOutageRecoveryPreviewResponse,
  CorrectionRequestStorePayload,
  CorrectionRequestReviewPayload,
  CorrectionRequestReviewResponse,
  CorrectionRequestStoreResponse,
  CorrectionRequestListParams,
  CorrectionRequestListResponse,
  MissingAttendanceRequestStorePayload,
  EmployeeAttendanceHistoryParams,
  EmployeeAttendanceResponse,
  EmployeeAttendanceTodayResponse,
} from '../interface/attendance.interface'

type AttendanceExportFormat = 'pdf' | 'excel'

type AttendanceExportResponse = {
  blob: Blob
  filename: string
}

const DEFAULT_EXPORT_FILENAMES: Record<AttendanceExportFormat, string> = {
  pdf: 'attendance-report.pdf',
  excel: 'attendance-report.xlsx',
}

const getFilenameFromDisposition = (
  contentDisposition: string | undefined,
  format: AttendanceExportFormat,
) => {
  if (!contentDisposition) {
    return DEFAULT_EXPORT_FILENAMES[format]
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)

  return filenameMatch?.[1] ?? DEFAULT_EXPORT_FILENAMES[format]
}

const exportAttendance = async (format: AttendanceExportFormat, params?: AttendanceExportParams) => {
  const acceptHeader =
    format === 'pdf'
      ? 'application/pdf'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

  const response = await api.get<Blob>(`/attendance/export/${format}`, {
    params,
    responseType: 'blob',
    headers: {
      Accept: acceptHeader,
    },
  })

  return {
    blob: response.data,
    filename: getFilenameFromDisposition(response.headers['content-disposition'], format),
  } satisfies AttendanceExportResponse
}

export const attendanceService = {
  async checkIn() {
    const { data } = await api.post<AttendanceActionResponse>('/attendance/check-in', {})

    return data
  },

  async checkOut() {
    const { data } = await api.post<AttendanceActionResponse>('/attendance/check-out', {})

    return data
  },

  async getEmployeeTodayAttendance() {
    const { data } = await api.get<EmployeeAttendanceTodayResponse>('/attendance/me/today')

    return data
  },

  async getEmployeeAttendanceSummary() {
    const { data } = await api.get<EmployeeAttendanceResponse>('/attendance/me/summary')

    return data
  },

  async getEmployeeAttendanceHistory(params?: EmployeeAttendanceHistoryParams) {
    const { data } = await api.get<AttendanceListResponse>('/attendance/me/history', {
      params,
    })

    return data
  },

  async submitCorrectionRequest(payload: CorrectionRequestStorePayload) {
    const { data } = await api.post<CorrectionRequestStoreResponse>(
      '/attendance/me/correction-request',
      payload,
    )

    return data
  },

  async submitMissingAttendanceRequest(payload: MissingAttendanceRequestStorePayload) {
    const { data } = await api.post<CorrectionRequestStoreResponse>(
      '/attendance/me/missing-request',
      payload,
    )

    return data
  },

  async reviewCorrectionRequest(
    correctionRequestId: number,
    payload: CorrectionRequestReviewPayload,
  ) {
    const { data } = await api.patch<CorrectionRequestReviewResponse>(
      `/attendance/correction-requests/${correctionRequestId}`,
      payload,
    )

    return data
  },

  async getMonthlySummary(params?: AttendanceMonthlySummaryParams) {
    const { data } = await api.get<AttendanceMonthlySummaryResponse>(
      '/attendance/summary/monthly',
      {
        params,
      },
    )

    return data
  },

  async getAttendanceList(params?: AttendanceListParams) {
    const { data } = await api.get<AttendanceListResponse>('/attendance', {
      params,
    })

    return data
  },

  async getCorrectionRequests(params?: CorrectionRequestListParams) {
    const { data } = await api.get<CorrectionRequestListResponse>(
      '/attendance/correction-requests',
      {
        params,
      },
    )

    return data
  },

  async getAuditLogs(params?: AttendanceAuditListParams) {
    const { data } = await api.get<AttendanceAuditListResponse>('/attendance/audit/logs', {
      params,
    })

    return data
  },

  async getOutageRecoveryPreview(params?: AttendanceOutageRecoveryPreviewParams) {
    const { data } = await api.get<AttendanceOutageRecoveryPreviewResponse>(
      '/attendance/outage-recovery/preview',
      {
        params,
      },
    )

    return data
  },

  async applyOutageRecovery(payload: AttendanceOutageRecoveryApplyPayload) {
    const { data } = await api.post<AttendanceOutageRecoveryApplyResponse>(
      '/attendance/outage-recovery/apply',
      payload,
    )

    return data
  },

  async getAttendanceDetail(attendanceId: number) {
    const { data } = await api.get<AttendanceDetailResponse>(`/attendance/${attendanceId}`)

    return data
  },

  async correctAttendance(attendanceId: number, payload: AttendanceCorrectionPayload) {
    const { data } = await api.patch(`/attendance/${attendanceId}/correct`, payload)

    return data
  },

  async exportPdf(params?: AttendanceExportParams) {
    return exportAttendance('pdf', params)
  },

  async exportExcel(params?: AttendanceExportParams) {
    return exportAttendance('excel', params)
  },
}
