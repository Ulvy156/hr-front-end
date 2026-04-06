import type { Role } from '@/constants/roles'

export type AttendanceRole = Role

export interface AttendanceDateRange {
  from: string
  to: string
}

export interface AttendanceMonthlyTotals {
  totalRecords: number
  completedRecords: number
  lateRecords: number
  correctedRecords: number
  absentRecords: number
  totalWorkedMinutes: number
  averageWorkedMinutes: number
  pendingCorrectionRequestsCount: number
}

export interface AttendanceDepartmentSummaryItem {
  departmentId: number
  departmentName: string
  totalRecords: number
  completedRecords: number
  lateRecords: number
  correctedRecords: number
  absentRecords: number
  totalWorkedMinutes: number
}

export interface AttendanceMonthlySummaryData {
  month: string
  dateRange: AttendanceDateRange
  totals: AttendanceMonthlyTotals
  byDepartment: AttendanceDepartmentSummaryItem[]
}

export interface AttendanceMonthlySummaryResponse {
  data: AttendanceMonthlySummaryData
}

export interface EmployeeAttendanceIdentity {
  id: number
  name: string
  department: string
}

export interface EmployeeAttendanceToday {
  attendanceDate: string
  todayAttendanceStatus: string
  nextAction: string | null
  checkInTime: string | null
  checkOutTime: string | null
  workedMinutes: number
  lateMinutes: number
  earlyLeaveMinutes: number
  overtimeMinutes: number
  correctionStatus: string
}

export interface EmployeeAttendanceTodayDetail extends EmployeeAttendanceToday {
  status: string
  source: string | null
  notes: string | null
}

export interface EmployeeAttendancePeriodSummary {
  presentDays: number
  lateCount: number
  absentCount: number
  workedMinutes: number
  overtimeMinutes: number
}

export interface EmployeeAttendanceMonthSummary extends EmployeeAttendancePeriodSummary {
  pendingCorrectionRequests: number
}

export interface EmployeeAttendanceData {
  employee: EmployeeAttendanceIdentity
  today: EmployeeAttendanceToday
  thisWeek: EmployeeAttendancePeriodSummary
  thisMonth: EmployeeAttendanceMonthSummary
}

export interface EmployeeAttendanceResponse {
  data: EmployeeAttendanceData
}

export interface EmployeeAttendanceTodayResponse {
  data: EmployeeAttendanceTodayDetail
}

export interface AttendanceMonthlySummaryParams {
  month?: string
  department_id?: number
}

export interface AttendanceEmployeeRef {
  id: number
  name: string
  department: string
}

export interface AttendanceRecord {
  id: number
  employeeId: number
  attendanceDate: string
  checkInTime: string | null
  checkOutTime: string | null
  checkInAt: string | null
  checkOutAt: string | null
  workedMinutes: number
  status: string
  lateMinutes: number
  earlyLeaveMinutes: number
  overtimeMinutes: number
  source: string
  notes: string | null
  correctionReason: string | null
  correctionStatus: string
  createdAt: string
  updatedAt: string
  employee?: AttendanceEmployeeRef
}

export interface AttendanceDetailResponse {
  data: AttendanceRecord
}

export interface AttendanceActionResponse {
  message: string
  data: AttendanceRecord
}

export interface AttendanceAuditActor {
  id: number
  name: string
}

export interface AttendanceAuditTrail {
  createdBy: AttendanceAuditActor | null
  updatedBy: AttendanceAuditActor | null
  correctedBy: AttendanceAuditActor | null
  editedBy: AttendanceAuditActor | null
}

export interface AttendanceAuditLog extends AttendanceRecord {
  audit: AttendanceAuditTrail
}

export interface AttendanceAuditListParams {
  page?: number
  per_page?: number
}

export interface AttendanceListParams {
  employee_id?: number
  department_id?: number
  status?: string
  from_date?: string
  to_date?: string
  page?: number
  per_page?: number
}

export interface EmployeeAttendanceHistoryParams {
  per_page?: number
}

export interface AttendanceExportParams {
  employee_id?: number
  department_id?: number
  status?: string
  from_date?: string
  to_date?: string
  month?: string
}

export interface AttendanceOutageRecoveryExistingAttendance {
  id: number
  status: string
  source: string | null
}

export interface AttendanceOutageRecoveryEmployee {
  id: number
  employeeCode: string | null
  name: string
  department: string | null
  currentPosition: string | null
  selected: boolean
  skipReason: string | null
  existingAttendance?: AttendanceOutageRecoveryExistingAttendance | null
}

export interface AttendanceOutageRecoverySkippedCounts {
  onLeave: number
  existingAttendance: number
}

export interface AttendanceOutageRecoveryPreviewData {
  date: string
  defaults: {
    checkInAt: string
    checkOutAt: string
    notes: string
  }
  selectedEmployees: PaginatedResponse<AttendanceOutageRecoveryEmployee>
  skipped: {
    counts: AttendanceOutageRecoverySkippedCounts
    onLeave: AttendanceOutageRecoveryEmployee[]
    existingAttendance: AttendanceOutageRecoveryEmployee[]
  }
}

export interface AttendanceOutageRecoveryPreviewParams {
  date?: string
  search?: string
  department_id?: number
  per_page?: number
  page?: number
}

export interface AttendanceOutageRecoveryPreviewResponse {
  data: AttendanceOutageRecoveryPreviewData
}

export interface AttendanceOutageRecoveryApplyPayload {
  date: string
  employee_ids: number[]
  check_in_time?: string | null
  check_out_time?: string | null
  notes?: string | null
}

export interface AttendanceOutageRecoveryApplyResponse {
  message: string
  data: {
    date: string
    createdCount: number
    notes: string | null
    employees: AttendanceOutageRecoveryEmployee[]
  }
}

export interface PaginationLink {
  url: string | null
  label: string
  page: number | null
  active: boolean
}

export interface PaginatedResponse<T> {
  current_page: number
  data: T[]
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  links: PaginationLink[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

export type AttendanceListResponse = PaginatedResponse<AttendanceRecord>

export interface CorrectionRequest {
  id: number
  attendanceId: number
  attendanceDate: string | null
  requestDate: string | null
  employee?: AttendanceEmployeeRef
  requestedCheckInTime: string | null
  requestedCheckOutTime: string | null
  reason: string
  status: string
  reviewNote: string | null
  reviewedAt: string | null
  reviewedBy: AttendanceAuditActor | null
  createdAt: string | null
  updatedAt: string | null
  attendance: AttendanceRecord | null
}

export type CorrectionRequestListResponse = PaginatedResponse<CorrectionRequest>

export interface CorrectionRequestListParams {
  employee_id?: number
  status?: string
  from_date?: string
  to_date?: string
  page?: number
  per_page?: number
}

export interface AttendanceCorrectionPayload {
  check_in_time?: string | null
  check_out_time?: string | null
  correction_reason: string
  notes?: string | null
}

export interface CorrectionRequestStorePayload {
  request_date: string
  requested_check_in_time?: string | null
  requested_check_out_time?: string | null
  reason: string
}

export interface MissingAttendanceRequestStorePayload {
  request_date: string
  requested_check_in_time?: string | null
  requested_check_out_time?: string | null
  reason: string
}

export interface CorrectionRequestStoreResponse {
  message: string
  data: CorrectionRequest
}

export interface CorrectionRequestReviewPayload {
  status: 'approved' | 'rejected'
  review_note?: string | null
}

export interface CorrectionRequestReviewResponse {
  message: string
  data: CorrectionRequest
}

export type AttendanceAuditListResponse = PaginatedResponse<AttendanceAuditLog>
