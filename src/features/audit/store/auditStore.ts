import { ref } from 'vue'
import { defineStore } from 'pinia'

import type {
  AuditLog,
  AuditLogExportParams,
  AuditLogListParams,
  AuditLogListResponse,
} from '../interface/audit.interface'
import { auditService } from '../services/auditService'

export const useAuditStore = defineStore('audit', () => {
  const auditLogs = ref<AuditLogListResponse | null>(null)
  const auditLogDetail = ref<AuditLog | null>(null)
  const isAuditLogsLoading = ref(false)
  const isAuditLogDetailLoading = ref(false)
  const auditLogsError = ref('')
  const auditLogDetailError = ref('')

  const fetchAuditLogs = async (params?: AuditLogListParams) => {
    isAuditLogsLoading.value = true
    auditLogsError.value = ''

    try {
      const response = await auditService.getAuditLogs(params)
      auditLogs.value = response

      return response
    } catch (err) {
      auditLogs.value = null
      auditLogsError.value = err instanceof Error ? err.message : 'Failed to load audit logs.'
      throw err
    } finally {
      isAuditLogsLoading.value = false
    }
  }

  const fetchAuditLogDetail = async (auditLogId: number) => {
    isAuditLogDetailLoading.value = true
    auditLogDetailError.value = ''

    try {
      const response = await auditService.getAuditLogDetail(auditLogId)
      auditLogDetail.value = response.data

      return response
    } catch (err) {
      auditLogDetail.value = null
      auditLogDetailError.value =
        err instanceof Error ? err.message : 'Failed to load audit log details.'
      throw err
    } finally {
      isAuditLogDetailLoading.value = false
    }
  }

  const clearAuditLogDetail = () => {
    auditLogDetail.value = null
    auditLogDetailError.value = ''
    isAuditLogDetailLoading.value = false
  }

  const exportAuditLogsExcel = async (params?: AuditLogExportParams) => {
    return auditService.exportAuditLogsExcel(params)
  }

  return {
    auditLogs,
    auditLogDetail,
    isAuditLogsLoading,
    isAuditLogDetailLoading,
    auditLogsError,
    auditLogDetailError,
    fetchAuditLogs,
    fetchAuditLogDetail,
    clearAuditLogDetail,
    exportAuditLogsExcel,
  }
})
