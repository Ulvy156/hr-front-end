export const LEAVE_REQUEST_STATUS = {
  PENDING: 'pending',
  MANAGER_APPROVED: 'manager_approved',
  HR_APPROVED: 'hr_approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const

export const LEAVE_DURATION = {
  FULL_DAY: 'full_day',
  HALF_DAY: 'half_day',
} as const

export type LeaveDuration = (typeof LEAVE_DURATION)[keyof typeof LEAVE_DURATION]

export const LEAVE_HALF_DAY_SESSION = {
  AM: 'AM',
  PM: 'PM',
} as const

export type LeaveHalfDaySession =
  (typeof LEAVE_HALF_DAY_SESSION)[keyof typeof LEAVE_HALF_DAY_SESSION]

export type LeaveRequestStatus = (typeof LEAVE_REQUEST_STATUS)[keyof typeof LEAVE_REQUEST_STATUS]

export interface LeaveType {
  id: number
  code: string
  name: string
  label: string | null
  description: string | null
  is_paid: boolean
  requires_balance: boolean
  requires_attachment: boolean
  requires_medical_certificate: boolean
  auto_exclude_public_holidays: boolean
  auto_exclude_weekends: boolean
  gender_restriction: string | null
  min_service_days: number | null
  max_days_per_request: number | null
  max_days_per_year: number | null
  supports_half_day: boolean
  supported_half_day_sessions: LeaveHalfDaySession[]
  notice_rules: unknown[] | null
  notice_rule_text: string | null
  is_requestable: boolean
  request_restriction_reason: string | null
  balance_snapshot: LeaveRequestBalance[]
}

export interface LeaveTypeListResponse {
  data: LeaveType[]
}

export interface LeavePublicHoliday {
  id: number
  name: string
  holiday_date: string
  year: number
  country_code: string
  is_paid: boolean
  source: string | null
  metadata: Record<string, unknown> | null
}

export interface LeavePublicHolidayListResponse {
  data: LeavePublicHoliday[]
}

export interface LeaveRequestEmployee {
  id: number
  name: string
  department: string | null
  manager_id: number | null
  leave_approver_id: number | null
}

export interface LeaveRequestApprover {
  id: number
  name: string
}

export interface LeaveRequestApprovalProgressStep {
  status: string | null
  approver: LeaveRequestApprover | null
  acted_at: string | null
}

export interface LeaveRequestApprovalProgress {
  manager: LeaveRequestApprovalProgressStep | null
  hr: LeaveRequestApprovalProgressStep | null
}

export interface LeaveRequestLeaveType {
  code: string
  name: string
  is_paid: boolean
  requires_balance: boolean
}

export interface LeaveBalanceLeaveType {
  code: string
  name: string
  label: string
  is_paid: boolean
  requires_balance: boolean
}

export interface LeaveCurrentBalance {
  leave_type: LeaveBalanceLeaveType
  total_days: number | null
  used_days: number
  remaining_days: number | null
  year: number
}

export interface LeaveBalanceListResponse {
  data: LeaveCurrentBalance[]
}

export interface LeaveRequestBalance {
  year: number
  entitlement_days: number
  used_days: number
  reserved_days: number
  available_days: number
}

export interface LeaveRequest {
  id: number
  employee_id: number
  type: string
  leave_type_label: string | null
  reason: string | null
  duration_type: LeaveDuration | string | null
  half_day_session: LeaveHalfDaySession | null
  start_date: string
  end_date: string
  requested_days: number
  total_days: number | null
  status: LeaveRequestStatus
  status_label: string | null
  cancelable: boolean
  approval_stage: string | null
  manager_approval_status: string | null
  hr_approval_status: string | null
  approval_progress: LeaveRequestApprovalProgress | null
  employee: LeaveRequestEmployee | null
  leave_type: LeaveRequestLeaveType | null
  balances: LeaveRequestBalance[]
  manager_approved_by: LeaveRequestApprover | null
  manager_approved_at: string | null
  hr_approved_by: LeaveRequestApprover | null
  hr_approved_at: string | null
  submitted_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface LeaveRequestDetailResponse {
  data: LeaveRequest
}

export interface LeaveRequestMutationResponse {
  message: string
  data: LeaveRequest
}

export interface PaginationLink {
  url: string | null
  label: string
  active: boolean
  page?: number | null
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

export interface LeaveRequestListSummary {
  total_requests: number
  pending_count: number
  approved_count: number
  rejected_count: number
  cancelled_count: number
}

export interface LeaveRequestListResponse extends PaginatedResponse<LeaveRequest> {
  summary?: LeaveRequestListSummary | null
}

export interface LeaveRequestListParams {
  employee_id?: number
  type?: string
  status?: LeaveRequestStatus
  from_date?: string
  to_date?: string
  per_page?: number
  page?: number
}

export interface LeaveRequestCreatePayload {
  type: string
  reason: string
  duration_type: LeaveDuration
  start_date: string
  end_date: string
  half_day_session?: LeaveHalfDaySession
}

export interface LeaveRequestFormState {
  type: string
  reason: string
  duration_type: LeaveDuration
  start_date: string
  end_date: string
  half_day_session: '' | LeaveHalfDaySession
}

export interface LeaveRequestManagerReviewPayload {
  status: typeof LEAVE_REQUEST_STATUS.MANAGER_APPROVED | typeof LEAVE_REQUEST_STATUS.REJECTED
}

export interface LeaveRequestHrReviewPayload {
  status: typeof LEAVE_REQUEST_STATUS.HR_APPROVED | typeof LEAVE_REQUEST_STATUS.REJECTED
}

export interface LeaveRequestFiltersState {
  employee_id: string
  type: string
  status: '' | LeaveRequestStatus
  date_range: [string, string] | null
  page: number
  per_page: number
}
