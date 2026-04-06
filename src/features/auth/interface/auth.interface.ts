import type {
  EmployeeAddress,
  EmployeeBranch,
  EmployeeDepartment,
  EmployeeEmergencyContact,
  EmployeePosition,
  EmployeePositionHistoryItem,
  EmployeeShift,
} from '@/features/employees/interface/employee.interface'

export interface LoginPayload {
  email: string
  password: string
}

export interface LoginResponse {
  token_type: string
  expires_in: number
  access_token: string
}

export interface AuthUserEmployee {
  id: number
  user_id?: number | null
  employee_code?: string | null
  full_name?: string | null
  first_name: string
  last_name: string
  email: string
  phone: string | null
  personal_phone?: string | null
  personal_email?: string | null
  gender?: string | null
  date_of_birth?: string | null
  hire_date: string | null
  employment_type?: string | null
  status: string
  profile_photo?: string | null
  profile_photo_path?: string | null
  department?: EmployeeDepartment | null
  branch?: EmployeeBranch | null
  current_position?: EmployeePosition | null
  manager?: { id: number; name: string } | null
  shift?: EmployeeShift | null
  addresses?: EmployeeAddress[]
  emergency_contacts?: EmployeeEmergencyContact[]
  employee_positions?: EmployeePositionHistoryItem[]
  educations?: Array<Record<string, unknown>>
  created_at?: string | null
  updated_at?: string | null
  deleted_at?: string | null
}

export interface AuthUserRole {
  id: number
  name: string
  description: string
  created_at?: string
  updated_at?: string
  deleted_at?: string | null
}

export interface AuthUser {
  id: number
  name: string
  email: string
  email_verified_at: string | null
  created_at: string
  updated_at: string
  employee: AuthUserEmployee | null
  roles: AuthUserRole[]
}

export interface AuthChangePasswordPayload {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

export interface AuthChangePasswordResponse {
  message: string
}

export interface AuthUserUpdatePayload {
  name: string
  email: string
  employee_id: number
}
