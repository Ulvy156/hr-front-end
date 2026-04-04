import { ref } from 'vue'
import { defineStore } from 'pinia'

import type {
  AttendanceCorrectionPayload,
  AttendanceExportParams,
  AttendanceListParams,
  AttendanceListResponse,
  AttendanceMonthlySummaryData,
  AttendanceMonthlySummaryParams,
  AttendanceRecord,
  CorrectionRequestListParams,
  CorrectionRequestListResponse,
  EmployeeAttendanceData,
} from '../interface/attendance.interface'
import { attendanceService } from '../services/attendanceService'

export const useAttendanceStore = defineStore('attendance', () => {
  const employeeData = ref<EmployeeAttendanceData | null>(null)
  const organizationData = ref<AttendanceMonthlySummaryData | null>(null)
  const attendanceList = ref<AttendanceListResponse | null>(null)
  const correctionRequests = ref<CorrectionRequestListResponse | null>(null)
  const attendanceDetail = ref<AttendanceRecord | null>(null)
  const isLoading = ref(false)
  const isDetailLoading = ref(false)
  const error = ref('')
  const initialized = ref(false)
  const lastUpdated = ref<string | null>(null)

  const fetchEmployeeAttendance = async () => {
    isLoading.value = true
    error.value = ''

    try {
      const response = await attendanceService.getEmployeeAttendanceSummary()
      employeeData.value = response.data
      organizationData.value = null
      lastUpdated.value = new Date().toISOString()

      return response
    } catch (err) {
      employeeData.value = null
      error.value = err instanceof Error ? err.message : 'Failed to load attendance.'
      throw err
    } finally {
      isLoading.value = false
      initialized.value = true
    }
  }

  const fetchOrganizationAttendance = async (params?: AttendanceMonthlySummaryParams) => {
    isLoading.value = true
    error.value = ''

    try {
      const response = await attendanceService.getMonthlySummary(params)
      organizationData.value = response.data
      employeeData.value = null
      lastUpdated.value = new Date().toISOString()

      return response
    } catch (err) {
      organizationData.value = null
      error.value = err instanceof Error ? err.message : 'Failed to load attendance.'
      throw err
    } finally {
      isLoading.value = false
      initialized.value = true
    }
  }

  const fetchAttendanceList = async (params?: AttendanceListParams) => {
    const response = await attendanceService.getAttendanceList(params)
    attendanceList.value = response

    return response
  }

  const fetchCorrectionRequests = async (params?: CorrectionRequestListParams) => {
    const response = await attendanceService.getCorrectionRequests(params)
    correctionRequests.value = response

    return response
  }

  const fetchAttendanceDetail = async (attendanceId: number) => {
    isDetailLoading.value = true

    try {
      const response = await attendanceService.getAttendanceDetail(attendanceId)
      attendanceDetail.value = response.data

      return response
    } finally {
      isDetailLoading.value = false
    }
  }

  const correctAttendance = async (attendanceId: number, payload: AttendanceCorrectionPayload) => {
    return attendanceService.correctAttendance(attendanceId, payload)
  }

  const exportPdf = async (params?: AttendanceExportParams) => {
    return attendanceService.exportPdf(params)
  }

  const exportExcel = async (params?: AttendanceExportParams) => {
    return attendanceService.exportExcel(params)
  }

  const clearAttendance = () => {
    employeeData.value = null
    organizationData.value = null
    attendanceList.value = null
    correctionRequests.value = null
    attendanceDetail.value = null
    isLoading.value = false
    isDetailLoading.value = false
    error.value = ''
    initialized.value = false
    lastUpdated.value = null
  }

  return {
    employeeData,
    organizationData,
    attendanceList,
    correctionRequests,
    attendanceDetail,
    isLoading,
    isDetailLoading,
    error,
    initialized,
    lastUpdated,
    fetchEmployeeAttendance,
    fetchOrganizationAttendance,
    fetchAttendanceList,
    fetchCorrectionRequests,
    fetchAttendanceDetail,
    correctAttendance,
    exportPdf,
    exportExcel,
    clearAttendance,
  }
})
