import type {
  EmployeeFormAddressPayload,
  EmployeeDetail,
  EmployeeFormEducationPayload,
  EmployeeFormEmergencyContactPayload,
  EmployeeFormPositionPayload,
  EmployeeListFiltersState,
  EmployeeUpsertPayload,
} from '../interface/employee.interface'
import axios from 'axios'

export const EMPLOYEE_SHOW_INCLUDES = [
  'addresses',
  'educations',
  'emergency_contacts',
  'employee_positions',
  'user',
] as const

export const createDefaultEmployeeFilters = (): EmployeeListFiltersState => ({
  search: '',
  status: '',
  department_id: '',
  current_position_id: '',
  manager_id: '',
  employment_type: '',
  hire_date_range: null,
  sort_by: 'created_at',
  sort_direction: 'desc',
  page: 1,
  per_page: 10,
})

export const formatEmployeeStatus = (value: string | null | undefined) => {
  if (!value) return '--'

  const uppercaseWords = new Set(['id', 'hr', 'gpa', 'ot'])

  return value
    .split('_')
    .map((word) => {
      const normalizedWord = word.toLowerCase()

      if (uppercaseWords.has(normalizedWord)) {
        return normalizedWord.toUpperCase()
      }

      return normalizedWord.charAt(0).toUpperCase() + normalizedWord.slice(1)
    })
    .join(' ')
}

export const formatEmployeeDate = (value: string | null | undefined) => {
  if (!value) return '--'

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleDateString()
}

type EmployeeRequestErrorPayload = {
  message?: string
  errors?: Record<string, string[]>
}

export const getEmployeeRequestErrorMessage = (
  error: unknown,
  fallback = 'Employee request failed. Please try again.',
) => {
  if (axios.isAxiosError<EmployeeRequestErrorPayload>(error)) {
    const errorPayload = error.response?.data
    const firstValidationMessage = errorPayload?.errors
      ? Object.values(errorPayload.errors).flat()[0]
      : null

    return firstValidationMessage ?? errorPayload?.message ?? fallback
  }

  return fallback
}

export const getEmployeeSuccessMessage = (
  response: unknown,
  fallback: string,
) => {
  if (
    response &&
    typeof response === 'object' &&
    'message' in response &&
    typeof response.message === 'string' &&
    response.message.trim()
  ) {
    return response.message
  }

  return fallback
}

export const getEmployeeInitials = (name: string | null | undefined) => {
  if (!name) return 'NA'

  const words = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (!words.length) return 'NA'

  return words.map((word) => word.charAt(0).toUpperCase()).join('')
}

const normalizeOptionalString = (value: string) => {
  const trimmed = value.trim()

  return trimmed ? trimmed : null
}

const normalizeOptionalNumber = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)

  return Number.isFinite(parsed) ? parsed : null
}

export type EmployeeFormState = {
  user_id: string
  employee_code: string
  department_id: string
  branch_id: string
  current_position_id: string
  shift_id: string
  manager_id: string
  first_name: string
  last_name: string
  email: string
  phone: string
  date_of_birth: string
  gender: string
  personal_phone: string
  personal_email: string
  current_address: string
  permanent_address: string
  id_type: string
  id_number: string
  emergency_contact_name: string
  emergency_contact_relationship: string
  emergency_contact_phone: string
  hire_date: string
  employment_type: string
  confirmation_date: string
  termination_date: string
  last_working_date: string
  status: string
  emergency_contacts: Array<{
    name: string
    relationship: string
    phone: string
    email: string
    is_primary: boolean
  }>
  addresses: Array<{
    address_type: string
    province_id: string
    district_id: string
    commune_id: string
    village_id: string
    address_line: string
    street: string
    house_no: string
    postal_code: string
    note: string
    is_primary: boolean
  }>
  educations: Array<{
    institution_name: string
    education_level: string
    degree: string
    field_of_study: string
    start_date: string
    end_date: string
    graduation_year: string
    grade: string
    description: string
  }>
  employee_positions: Array<{
    position_id: string
    base_salary: string
    start_date: string
    end_date: string
  }>
}

