import { ref } from 'vue'
import { defineStore } from 'pinia'

import type {
  AttendanceAuditListParams,
  AttendanceAuditListResponse,
  AttendanceCorrectionPayload,
  AttendanceExportParams,
  AttendanceListResponse,
  AttendanceListParams,
  AttendanceMonthlySummaryData,
  AttendanceMonthlySummaryParams,
  AttendanceOutageRecoveryApplyPayload,
  AttendanceOutageRecoveryPreviewData,
  AttendanceOutageRecoveryPreviewParams,
  AttendanceRecord,
  CorrectionRequestListParams,
  CorrectionRequestListResponse,
  CorrectionRequestReviewPayload,
  CorrectionRequestStorePayload,
  MissingAttendanceRequestStorePayload,
  EmployeeAttendanceData,
} from '../interface/attendance.interface'
import { attendanceService } from '../services/attendanceService'

export const useAttendanceStore = defineStore('attendance', () => {
  const employeeData = ref<EmployeeAttendanceData | null>(null)
  const organizationData = ref<AttendanceMonthlySummaryData | null>(null)
  const attendanceList = ref<AttendanceListResponse | null>(null)
  const employeeAttendanceHistory = ref<AttendanceListResponse | null>(null)
  const auditLogs = ref<AttendanceAuditListResponse | null>(null)
  const correctionRequests = ref<CorrectionRequestListResponse | null>(null)
  const attendanceDetail = ref<AttendanceRecord | null>(null)
  const outageRecoveryPreview = ref<AttendanceOutageRecoveryPreviewData | null>(null)
  const isLoading = ref(false)
  const isDetailLoading = ref(false)
  const isAuditLogsLoading = ref(false)
  const isOutageRecoveryLoading = ref(false)
  const isOutageRecoveryApplying = ref(false)
  const error = ref('')
  const auditLogsError = ref('')
  const outageRecoveryError = ref('')
  const initialized = ref(false)
  const lastUpdated = ref<string | null>(null)

  const fetchEmployeeAttendance = async () => {
    isLoading.value = true
    error.value = ''

    try {
      const response = await attendanceService.getEmployeeAttendanceSummary()
      employeeData.value = response.data
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

  const fetchEmployeeTodayAttendance = async () => {
    return attendanceService.getEmployeeTodayAttendance()
  }

  const fetchEmployeeAttendanceHistory = async (params?: { per_page?: number }) => {
    const response = await attendanceService.getEmployeeAttendanceHistory(params)
    employeeAttendanceHistory.value = response

    return response
  }

  const fetchOrganizationAttendance = async (params?: AttendanceMonthlySummaryParams) => {
    isLoading.value = true
    error.value = ''

    try {
      const response = await attendanceService.getMonthlySummary(params)
      organizationData.value = response.data
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

  const fetchAuditLogs = async (params?: AttendanceAuditListParams) => {
    isAuditLogsLoading.value = true
    auditLogsError.value = ''

    try {
      const response = await attendanceService.getAuditLogs(params)
      auditLogs.value = response

      return response
    } catch (err) {
      auditLogs.value = null
      auditLogsError.value =
        err instanceof Error ? err.message : 'Failed to load attendance audit logs.'
      throw err
    } finally {
      isAuditLogsLoading.value = false
    }
  }

  const fetchOutageRecoveryPreview = async (params?: AttendanceOutageRecoveryPreviewParams) => {
    isOutageRecoveryLoading.value = true
    outageRecoveryError.value = ''

    try {
      const response = await attendanceService.getOutageRecoveryPreview(params)
      outageRecoveryPreview.value = response.data
      return response
    } catch (err) {
      outageRecoveryPreview.value = null
      outageRecoveryError.value =
        err instanceof Error ? err.message : 'Failed to load outage recovery preview.'
      throw err
    } finally {
      isOutageRecoveryLoading.value = false
    }
  }

  const applyOutageRecovery = async (payload: AttendanceOutageRecoveryApplyPayload) => {
    isOutageRecoveryApplying.value = true
    outageRecoveryError.value = ''

    try {
      return await attendanceService.applyOutageRecovery(payload)
    } catch (err) {
      outageRecoveryError.value =
        err instanceof Error ? err.message : 'Failed to apply outage recovery.'
      throw err
    } finally {
      isOutageRecoveryApplying.value = false
    }
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

  const submitCorrectionRequest = async (payload: CorrectionRequestStorePayload) => {
    return attendanceService.submitCorrectionRequest(payload)
  }

  const submitMissingAttendanceRequest = async (payload: MissingAttendanceRequestStorePayload) => {
    return attendanceService.submitMissingAttendanceRequest(payload)
  }

  const reviewCorrectionRequest = async (
    correctionRequestId: number,
    payload: CorrectionRequestReviewPayload,
  ) => {
    return attendanceService.reviewCorrectionRequest(correctionRequestId, payload)
  }

  const checkIn = async () => {
    return attendanceService.checkIn()
  }

  const checkOut = async () => {
    return attendanceService.checkOut()
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
    auditLogs.value = null
    correctionRequests.value = null
    attendanceDetail.value = null
    outageRecoveryPreview.value = null
    isLoading.value = false
    isDetailLoading.value = false
    isAuditLogsLoading.value = false
    isOutageRecoveryLoading.value = false
    isOutageRecoveryApplying.value = false
    error.value = ''
    auditLogsError.value = ''
    outageRecoveryError.value = ''
    initialized.value = false
    lastUpdated.value = null
  }

  return {
    employeeData,
    organizationData,
    attendanceList,
    employeeAttendanceHistory,
    auditLogs,
    correctionRequests,
    attendanceDetail,
    outageRecoveryPreview,
    isLoading,
    isDetailLoading,
    isAuditLogsLoading,
    isOutageRecoveryLoading,
    isOutageRecoveryApplying,
    error,
    auditLogsError,
    outageRecoveryError,
    initialized,
    lastUpdated,
    fetchEmployeeAttendance,
    fetchEmployeeTodayAttendance,
    fetchEmployeeAttendanceHistory,
    fetchOrganizationAttendance,
    fetchAttendanceList,
    fetchAuditLogs,
    fetchOutageRecoveryPreview,
    fetchCorrectionRequests,
    fetchAttendanceDetail,
    applyOutageRecovery,
    correctAttendance,
    submitCorrectionRequest,
    submitMissingAttendanceRequest,
    reviewCorrectionRequest,
    checkIn,
    checkOut,
    exportPdf,
    exportExcel,
    clearAttendance,
  }
})
