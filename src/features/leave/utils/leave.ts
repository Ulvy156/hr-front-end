import axios from 'axios'

import { PERMISSIONS } from '@/constants/permissions'
import type { AuthUser } from '@/features/auth/interface/auth.interface'
import {
  hasUserAnyPermission,
  hasUserPermission,
} from '@/features/auth/utils/permissions'
import { canUseEmployeeSelfService } from '@/features/auth/utils/userContext'

import type {
  LeaveDuration,
  LeaveHalfDaySession,
  LeavePublicHoliday,
  LeaveRequest,
  LeaveRequestBalance,
  LeaveRequestFiltersState,
  LeaveRequestFormState,
  LeaveRequestStatus,
  LeaveType,
} from '../interface/leave.interface'
import {
  LEAVE_DURATION,
  LEAVE_HALF_DAY_SESSION,
  LEAVE_REQUEST_STATUS,
} from '../interface/leave.interface'

type LeaveTypeIdentifier = Pick<LeaveType, 'code' | 'label' | 'name'>

export const HALF_DAY_API_UNSUPPORTED_MESSAGE =
  'Half-day leave is not supported for this leave type.'

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

const toLocalDate = (value: string | null | undefined) => {
  if (!value) {
    return null
  }

  const parsedDate = new Date(`${value}T00:00:00`)

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

const toStartOfDayTimestamp = (value: string | null | undefined) => {
  const parsedDate = toLocalDate(value)

  return parsedDate ? parsedDate.getTime() : null
}

export const formatDateOnly = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${date.getFullYear()}-${month}-${day}`
}

export const buildPublicHolidayDateSet = (
  publicHolidays: LeavePublicHoliday[] | null | undefined,
) => {
  return new Set((publicHolidays ?? []).map((holiday) => holiday.holiday_date))
}

export const createDefaultLeaveFilters = (
  overrides?: Partial<LeaveRequestFiltersState>,
): LeaveRequestFiltersState => ({
  employee_id: '',
  type: '',
  status: '',
  date_range: null,
  page: 1,
  per_page: 15,
  ...overrides,
})

export const createEmptyLeaveRequestForm = (): LeaveRequestFormState => ({
  type: '',
  reason: '',
  duration_type: LEAVE_DURATION.FULL_DAY,
  start_date: '',
  end_date: '',
  half_day_session: '',
})

export const formatLeaveStatusLabel = (status: string | null | undefined) => {
  const normalizedStatus = status ?? 'unknown'

  if (normalizedStatus === LEAVE_REQUEST_STATUS.PENDING) {
    return 'Pending'
  }

  if (normalizedStatus === LEAVE_REQUEST_STATUS.MANAGER_APPROVED) {
    return 'Waiting for HR'
  }

  if (normalizedStatus === LEAVE_REQUEST_STATUS.HR_APPROVED || normalizedStatus === 'approved') {
    return 'Approved'
  }

  if (normalizedStatus === LEAVE_REQUEST_STATUS.REJECTED) {
    return 'Rejected'
  }

  if (normalizedStatus === LEAVE_REQUEST_STATUS.CANCELLED) {
    return 'Cancelled'
  }

  return normalizedStatus
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const formatLeaveApprovalStageLabel = (stage: string | null | undefined) => {
  if (!stage) {
    return '--'
  }

  if (stage === 'manager_review') {
    return 'Waiting for Manager'
  }

  if (stage === 'hr_review') {
    return 'Waiting for HR'
  }

  if (stage === 'completed') {
    return 'Completed'
  }

  return stage
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const formatLeaveApprovalProgressLabel = (status: string | null | undefined) => {
  if (!status) {
    return '--'
  }

  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const getLeaveStatusVariant = (status: LeaveRequestStatus | string | null | undefined) => {
  if (status === LEAVE_REQUEST_STATUS.HR_APPROVED || status === 'approved') {
    return 'success'
  }

  if (status === LEAVE_REQUEST_STATUS.PENDING) {
    return 'warning'
  }

  if (status === LEAVE_REQUEST_STATUS.MANAGER_APPROVED) {
    return 'primary'
  }

  if (status === LEAVE_REQUEST_STATUS.REJECTED || status === LEAVE_REQUEST_STATUS.CANCELLED) {
    return 'danger'
  }

  return 'default'
}

export const getAuthEmployeeId = (user: AuthUser | null | undefined) => {
  return user?.employee?.id ?? null
}

export const canCreateOwnLeaveRequest = (user: AuthUser | null | undefined) => {
  return (
    canUseEmployeeSelfService(user) &&
    hasUserPermission(user, PERMISSIONS.LEAVE_REQUEST_CREATE)
  )
}

export const canViewReviewQueue = (user: AuthUser | null | undefined) => {
  return hasUserAnyPermission(user, [
    PERMISSIONS.LEAVE_APPROVE_MANAGER,
    PERMISSIONS.LEAVE_REQUEST_VIEW_ASSIGNED,
    PERMISSIONS.LEAVE_REQUEST_VIEW_ANY,
    PERMISSIONS.LEAVE_APPROVE_HR,
  ])
}

export const canCancelLeaveRequest = (
  request: LeaveRequest,
  employeeId: number | null | undefined,
) => {
  if (!employeeId || request.employee_id !== employeeId) {
    return false
  }

  if (typeof request.cancelable === 'boolean') {
    return request.cancelable
  }

  return (
    request.status === LEAVE_REQUEST_STATUS.PENDING ||
    request.status === LEAVE_REQUEST_STATUS.MANAGER_APPROVED
  )
}

export const resolveManagerStepApproverEmployeeId = (request: LeaveRequest) => {
  return request.employee?.leave_approver_id ?? request.employee?.manager_id ?? null
}

export const canApproveManagerStep = (
  request: LeaveRequest,
  currentUser: AuthUser | null | undefined,
) => {
  const reviewerEmployeeId = getAuthEmployeeId(currentUser)
  const approverEmployeeId = resolveManagerStepApproverEmployeeId(request)

  if (
    !hasUserPermission(currentUser, PERMISSIONS.LEAVE_APPROVE_MANAGER) ||
    !reviewerEmployeeId ||
    !approverEmployeeId
  ) {
    return false
  }

  return (
    request.status === LEAVE_REQUEST_STATUS.PENDING &&
    request.approval_stage === 'manager_review' &&
    approverEmployeeId === reviewerEmployeeId &&
    request.employee_id !== reviewerEmployeeId
  )
}

export const canApproveHRStep = (
  request: LeaveRequest,
  currentUser: AuthUser | null | undefined,
) => {
  const reviewerEmployeeId = getAuthEmployeeId(currentUser)

  if (
    !hasUserPermission(currentUser, PERMISSIONS.LEAVE_APPROVE_HR) ||
    !reviewerEmployeeId ||
    request.employee_id === reviewerEmployeeId
  ) {
    return false
  }

  return (
    request.status === LEAVE_REQUEST_STATUS.MANAGER_APPROVED &&
    request.approval_stage === 'hr_review'
  )
}

export const canManagerReviewLeaveRequest = canApproveManagerStep

export const canHrReviewLeaveRequest = canApproveHRStep

export const getLatestBalanceSnapshot = (requests: LeaveRequest[] | null | undefined) => {
  return requests?.find((request) => request.balances.length > 0)?.balances ?? []
}

export const getLeaveRequestErrorMessage = (error: unknown, fallback = 'Something went wrong.') => {
  if (axios.isAxiosError(error)) {
    const errorMessage = error.response?.data?.message
    const validationErrors = error.response?.data?.errors

    if (validationErrors && typeof validationErrors === 'object') {
      const firstError = Object.values(validationErrors)
        .flat()
        .find((message): message is string => typeof message === 'string')

      if (firstError) {
        return firstError
      }
    }

    if (typeof errorMessage === 'string' && errorMessage.trim()) {
      return errorMessage
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}

export const getLeaveReviewDefaultStatus = (user: AuthUser | null | undefined) => {
  if (hasUserPermission(user, PERMISSIONS.LEAVE_APPROVE_HR)) {
    return LEAVE_REQUEST_STATUS.MANAGER_APPROVED
  }

  if (
    hasUserAnyPermission(user, [
      PERMISSIONS.LEAVE_APPROVE_MANAGER,
      PERMISSIONS.LEAVE_REQUEST_VIEW_ASSIGNED,
      PERMISSIONS.LEAVE_REQUEST_VIEW_ANY,
    ])
  ) {
    return LEAVE_REQUEST_STATUS.PENDING
  }

  return ''
}

export const formatLeaveDays = (value: number | null | undefined) => {
  return `${value ?? 0} day${value === 1 ? '' : 's'}`
}

export const isProbationEmploymentType = (employmentType: string | null | undefined) => {
  return employmentType === 'probation'
}

export const isFullTimeEmploymentType = (employmentType: string | null | undefined) => {
  return employmentType === 'full_time'
}

export const isAnnualLeaveType = (leaveType: LeaveType | null | undefined, typeCode?: string | null) => {
  const code = leaveType?.code ?? typeCode ?? ''

  return code === 'annual'
}

export const isSickLeaveType = (leaveType: LeaveType | null | undefined, typeCode?: string | null) => {
  const code = leaveType?.code ?? typeCode ?? ''

  return code === 'sick'
}

const normalizeLeaveTypeIdentifier = (value: string | null | undefined) => {
  return value?.trim().toLowerCase().replace(/[\s_-]+/g, ' ') ?? ''
}

export const isSpecialLeaveType = (
  leaveType: LeaveTypeIdentifier | null | undefined,
  typeCode?: string | null,
) => {
  const identifiers = [
    leaveType?.code,
    leaveType?.label,
    leaveType?.name,
    typeCode,
  ]
    .map((value) => normalizeLeaveTypeIdentifier(value))
    .filter(Boolean)

  return identifiers.some((value) => value === 'special' || value === 'special leave')
}

export const isMaternityLeaveType = (
  leaveType: LeaveTypeIdentifier | null | undefined,
  typeCode?: string | null,
) => {
  const identifiers = [
    leaveType?.code,
    leaveType?.label,
    leaveType?.name,
    typeCode,
  ]
    .map((value) => normalizeLeaveTypeIdentifier(value))
    .filter(Boolean)

  return identifiers.some((value) => value === 'maternity' || value === 'maternity leave')
}

export const isUnpaidLeaveType = (
  leaveType: LeaveTypeIdentifier | null | undefined,
  typeCode?: string | null,
) => {
  const identifiers = [
    leaveType?.code,
    leaveType?.label,
    leaveType?.name,
    typeCode,
  ]
    .map((value) => normalizeLeaveTypeIdentifier(value))
    .filter(Boolean)

  return identifiers.some(
    (value) =>
      value === 'unpaid' ||
      value === 'unpaid leave' ||
      value === 'leave without pay' ||
      value === 'without pay' ||
      value === 'lwop',
  )
}

export const usesAnnualAdvanceNoticeRules = (
  leaveType: LeaveType | null | undefined,
  typeCode?: string | null,
) => {
  return isAnnualLeaveType(leaveType, typeCode) || isUnpaidLeaveType(leaveType, typeCode)
}

export const resolveLeaveTypePaidStatus = (
  leaveType: LeaveType | null | undefined,
  typeCode?: string | null,
) => {
  if (isUnpaidLeaveType(leaveType, typeCode)) {
    return false
  }

  if (
    isSickLeaveType(leaveType, typeCode) ||
    isSpecialLeaveType(leaveType, typeCode) ||
    isMaternityLeaveType(leaveType, typeCode)
  ) {
    return true
  }

  if (leaveType) {
    return leaveType.is_paid
  }

  if (!typeCode) {
    return false
  }

  return true
}

export const getLeaveTypeCompensationLabel = (
  leaveType: LeaveType | null | undefined,
  typeCode?: string | null,
) => {
  if (isMaternityLeaveType(leaveType, typeCode)) {
    return '50% Salary'
  }

  return resolveLeaveTypePaidStatus(leaveType, typeCode) ? 'Paid' : 'Unpaid'
}

export const getLeaveTypeLimitLabel = (
  leaveType: LeaveType | null | undefined,
  typeCode?: string | null,
) => {
  if (isMaternityLeaveType(leaveType, typeCode)) {
    return 'Max 90 days/pregnancy'
  }

  const yearlyLimit = getLeaveTypeMaxDaysPerYear(leaveType, typeCode)

  if (!yearlyLimit) {
    return ''
  }

  return `Max ${yearlyLimit} days/year`
}

export const getLeaveTypeMaxDaysPerYear = (
  leaveType: LeaveType | null | undefined,
  typeCode?: string | null,
) => {
  if (typeof leaveType?.max_days_per_year === 'number' && leaveType.max_days_per_year > 0) {
    return leaveType.max_days_per_year
  }

  if (isSickLeaveType(leaveType, typeCode) || isSpecialLeaveType(leaveType, typeCode)) {
    return 7
  }

  return null
}

export const getLeaveTypeMaxDaysPerRequest = (
  leaveType: LeaveType | null | undefined,
  typeCode?: string | null,
) => {
  if (typeof leaveType?.max_days_per_request === 'number' && leaveType.max_days_per_request > 0) {
    return leaveType.max_days_per_request
  }

  if (isMaternityLeaveType(leaveType, typeCode)) {
    return 90
  }

  return null
}

export const getAnnualLeaveNoticeDays = (requestedDays: number) => {
  if (requestedDays > 4) {
    return 7
  }

  if (requestedDays > 2) {
    return 3
  }

  return 0
}

export const estimateLeaveDays = ({
  durationType,
  endDate,
  leaveType,
  startDate,
}: {
  durationType: LeaveDuration
  endDate: string
  leaveType: LeaveType | null | undefined
  startDate: string
}) => {
  if (durationType === LEAVE_DURATION.HALF_DAY) {
    return 0.5
  }

  const startTimestamp = toStartOfDayTimestamp(startDate)
  const endTimestamp = toStartOfDayTimestamp(endDate)

  if (startTimestamp === null || endTimestamp === null || endTimestamp < startTimestamp) {
    return 0
  }

  let totalDays = 0
  const currentDate = new Date(startTimestamp)
  const lastDate = new Date(endTimestamp)

  while (currentDate.getTime() <= lastDate.getTime()) {
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6

    if (!(leaveType?.auto_exclude_weekends && isWeekend)) {
      totalDays += 1
    }

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return totalDays
}

export const getDaysUntilDate = (startDate: string) => {
  const targetTimestamp = toStartOfDayTimestamp(startDate)

  if (targetTimestamp === null) {
    return null
  }

  const today = new Date()
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()

  return Math.floor((targetTimestamp - todayStart) / MILLISECONDS_PER_DAY)
}

export const getKnownBalanceForLeaveType = ({
  requests,
  typeCode,
  year,
}: {
  requests: LeaveRequest[] | null | undefined
  typeCode: string
  year: number
}) => {
  if (!requests?.length) {
    return null
  }

  for (const request of requests) {
    if (request.leave_type?.code !== typeCode) {
      continue
    }

    const matchingBalance = request.balances.find((balance) => balance.year === year)

    if (matchingBalance) {
      return matchingBalance
    }
  }

  return null
}

export const getLeaveDateYear = (value: string) => {
  const parsedDate = toLocalDate(value)

  return parsedDate ? parsedDate.getFullYear() : null
}

export const getLeavePolicyHighlights = (balances: LeaveRequestBalance[]) => {
  return balances.map((balance) => ({
    key: String(balance.year),
    label: `${balance.year}`,
    helper: `${balance.available_days} available`,
  }))
}

export const buildLeaveTypeOptionLabel = ({
  employmentType,
  leaveType,
}: {
  employmentType: string | null | undefined
  leaveType: LeaveType
}) => {
  const baseLabel = leaveType.label?.trim() || leaveType.name

  if (leaveType.is_requestable === false && leaveType.request_restriction_reason) {
    return `${baseLabel} (${leaveType.request_restriction_reason})`
  }

  if (isProbationEmploymentType(employmentType) && isAnnualLeaveType(leaveType)) {
    return `${baseLabel} (Not allowed during probation)`
  }

  return baseLabel
}

export const isLeaveTypeDisabledForEmployee = ({
  employmentType,
  leaveType,
}: {
  employmentType: string | null | undefined
  leaveType: LeaveType
}) => {
  return (
    leaveType.is_requestable === false ||
    (isProbationEmploymentType(employmentType) && isAnnualLeaveType(leaveType))
  )
}

export const getHalfDaySessionLabel = (value: LeaveHalfDaySession | '' | null | undefined) => {
  if (value === LEAVE_HALF_DAY_SESSION.AM) {
    return 'AM'
  }

  if (value === LEAVE_HALF_DAY_SESSION.PM) {
    return 'PM'
  }

  return '--'
}

export const formatLeaveDurationLabel = (value: LeaveDuration | string | null | undefined) => {
  if (!value) {
    return '--'
  }

  if (value === LEAVE_DURATION.FULL_DAY) {
    return 'Full Day'
  }

  if (value === LEAVE_DURATION.HALF_DAY) {
    return 'Half Day'
  }

  return formatLeaveApprovalProgressLabel(value)
}