export const createEmptyEmployeeForm = (): EmployeeFormState => ({
  user_id: '',
  employee_code: '',
  department_id: '',
  branch_id: '',
  current_position_id: '',
  shift_id: '',
  manager_id: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  gender: '',
  personal_phone: '',
  personal_email: '',
  current_address: '',
  permanent_address: '',
  id_type: '',
  id_number: '',
  emergency_contact_name: '',
  emergency_contact_relationship: '',
  emergency_contact_phone: '',
  hire_date: '',
  employment_type: '',
  confirmation_date: '',
  termination_date: '',
  last_working_date: '',
  status: 'active',
  addresses: [],
  emergency_contacts: [],
  educations: [],
  employee_positions: [],
})

export const createEmptyEmergencyContact = (): EmployeeFormState['emergency_contacts'][number] => ({
  name: '',
  relationship: '',
  phone: '',
  email: '',
  is_primary: false,
})

export const createEmptyAddress = (): EmployeeFormState['addresses'][number] => ({
  address_type: '',
  province_id: '',
  district_id: '',
  commune_id: '',
  village_id: '',
  address_line: '',
  street: '',
  house_no: '',
  postal_code: '',
  note: '',
  is_primary: false,
})

export const createEmptyEducation = (): EmployeeFormState['educations'][number] => ({
  institution_name: '',
  education_level: '',
  degree: '',
  field_of_study: '',
  start_date: '',
  end_date: '',
  graduation_year: '',
  grade: '',
  description: '',
})

export const createEmptyEmployeePosition =
  (): EmployeeFormState['employee_positions'][number] => ({
    position_id: '',
    base_salary: '',
    start_date: '',
    end_date: '',
  })

const parseDateValue = (value: string) => {
  if (!value.trim()) {
    return null
  }

  const parsed = new Date(`${value}T00:00:00`)

  return Number.isNaN(parsed.getTime()) ? null : parsed
}

const rangesOverlap = (
  leftStartDate: Date,
  leftEndDate: Date | null,
  rightStartDate: Date,
  rightEndDate: Date | null,
) => {
  const leftStartTime = leftStartDate.getTime()
  const leftEndTime = leftEndDate?.getTime() ?? Number.POSITIVE_INFINITY
  const rightStartTime = rightStartDate.getTime()
  const rightEndTime = rightEndDate?.getTime() ?? Number.POSITIVE_INFINITY

  return leftStartTime <= rightEndTime && rightStartTime <= leftEndTime
}

export const isEmployeePositionDateRangeAvailable = (
  positions: EmployeeFormState['employee_positions'],
  targetIndex: number,
  startValue: string,
  endValue: string,
) => {
  const startDate = parseDateValue(startValue)

  if (!startDate) {
    return true
  }

  const endDate = parseDateValue(endValue)

  if (endDate && endDate < startDate) {
    return false
  }

  return positions.every((position, index) => {
    if (index === targetIndex) {
      return true
    }

    const otherStartDate = parseDateValue(position.start_date)

    if (!otherStartDate) {
      return true
    }

    const otherEndDate = parseDateValue(position.end_date)

    return !rangesOverlap(startDate, endDate, otherStartDate, otherEndDate)
  })
}

export const isEmployeeEducationDateRangeAvailable = (
  educations: EmployeeFormState['educations'],
  targetIndex: number,
  startValue: string,
  endValue: string,
) => {
  const startDate = parseDateValue(startValue)

  if (!startDate) {
    return true
  }

  const endDate = parseDateValue(endValue)

  if (endDate && endDate < startDate) {
    return false
  }

  return educations.every((education, index) => {
    if (index === targetIndex) {
      return true
    }

    const otherStartDate = parseDateValue(education.start_date)

    if (!otherStartDate) {
      return true
    }

    const otherEndDate = parseDateValue(education.end_date)

    return !rangesOverlap(startDate, endDate, otherStartDate, otherEndDate)
  })
}

export const validateEmployeeEmergencyContacts = (
  emergencyContacts: EmployeeFormState['emergency_contacts'],
) => {
  const filledContacts = emergencyContacts
    .map((contact, index) => ({ ...contact, index }))
    .filter((contact) => contact.name.trim() || contact.phone.trim() || contact.relationship.trim())

  const usedPhones = new Map<string, number>()

  for (const contact of filledContacts) {
    const phone = contact.phone.trim()

    if (!phone) {
      continue
    }

    const existingIndex = usedPhones.get(phone)

    if (existingIndex !== undefined) {
      return `Emergency contact phone numbers must be unique. Rows ${existingIndex + 1} and ${contact.index + 1} use the same phone number.`
    }

    usedPhones.set(phone, contact.index)
  }

  const primaryContacts = filledContacts.filter((contact) => contact.is_primary)

  if (primaryContacts.length > 1) {
    return `Only one emergency contact can be marked as primary.`
  }

  return null
}

