import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { ROLES, getPrimaryRole, hasRole, isManagementRole } from '@/constants/roles'
import { useAuth } from '@/features/auth/composable/useAuth'

import type { AttendanceRole } from '../interface/attendance.interface'
import { useAttendanceStore } from '../store/attendanceStore'

export const useAttendance = () => {
  const attendanceStore = useAttendanceStore()
  const { currentUser } = useAuth()
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

  const role = computed<AttendanceRole | null>(() => {
    return getPrimaryRole(currentUser.value)
  })

  const hasEmployeeRole = computed(() => hasRole(currentUser.value, ROLES.EMPLOYEE))
  const hasHrRole = computed(() => hasRole(currentUser.value, ROLES.HR))
  const hasAdminRole = computed(() => hasRole(currentUser.value, ROLES.ADMIN))
  const hasManagementRole = computed(() => isManagementRole(role.value) || hasHrRole.value || hasAdminRole.value)

  return {
    role,
    hasEmployeeRole,
    hasHrRole,
    hasAdminRole,
    hasManagementRole,
    currentUser,
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
