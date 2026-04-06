import api from '@/lib/http'

import type {
  AuditLogDetailResponse,
  AuditLogExportParams,
  AuditLogListParams,
  AuditLogListResponse,
} from '../interface/audit.interface'

type AuditExportResponse = {
  blob: Blob
  filename: string
}

const DEFAULT_EXPORT_FILENAME = `audit-logs-${new Date().toISOString().slice(0, 10)}.xlsx`

const getFilenameFromDisposition = (contentDisposition: string | undefined) => {
  if (!contentDisposition) {
    return DEFAULT_EXPORT_FILENAME
  }

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i)

  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1])
  }

  const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)

  return filenameMatch?.[1] ?? DEFAULT_EXPORT_FILENAME
}

export const auditService = {
  async getAuditLogs(params?: AuditLogListParams) {
    const { data } = await api.get<AuditLogListResponse>('/audit-logs', {
      params,
    })

    return data
  },

  async getAuditLogDetail(auditLogId: number) {
    const { data } = await api.get<AuditLogDetailResponse>(`/audit-logs/${auditLogId}`)

    return data
  },

  async exportAuditLogsExcel(params?: AuditLogExportParams) {
    const response = await api.get<Blob>('/audit-logs/export/excel', {
      params,
      responseType: 'blob',
      headers: {
        Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      },
    })

    return {
      blob: response.data,
      filename: getFilenameFromDisposition(response.headers['content-disposition']),
    } satisfies AuditExportResponse
  },
}
