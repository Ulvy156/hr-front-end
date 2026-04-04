import api from '@/lib/http'

import type {
  AttendanceCorrectionPayload,
  AttendanceDetailResponse,
  AttendanceExportParams,
  AttendanceListParams,
  AttendanceListResponse,
  AttendanceMonthlySummaryParams,
  AttendanceMonthlySummaryResponse,
  CorrectionRequestListParams,
  CorrectionRequestListResponse,
  EmployeeAttendanceResponse,
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
  async getEmployeeAttendanceSummary() {
    const { data } = await api.get<EmployeeAttendanceResponse>('/attendance/me/summary')

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