export const validateEmployeeAddresses = (addresses: EmployeeFormState['addresses']) => {
  const filledAddresses = addresses
    .map((address, index) => ({ ...address, index }))
    .filter(
      (address) =>
        address.address_type.trim() ||
        address.address_line.trim() ||
        address.street.trim() ||
        address.house_no.trim() ||
        address.postal_code.trim() ||
        address.note.trim() ||
        address.province_id.trim() ||
        address.district_id.trim() ||
        address.commune_id.trim() ||
        address.village_id.trim(),
    )

  const primaryAddresses = filledAddresses.filter((address) => address.is_primary)

  if (primaryAddresses.length > 1) {
    return 'Only one address can be marked as primary.'
  }

  for (const address of filledAddresses) {
    if (!address.address_type.trim()) {
      return `Address row ${address.index + 1}: Address Type is required.`
    }

    if (!address.province_id.trim()) {
      return `Address row ${address.index + 1}: Province is required.`
    }

    if (!address.district_id.trim()) {
      return `Address row ${address.index + 1}: District is required.`
    }

    if (!address.commune_id.trim()) {
      return `Address row ${address.index + 1}: Commune is required.`
    }

    if (!address.village_id.trim()) {
      return `Address row ${address.index + 1}: Village is required.`
    }
  }

  return null
}

export const validateEmployeeEducationHistory = (
  educations: EmployeeFormState['educations'],
) => {
  const filledEducations = educations
    .map((education, index) => ({ ...education, index }))
    .filter(
      (education) =>
        education.institution_name.trim() ||
        education.education_level.trim() ||
        education.start_date.trim(),
    )

  const usedEducationLevels = new Map<string, number>()

  for (const education of filledEducations) {
    const educationLevel = education.education_level.trim()

    if (educationLevel) {
      const existingIndex = usedEducationLevels.get(educationLevel)

      if (existingIndex !== undefined) {
        return `Education Level cannot be duplicated. Rows ${existingIndex + 1} and ${education.index + 1} use the same level.`
      }

      usedEducationLevels.set(educationLevel, education.index)
    }

    const startDate = parseDateValue(education.start_date)
    const endDate = parseDateValue(education.end_date)

    if (startDate && endDate && endDate < startDate) {
      return `Education row ${education.index + 1}: End Date cannot be before Start Date.`
    }
  }

  const normalizedPeriods = filledEducations
    .map((education) => ({
      index: education.index,
      startDate: parseDateValue(education.start_date),
      endDate: parseDateValue(education.end_date),
    }))
    .filter(
      (
        education,
      ): education is {
        index: number
        startDate: Date
        endDate: Date | null
      } => Boolean(education.startDate),
    )
    .sort((left, right) => left.startDate.getTime() - right.startDate.getTime())

  for (const [index, current] of normalizedPeriods.entries()) {
    for (const next of normalizedPeriods.slice(index + 1)) {
      if (rangesOverlap(current.startDate, current.endDate, next.startDate, next.endDate)) {
        return `Education rows ${current.index + 1} and ${next.index + 1} overlap. Update the dates so each education period stays separate.`
      }
    }
  }

  return null
}

export const validateEmployeePositionHistory = (
  positions: EmployeeFormState['employee_positions'],
) => {
  const filledPositions = positions
    .map((position, index) => ({ ...position, index }))
    .filter(
      (position) =>
        position.position_id.trim() || position.base_salary.trim() || position.start_date.trim(),
    )

  const openEndedPositions = filledPositions.filter((position) => !position.end_date.trim())

  if (openEndedPositions.length > 1) {
    return `Only one current position can be left open. Close the earlier job history row before adding another current position.`
  }

  for (const position of filledPositions) {
    const startDate = parseDateValue(position.start_date)
    const endDate = parseDateValue(position.end_date)

    if (startDate && endDate && endDate < startDate) {
      return `Job History row ${position.index + 1}: End Date cannot be before Start Date.`
    }
  }

  const normalizedPeriods = filledPositions
    .map((position) => ({
      index: position.index,
      startDate: parseDateValue(position.start_date),
      endDate: parseDateValue(position.end_date),
    }))
    .filter(
      (
        position,
      ): position is {
        index: number
        startDate: Date
        endDate: Date | null
      } => Boolean(position.startDate),
    )
    .sort((left, right) => left.startDate.getTime() - right.startDate.getTime())

  for (const [index, current] of normalizedPeriods.entries()) {
    for (const next of normalizedPeriods.slice(index + 1)) {
      if (rangesOverlap(current.startDate, current.endDate, next.startDate, next.endDate)) {
        return `Job History rows ${current.index + 1} and ${next.index + 1} overlap. Update the dates so each position period stays separate.`
      }
    }
  }

  return null
}

