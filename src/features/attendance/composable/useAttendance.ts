import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { useAuth } from '@/features/auth/composable/useAuth'
import { usePermission } from '@/features/auth/composable/usePermission'
import { PERMISSIONS } from '@/constants/permissions'

import { useAttendanceStore } from '../store/attendanceStore'

export const useAttendance = () => {
  const attendanceStore = useAttendanceStore()
  const { canUseEmployeeSelfService, currentUser } = useAuth()
  const { hasAnyPermission, hasPermission } = usePermission()
  const {
    auditLogs,
    auditLogsError,
    attendanceDetail,
    attendanceList,
    correctionRequests,
    employeeAttendanceHistory,
    employeeData,
    error,
    initialized,
    isAuditLogsLoading,
    isDetailLoading,
    isLoading,
    lastUpdated,
    outageRecoveryError,
    outageRecoveryPreview,
    isOutageRecoveryApplying,
    isOutageRecoveryLoading,
    organizationData,
  } = storeToRefs(attendanceStore)

  const canUseSelfAttendanceActions = computed(() =>
    canUseEmployeeSelfService.value &&
    hasPermission(PERMISSIONS.ATTENDANCE_RECORD),
  )
  const canViewSelfAttendanceHistory = computed(() =>
    canUseEmployeeSelfService.value &&
    hasPermission(PERMISSIONS.ATTENDANCE_VIEW_SELF),
  )
  const canViewSelfAttendanceSummary = computed(() =>
    canUseEmployeeSelfService.value &&
    hasPermission(PERMISSIONS.ATTENDANCE_SUMMARY_SELF),
  )
  const canRequestAttendanceCorrection = computed(() =>
    canUseEmployeeSelfService.value &&
    hasPermission(PERMISSIONS.ATTENDANCE_CORRECTION_REQUEST),
  )
  const canRequestMissingAttendance = computed(() =>
    canUseEmployeeSelfService.value &&
    hasPermission(PERMISSIONS.ATTENDANCE_MISSING_REQUEST),
  )
  const canViewOrganizationAttendanceSummary = computed(() =>
    hasPermission(PERMISSIONS.ATTENDANCE_SUMMARY_ANY),
  )
  const canViewAttendanceRecords = computed(() =>
    hasPermission(PERMISSIONS.ATTENDANCE_VIEW_ANY),
  )
  const canManageAttendance = computed(() =>
    hasPermission(PERMISSIONS.ATTENDANCE_MANAGE),
  )
  const canExportAttendance = computed(() =>
    hasPermission(PERMISSIONS.ATTENDANCE_EXPORT),
  )
  const canViewAttendanceAudit = computed(() =>
    hasPermission(PERMISSIONS.ATTENDANCE_AUDIT_VIEW),
  )
  const canAccessAttendanceWorkspace = computed(() =>
    hasAnyPermission([
      PERMISSIONS.ATTENDANCE_RECORD,
      PERMISSIONS.ATTENDANCE_SUMMARY_SELF,
      PERMISSIONS.ATTENDANCE_SUMMARY_ANY,
      PERMISSIONS.ATTENDANCE_VIEW_SELF,
      PERMISSIONS.ATTENDANCE_VIEW_ANY,
      PERMISSIONS.ATTENDANCE_CORRECTION_REQUEST,
      PERMISSIONS.ATTENDANCE_MISSING_REQUEST,
      PERMISSIONS.ATTENDANCE_MANAGE,
      PERMISSIONS.ATTENDANCE_AUDIT_VIEW,
    ]),
  )

  return {
    currentUser,
    canUseEmployeeSelfService,
    canUseSelfAttendanceActions,
    canViewSelfAttendanceHistory,
    canViewSelfAttendanceSummary,
    canRequestAttendanceCorrection,
    canRequestMissingAttendance,
    canViewOrganizationAttendanceSummary,
    canViewAttendanceRecords,
    canManageAttendance,
    canExportAttendance,
    canViewAttendanceAudit,
    canAccessAttendanceWorkspace,
    auditLogs,
    auditLogsError,
    attendanceList,
    correctionRequests,
    attendanceDetail,
    employeeAttendanceHistory,
    employeeData,
    organizationData,
    outageRecoveryPreview,
    error,
    outageRecoveryError,
    initialized,
    isAuditLogsLoading,
    isDetailLoading,
    isLoading,
    isOutageRecoveryApplying,
    isOutageRecoveryLoading,
    lastUpdated,
    fetchEmployeeAttendance: attendanceStore.fetchEmployeeAttendance,
    fetchEmployeeTodayAttendance: attendanceStore.fetchEmployeeTodayAttendance,
    fetchEmployeeAttendanceHistory: attendanceStore.fetchEmployeeAttendanceHistory,
    fetchOrganizationAttendance: attendanceStore.fetchOrganizationAttendance,
    fetchAttendanceList: attendanceStore.fetchAttendanceList,
    fetchAuditLogs: attendanceStore.fetchAuditLogs,
    fetchOutageRecoveryPreview: attendanceStore.fetchOutageRecoveryPreview,
    fetchCorrectionRequests: attendanceStore.fetchCorrectionRequests,
    fetchAttendanceDetail: attendanceStore.fetchAttendanceDetail,
    applyOutageRecovery: attendanceStore.applyOutageRecovery,
    correctAttendance: attendanceStore.correctAttendance,
    submitCorrectionRequest: attendanceStore.submitCorrectionRequest,
    submitMissingAttendanceRequest: attendanceStore.submitMissingAttendanceRequest,
    reviewCorrectionRequest: attendanceStore.reviewCorrectionRequest,
    checkIn: attendanceStore.checkIn,
    checkOut: attendanceStore.checkOut,
    exportPdf: attendanceStore.exportPdf,
    exportExcel: attendanceStore.exportExcel,
    clearAttendance: attendanceStore.clearAttendance,
  }
}
