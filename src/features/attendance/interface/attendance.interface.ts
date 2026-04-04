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
  correctionStatus: string
}

export interface EmployeeAttendancePeriodSummary {
  presentDays: number
  lateCount: number
  absentCount: number
  workedMinutes: number
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
  source: string
  notes: string | null
  correctionReason: string | null
  correctionStatus: string
  createdAt: string
  updatedAt: string
  employee: AttendanceEmployeeRef
}

export interface AttendanceDetailResponse {
  data: AttendanceRecord
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

export interface AttendanceExportParams {
  employee_id?: number
  department_id?: number
  status?: string
  from_date?: string
  to_date?: string
  month?: string
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
  [key: string]: unknown
}

export type CorrectionRequestListResponse = PaginatedResponse<CorrectionRequest>

export interface CorrectionRequestListParams {
  employee_id?: number
  status?: string
  from_date?: string
  to_date?: string
  per_page?: number
}

export interface AttendanceCorrectionPayload {
  check_in_time?: string | null
  check_out_time?: string | null
  correction_reason: string
  notes?: string | null
}
