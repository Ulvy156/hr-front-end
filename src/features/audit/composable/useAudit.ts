import { storeToRefs } from 'pinia'

import { useAuditStore } from '../store/auditStore'

export const useAudit = () => {
  const auditStore = useAuditStore()
  const {
    auditLogs,
    auditLogDetail,
    isAuditLogsLoading,
    isAuditLogDetailLoading,
    auditLogsError,
    auditLogDetailError,
  } = storeToRefs(auditStore)

  return {
    auditLogs,
    auditLogDetail,
    isAuditLogsLoading,
    isAuditLogDetailLoading,
    auditLogsError,
    auditLogDetailError,
    fetchAuditLogs: auditStore.fetchAuditLogs,
    fetchAuditLogDetail: auditStore.fetchAuditLogDetail,
    clearAuditLogDetail: auditStore.clearAuditLogDetail,
    exportAuditLogsExcel: auditStore.exportAuditLogsExcel,
  }
}
