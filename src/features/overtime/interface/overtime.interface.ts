export const OVERTIME_REQUEST_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const

export const OVERTIME_APPROVAL_STAGE = {
  MANAGER_REVIEW: 'manager_review',
  COMPLETED: 'completed',
} as const

export const OVERTIME_TYPE = {
  NORMAL: 'normal',
  WEEKEND: 'weekend',
  HOLIDAY: 'holiday',
} as const

export type OvertimeRequestStatus =
  (typeof OVERTIME_REQUEST_STATUS)[keyof typeof OVERTIME_REQUEST_STATUS]

export type OvertimeApprovalStage =
  (typeof OVERTIME_APPROVAL_STAGE)[keyof typeof OVERTIME_APPROVAL_STAGE]

export type OvertimeType = (typeof OVERTIME_TYPE)[keyof typeof OVERTIME_TYPE]

export interface OvertimeRequestEmployee {
  id: number
  name: string
  department: string | null
  manager_id: number | null
}

export interface OvertimeRequestApprover {
  id: number
  name: string
}

export interface OvertimeRequest {
  id: number
  employee_id: number
  overtime_date: string
  start_time: string
  end_time: string
  reason: string | null
  status: OvertimeRequestStatus
  status_label: string | null
  approval_stage: OvertimeApprovalStage | string | null
  approval_stage_label: string | null
  minutes: number
  hours: number
  overtime_type: OvertimeType | string | null
  overtime_type_label: string | null
  cancelable: boolean
  employee: OvertimeRequestEmployee | null
  manager_approved_by: OvertimeRequestApprover | null
  manager_approved_at: string | null
  rejected_by: OvertimeRequestApprover | null
  rejected_at: string | null
  rejection_reason: string | null
  submitted_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface PaginationLink {
  url: string | null
  label: string
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

export type OvertimeRequestListResponse = PaginatedResponse<OvertimeRequest>

export interface OvertimeRequestListParams {
  employee_id?: number
  status?: OvertimeRequestStatus
  approval_stage?: OvertimeApprovalStage
  overtime_type?: OvertimeType
  from_date?: string
  to_date?: string
  per_page?: number
  page?: number
}

export interface OvertimeRequestDetailResponse {
  id: number
  employee_id: number
  overtime_date: string
  start_time: string
  end_time: string
  reason: string | null
  status: OvertimeRequestStatus
  status_label: string | null
  approval_stage: OvertimeApprovalStage | string | null
  approval_stage_label: string | null
  minutes: number
  hours: number
  overtime_type: OvertimeType | string | null
  overtime_type_label: string | null
  cancelable: boolean
  employee: OvertimeRequestEmployee | null
  manager_approved_by: OvertimeRequestApprover | null
  manager_approved_at: string | null
  rejected_by: OvertimeRequestApprover | null
  rejected_at: string | null
  rejection_reason: string | null
  submitted_at: string | null
  created_at: string | null
  updated_at: string | null
}

export interface OvertimeRequestCreatePayload {
  overtime_date: string
  start_time: string
  end_time: string
  reason: string
}

export interface OvertimeRequestRejectPayload {
  rejection_reason: string
}

export interface OvertimeRequestMutationResponse {
  message: string
  data: OvertimeRequest
}

export interface OvertimeRequestFiltersState {
  employee_id: string
  status: '' | OvertimeRequestStatus
  approval_stage: '' | OvertimeApprovalStage
  overtime_type: '' | OvertimeType
  date_range: [string, string] | null
  page: number
  per_page: number
}
