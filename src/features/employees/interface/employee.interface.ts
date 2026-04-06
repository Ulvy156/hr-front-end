export interface EmployeeDepartment {
  id: number
  name: string
}

export interface EmployeePosition {
  id: number
  title: string
}

export interface EmployeePositionListResponse {
  data: EmployeePosition[]
}

export interface EmployeeManager {
  id: number
  name: string
}

export interface EmployeeBranch {
  id: number
  name: string
  code: string
}

export interface EmployeeShift {
  id: number
  name: string
  code: string
  start_time: string
  end_time: string
  late_grace_minutes: number
}

export interface EmployeeUser {
  id: number
  name: string
  email: string
}

export interface EmployeeProvince {
  id: number
  source_id?: number | null
  code: string | null
  name_kh: string | null
  name_en: string | null
}

export interface EmployeeDistrict {
  id: number
  source_id?: number | null
  code: string | null
  name_kh: string | null
  name_en: string | null
  province_id?: number | null
  type: string | null
}

export interface EmployeeCommune {
  id: number
  source_id?: number | null
  code: string | null
  name_kh: string | null
  name_en: string | null
  district_id?: number | null
}

export interface EmployeeVillage {
  id: number
  source_id?: number | null
  code: string | null
  name_kh: string | null
  name_en: string | null
  commune_id?: number | null
  is_not_active?: boolean | null
}

export interface EmployeeAddress {
  id?: number
  address_type: string
  province_id: number | null
  district_id: number | null
  commune_id: number | null
  village_id: number | null
  address_line: string | null
  street: string | null
  house_no: string | null
  postal_code: string | null
  note: string | null
  is_primary: boolean
  province?: EmployeeProvince | null
  district?: EmployeeDistrict | null
  commune?: EmployeeCommune | null
  village?: EmployeeVillage | null
  created_at?: string | null
  updated_at?: string | null
}

export interface EmployeeLocationListResponse<T> {
  data: T[]
}

export interface EmployeeCollectionResponse<T> {
  data: T[]
}

export interface EmployeeEducation {
  id?: number
  institution_name: string
  education_level: string | null
  degree: string | null
  field_of_study: string | null
  start_date: string | null
  end_date: string | null
  graduation_year: number | null
  grade: string | null
  description: string | null
  created_at?: string | null
  updated_at?: string | null
}

export interface EmployeeEmergencyContact {
  id?: number
  name: string
  relationship: string | null
  phone: string
  email: string | null
  is_primary: boolean
  created_at?: string | null
  updated_at?: string | null
}

export interface EmployeePositionHistoryItem {
  id?: number
  position_id: number
  position: EmployeePosition | null
  base_salary: string | number
  start_date: string
  end_date: string | null
  is_current: boolean
  created_at?: string | null
  updated_at?: string | null
}

export interface EmployeeListItem {
  id: number
  employee_code: string | null
  first_name: string
  last_name: string
  full_name: string
  email: string
  phone: string
  profile_photo: string | null
  profile_photo_path: string | null
  hire_date: string | null
  employment_type: string | null
  status: string
  department: EmployeeDepartment | null
  current_position: EmployeePosition | null
  position: EmployeePosition | null
  manager: EmployeeManager | null
  branch: EmployeeBranch | null
  shift: EmployeeShift | null
  created_at: string | null
  updated_at: string | null
  deleted_at: string | null
}

export interface EmployeeDetail extends EmployeeListItem {
  user_id: number | null
  branch_id: number | null
  current_position_id: number | null
  shift_id: number | null
  manager_id: number | null
  date_of_birth: string | null
  gender: string | null
  personal_phone: string | null
  personal_email: string | null
  current_address: string | null
  permanent_address: string | null
  id_type: string | null
  id_number: string | null
  emergency_contact_name: string | null
  emergency_contact_relationship: string | null
  emergency_contact_phone: string | null
  confirmation_date: string | null
  termination_date: string | null
  last_working_date: string | null
  user?: EmployeeUser | null
  addresses?: EmployeeAddress[]
  educations?: EmployeeEducation[]
  emergency_contacts?: EmployeeEmergencyContact[]
  employee_positions?: EmployeePositionHistoryItem[]
}