export const populateEmployeeForm = (employee: EmployeeDetail): EmployeeFormState => ({
  user_id: employee.user_id ? String(employee.user_id) : '',
  employee_code: employee.employee_code ?? '',
  department_id: employee.department?.id ? String(employee.department.id) : '',
  branch_id: employee.branch_id ? String(employee.branch_id) : '',
  current_position_id: employee.current_position_id ? String(employee.current_position_id) : '',
  shift_id: employee.shift_id ? String(employee.shift_id) : '',
  manager_id: employee.manager_id ? String(employee.manager_id) : '',
  first_name: employee.first_name ?? '',
  last_name: employee.last_name ?? '',
  email: employee.email ?? '',
  phone: employee.phone ?? '',
  date_of_birth: employee.date_of_birth ? employee.date_of_birth.slice(0, 10) : '',
  gender: employee.gender ?? '',
  personal_phone: employee.personal_phone ?? '',
  personal_email: employee.personal_email ?? '',
  current_address: employee.current_address ?? '',
  permanent_address: employee.permanent_address ?? '',
  id_type: employee.id_type ?? '',
  id_number: employee.id_number ?? '',
  emergency_contact_name: employee.emergency_contact_name ?? '',
  emergency_contact_relationship: employee.emergency_contact_relationship ?? '',
  emergency_contact_phone: employee.emergency_contact_phone ?? '',
  hire_date: employee.hire_date ?? '',
  employment_type: employee.employment_type ?? '',
  confirmation_date: employee.confirmation_date ? employee.confirmation_date.slice(0, 10) : '',
  termination_date: employee.termination_date ? employee.termination_date.slice(0, 10) : '',
  last_working_date: employee.last_working_date ? employee.last_working_date.slice(0, 10) : '',
  status: employee.status ?? 'active',
  addresses:
    employee.addresses?.map((address) => ({
      address_type: address.address_type ?? '',
      province_id: address.province_id ? String(address.province_id) : '',
      district_id: address.district_id ? String(address.district_id) : '',
      commune_id: address.commune_id ? String(address.commune_id) : '',
      village_id: address.village_id ? String(address.village_id) : '',
      address_line: address.address_line ?? '',
      street: address.street ?? '',
      house_no: address.house_no ?? '',
      postal_code: address.postal_code ?? '',
      note: address.note ?? '',
      is_primary: Boolean(address.is_primary),
    })) ?? [],
  emergency_contacts:
    employee.emergency_contacts?.map((contact) => ({
      name: contact.name ?? '',
      relationship: contact.relationship ?? '',
      phone: contact.phone ?? '',
      email: contact.email ?? '',
      is_primary: Boolean(contact.is_primary),
    })) ?? [],
  educations:
    employee.educations?.map((education) => ({
      institution_name: education.institution_name ?? '',
      education_level: education.education_level ?? '',
      degree: education.degree ?? '',
      field_of_study: education.field_of_study ?? '',
      start_date: education.start_date ?? '',
      end_date: education.end_date ?? '',
      graduation_year:
        education.graduation_year !== null && education.graduation_year !== undefined
          ? String(education.graduation_year)
          : '',
      grade: education.grade ?? '',
      description: education.description ?? '',
    })) ?? [],
  employee_positions:
    employee.employee_positions?.map((position) => ({
      position_id: position.position_id ? String(position.position_id) : '',
      base_salary: position.base_salary ? String(position.base_salary) : '',
      start_date: position.start_date ?? '',
      end_date: position.end_date ?? '',
    })) ?? [],
})

