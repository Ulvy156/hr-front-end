import type { Role } from '@/constants/roles'

export interface DashboardQuickAction {
  key: string
  label: string
}

export interface EmployeeAttendanceThisWeek {
  totalPresentDays: number
  lateCount: number
}

export interface EmployeeDashboardSummary {
  todayAttendanceStatus: string
  checkInTime: string | null
  checkOutTime: string | null
  nextAction: string | null
  attendanceThisWeek: EmployeeAttendanceThisWeek
}

export interface WorkforceDashboardSummary {
  totalEmployees: number
  activeEmployees: number
  checkedInTodayCount: number
  checkedOutTodayCount: number
  missingAttendanceCount: number
  employeesOnLeaveTodayCount: number
  lateCountToday: number
}

export interface AdminUsersByRole {
  role: string
  totalUsers: number
}

export interface AdminDashboardSummary extends WorkforceDashboardSummary {
  totalUsers: number
  usersByRole: AdminUsersByRole[]
}

export interface EmployeeDashboardRecord {
  date: string
  checkInTime: string | null
  checkOutTime: string | null
  status: string
}

export interface WorkforceDashboardRecordEmployee {
  id: number
  name: string
  department: string
}

export interface WorkforceDashboardRecord extends EmployeeDashboardRecord {
  employee: WorkforceDashboardRecordEmployee
}

export interface AttendanceIssues {
  missingCheckout: number
  lateArrivals: number
  incompleteAttendance: number
}

export interface EmployeeDashboardResponse {
  role: Role
  summary: EmployeeDashboardSummary
  quickActions: DashboardQuickAction[]
  recentRecords: EmployeeDashboardRecord[]
  extra: Record<string, never>
}

export interface HrDashboardResponse {
  role: Role
  summary: WorkforceDashboardSummary
  quickActions: DashboardQuickAction[]
  recentRecords: WorkforceDashboardRecord[]
  extra: {
    attendanceIssues: AttendanceIssues
  }
}

export interface AdminDashboardResponse {
  role: Role
  summary: AdminDashboardSummary
  quickActions: DashboardQuickAction[]
  recentRecords: WorkforceDashboardRecord[]
  extra: {
    attendanceIssues: AttendanceIssues
  }
}

export type DashboardResponse =
  | EmployeeDashboardResponse
  | HrDashboardResponse
  | AdminDashboardResponse
