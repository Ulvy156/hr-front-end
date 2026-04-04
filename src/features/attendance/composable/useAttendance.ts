import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { isRole } from '@/constants/roles'
import { useAuth } from '@/features/auth/composable/useAuth'

import type { AttendanceRole } from '../interface/attendance.interface'
import { useAttendanceStore } from '../store/attendanceStore'

export const useAttendance = () => {
  const attendanceStore = useAttendanceStore()
  const { currentUser } = useAuth()
  const {
    attendanceDetail,
    attendanceList,
    correctionRequests,
    employeeData,
    error,
    initialized,
    isDetailLoading,
    isLoading,
    lastUpdated,
    organizationData,
  } = storeToRefs(attendanceStore)

  const role = computed<AttendanceRole | null>(() => {
    const roleName = currentUser.value?.roles?.[0]?.name

    return roleName && isRole(roleName) ? roleName : null
  })

  return {
    role,
    currentUser,
    attendanceList,
    correctionRequests,
    attendanceDetail,
    employeeData,
    organizationData,
    error,
    initialized,
    isDetailLoading,
    isLoading,
    lastUpdated,
    fetchEmployeeAttendance: attendanceStore.fetchEmployeeAttendance,
    fetchOrganizationAttendance: attendanceStore.fetchOrganizationAttendance,
    fetchAttendanceList: attendanceStore.fetchAttendanceList,
    fetchCorrectionRequests: attendanceStore.fetchCorrectionRequests,
    fetchAttendanceDetail: attendanceStore.fetchAttendanceDetail,
    correctAttendance: attendanceStore.correctAttendance,
    exportPdf: attendanceStore.exportPdf,
    exportExcel: attendanceStore.exportExcel,
    clearAttendance: attendanceStore.clearAttendance,
  }
}