export interface EmployeePaginationLink {
  url: string | null
  label: string
  active: boolean
}

export interface EmployeePaginationMetaLink {
  url: string | null
  label: string
  active: boolean
}

export interface EmployeePaginationMeta {
  current_page: number
  from: number | null
  last_page: number
  links: EmployeePaginationMetaLink[]
  path: string
  per_page: number
  to: number | null
  total: number
}

export interface EmployeeListResponse {
  data: EmployeeListItem[]
  links: {
    first: string | null
    last: string | null
    prev: string | null
    next: string | null
  }
  meta: EmployeePaginationMeta
}

export interface EmployeeListParams {
  search?: string
  status?: string
  department_id?: number
  branch_id?: number
  current_position_id?: number
  manager_id?: number
  employment_type?: string
  hire_date_from?: string
  hire_date_to?: string
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
  page?: number
  per_page?: number
  include?: string[] | string
}

export interface EmployeeShowParams {
  include?: string[] | string
}

export interface EmployeeExportParams {
  search?: string
  status?: string
  department_id?: number
  branch_id?: number
  current_position_id?: number
  manager_id?: number
  employment_type?: string
  hire_date_from?: string
  hire_date_to?: string
  sort_by?: string
  sort_direction?: 'asc' | 'desc'
}

export interface EmployeeFormEducationPayload {
  institution_name: string
  education_level?: string | null
  degree?: string | null
  field_of_study?: string | null
  start_date?: string | null
  end_date?: string | null
  graduation_year?: number | null
  grade?: string | null
  description?: string | null
}

export interface EmployeeFormAddressPayload {
  address_type: string
  province_id?: number | null
  district_id?: number | null
  commune_id?: number | null
  village_id?: number | null
  address_line?: string | null
  street?: string | null
  house_no?: string | null
  postal_code?: string | null
  note?: string | null
  is_primary?: boolean | null
}

export interface EmployeeFormEmergencyContactPayload {
  name: string
  relationship: string
  phone: string
  email?: string | null
  is_primary?: boolean | null
}

export interface EmployeeFormPositionPayload {
  position_id: number
  base_salary: number
  start_date: string
  end_date?: string | null
}

export interface EmployeeTerminatePayload {
  termination_date?: string | null
  last_working_date?: string | null
}

export interface EmployeeUpsertPayload {
  user_id?: number | null
  employee_code?: string | null
  department_id?: number | null
  branch_id?: number | null
  current_position_id?: number | null
  position_id?: number | null
  shift_id?: number | null
  manager_id?: number | null
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  date_of_birth?: string | null
  gender?: string | null
  personal_phone?: string | null
  personal_email?: string | null
  current_address?: string | null
  permanent_address?: string | null
  id_type?: string | null
  id_number?: string | null
  emergency_contact_name?: string | null
  emergency_contact_relationship?: string | null
  emergency_contact_phone?: string | null
  profile_photo?: string | null
  profile_photo_path?: string | null
  hire_date?: string
  employment_type?: string | null
  confirmation_date?: string | null
  termination_date?: string | null
  last_working_date?: string | null
  status?: string
  include?: string[]
  addresses?: EmployeeFormAddressPayload[]
  emergency_contacts?: EmployeeFormEmergencyContactPayload[]
  educations?: EmployeeFormEducationPayload[]
  employee_positions?: EmployeeFormPositionPayload[]
}

export interface EmployeeProfilePhotoUploadResponse {
  message: string
  employee: EmployeeDetail
}

export interface EmployeeListFiltersState {
  search: string
  status: string
  department_id: string
  current_position_id: string
  manager_id: string
  employment_type: string
  hire_date_range: [string, string] | null
  sort_by: string
  sort_direction: 'asc' | 'desc'
  page: number
  per_page: number
}