export const buildEmployeeUpsertPayload = (form: EmployeeFormState): EmployeeUpsertPayload => {
  const addresses: EmployeeFormAddressPayload[] = form.addresses
    .filter(
      (address) =>
        address.address_type.trim() ||
        address.address_line.trim() ||
        address.street.trim() ||
        address.house_no.trim() ||
        address.postal_code.trim() ||
        address.note.trim() ||
        address.province_id.trim() ||
        address.district_id.trim() ||
        address.commune_id.trim() ||
        address.village_id.trim(),
    )
    .map((address) => ({
      address_type: address.address_type.trim(),
      province_id: normalizeOptionalNumber(address.province_id),
      district_id: normalizeOptionalNumber(address.district_id),
      commune_id: normalizeOptionalNumber(address.commune_id),
      village_id: normalizeOptionalNumber(address.village_id),
      address_line: normalizeOptionalString(address.address_line),
      street: normalizeOptionalString(address.street),
      house_no: normalizeOptionalString(address.house_no),
      postal_code: normalizeOptionalString(address.postal_code),
      note: normalizeOptionalString(address.note),
      is_primary: address.is_primary,
    }))

  const emergencyContacts: EmployeeFormEmergencyContactPayload[] = form.emergency_contacts
    .filter((contact) => contact.name.trim() || contact.phone.trim() || contact.relationship.trim())
    .map((contact) => ({
      name: contact.name.trim(),
      relationship: contact.relationship.trim(),
      phone: contact.phone.trim(),
      email: normalizeOptionalString(contact.email),
      is_primary: contact.is_primary,
    }))

  const educations: EmployeeFormEducationPayload[] = form.educations
    .filter((education) => education.institution_name.trim())
    .map((education) => ({
      institution_name: education.institution_name.trim(),
      education_level: normalizeOptionalString(education.education_level),
      degree: normalizeOptionalString(education.degree),
      field_of_study: normalizeOptionalString(education.field_of_study),
      start_date: normalizeOptionalString(education.start_date),
      end_date: normalizeOptionalString(education.end_date),
      graduation_year: normalizeOptionalNumber(education.graduation_year),
      grade: normalizeOptionalString(education.grade),
      description: normalizeOptionalString(education.description),
    }))

  const employeePositions: EmployeeFormPositionPayload[] = form.employee_positions
    .filter((position) => position.position_id.trim() || position.base_salary.trim() || position.start_date.trim())
    .map((position) => ({
      position_id: Number(position.position_id),
      base_salary: Number(position.base_salary),
      start_date: position.start_date,
      end_date: normalizeOptionalString(position.end_date),
    }))

  return {
    user_id: normalizeOptionalNumber(form.user_id),
    employee_code: normalizeOptionalString(form.employee_code),
    department_id: normalizeOptionalNumber(form.department_id),
    branch_id: normalizeOptionalNumber(form.branch_id),
    current_position_id: normalizeOptionalNumber(form.current_position_id),
    position_id: normalizeOptionalNumber(form.current_position_id),
    shift_id: normalizeOptionalNumber(form.shift_id),
    manager_id: normalizeOptionalNumber(form.manager_id),
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    email: form.email.trim(),
    phone: form.phone.trim(),
    date_of_birth: normalizeOptionalString(form.date_of_birth),
    gender: normalizeOptionalString(form.gender),
    personal_phone: normalizeOptionalString(form.personal_phone),
    personal_email: normalizeOptionalString(form.personal_email),
    current_address: normalizeOptionalString(form.current_address),
    permanent_address: normalizeOptionalString(form.permanent_address),
    id_type: normalizeOptionalString(form.id_type),
    id_number: normalizeOptionalString(form.id_number),
    emergency_contact_name: normalizeOptionalString(form.emergency_contact_name),
    emergency_contact_relationship: normalizeOptionalString(form.emergency_contact_relationship),
    emergency_contact_phone: normalizeOptionalString(form.emergency_contact_phone),
    hire_date: form.hire_date,
    employment_type: normalizeOptionalString(form.employment_type),
    confirmation_date: normalizeOptionalString(form.confirmation_date),
    termination_date: normalizeOptionalString(form.termination_date),
    last_working_date: normalizeOptionalString(form.last_working_date),
    status: form.status,
    include: ['addresses', 'emergency_contacts', 'educations', 'employee_positions'],
    addresses,
    emergency_contacts: emergencyContacts,
    educations,
    employee_positions: employeePositions,
  }
}
