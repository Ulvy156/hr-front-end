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
  user_id: number
  department_id: number
  current_position_id: number
  manager_id: number | null
  first_name: string
  last_name: string
  email: string
  phone: string
  hire_date: string
  status: string
  created_at: string
  updated_at: string
  deleted_at: string | null
}

export interface AuthUserRole {
  id: number
  name: string
  description: string
  created_at: string
  updated_at: string
  deleted_at: string | null
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
