import type {
  EmployeeDepartment,
  EmployeePosition,
} from '@/features/employees/interface/employee.interface'

export interface UserRole {
  id: number
  name: string
  description: string
  permissions?: Array<UserPermission | string>
}

export interface UserPermission {
  id?: number
  name: string
  description?: string | null
}

export interface AvailableEmployeeUser {
  id: number
  name: string
  email: string
  roles: UserRole[]
}

export interface UserEmployeeSummary {
  id: number
  employee_code: string | null
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string | null
  hire_date: string | null
  employment_type: string | null
  status: string | null
  department: EmployeeDepartment | null
  current_position: EmployeePosition | null
  created_at: string | null
  updated_at: string | null
}

export interface UserAccount {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  employee_id: number | null
  employee: UserEmployeeSummary | null
  roles: UserRole[]
  permissions?: Array<UserPermission | string> | null
  created_at: string | null
  updated_at: string | null
}

export interface UserPaginationMetaLink {
  url: string | null
  label: string
  active: boolean
}

export interface UserPaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  links: UserPaginationMetaLink[]
  path: string
  per_page: number
  to: number | null
  total: number
}

export interface UserListResponse {
  data: UserAccount[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: UserPaginationMeta
}

export interface AvailableEmployeeUserListResponse {
  data: AvailableEmployeeUser[]
}

export interface UserRoleListResponse {
  data: UserRole[]
}

export interface UserAccessSummary {
  id: number
  name: string
  email: string
  employee_id: number | null
  employee: UserEmployeeSummary | null
  roles: UserRole[]
  direct_permissions: string[]
  role_permissions: string[]
  effective_permissions: string[]
  created_at: string | null
  updated_at: string | null
}

export interface UserPermissionsUpdatePayload {
  permissions: string[]
}

export interface UserAccessUpdatePayload {
  roles?: string[]
  permissions?: string[]
}

export interface UserListParams {
  search?: string
  role_id?: number
  employee_status?: string
  employee_id?: number
  per_page?: number
}

export interface UserCreatePayload {
  name: string
  email: string
  password: string
  employee_id?: number
  role_ids: number[]
}

export interface UserUpdatePayload {
  name: string
  email: string
  employee_id: number
  role_ids: number[]
}

export interface UserResetPasswordPayload {
  new_password: string
  new_password_confirmation: string
}

export interface UserActionResponse {
  message: string
}

export interface UserFiltersState {
  search: string
  role_id: string
  employee_status: string
  employee_id: string
  per_page: number
}
