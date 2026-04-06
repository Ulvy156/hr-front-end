export interface AuditLogCauser {
  type: string | null
  id: number | null
  name: string | null
  email: string | null
}

export interface AuditLogSubject {
  type: string | null
  id: number | null
  label: string | null
}

export type AuditStructuredValue = Record<string, unknown> | unknown[] | null

export interface AuditLogChanges {
  attributes: AuditStructuredValue
  old: AuditStructuredValue
}

export interface AuditLog {
  id: number
  logName: string
  event: string
  description: string
  batchUuid: string | null
  createdAt: string
  causer: AuditLogCauser | null
  subject: AuditLogSubject | null
  changes: AuditLogChanges | null
  metadata: Record<string, unknown> | null
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

export interface AuditLogFilterParams {
  keyword?: string
  log_name?: string
  event?: string
  causer_id?: number
  subject_type?: string
  subject_id?: number
  from_date?: string
  to_date?: string
}

export interface AuditLogListParams extends AuditLogFilterParams {
  page?: number
  per_page?: number
}

export type AuditLogExportParams = AuditLogFilterParams

export type AuditLogListResponse = PaginatedResponse<AuditLog>

export interface AuditLogDetailResponse {
  data: AuditLog
}
