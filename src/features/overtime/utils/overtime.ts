import axios from 'axios'

import type {
  OvertimeApprovalStage,
  OvertimeRequest,
  OvertimeRequestFiltersState,
  OvertimeRequestStatus,
  OvertimeType,
} from '../interface/overtime.interface'
import {
  OVERTIME_APPROVAL_STAGE,
  OVERTIME_REQUEST_STATUS,
  OVERTIME_TYPE,
} from '../interface/overtime.interface'

type OvertimeRequestErrorPayload = {
  message?: string
  errors?: Record<string, string[]>
}

export const createDefaultOvertimeFilters = (
  overrides?: Partial<OvertimeRequestFiltersState>,
): OvertimeRequestFiltersState => ({
  employee_id: '',
  status: '',
  approval_stage: '',
  overtime_type: '',
  date_range: null,
  page: 1,
  per_page: 15,
  ...overrides,
})

export const formatOvertimeStatusLabel = (
  status: OvertimeRequestStatus | string | null | undefined,
  statusLabel?: string | null,
) => {
  if (statusLabel?.trim()) {
    return statusLabel
  }

  if (!status) {
    return '--'
  }

  if (status === OVERTIME_REQUEST_STATUS.PENDING) {
    return 'Pending'
  }

  if (status === OVERTIME_REQUEST_STATUS.APPROVED) {
    return 'Approved'
  }

  if (status === OVERTIME_REQUEST_STATUS.REJECTED) {
    return 'Rejected'
  }

  if (status === OVERTIME_REQUEST_STATUS.CANCELLED) {
    return 'Cancelled'
  }

  return status
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export const getOvertimeStatusVariant = (
  status: OvertimeRequestStatus | string | null | undefined,
) => {
  if (status === OVERTIME_REQUEST_STATUS.APPROVED) {
    return 'success'
  }

  if (status === OVERTIME_REQUEST_STATUS.PENDING) {
    return 'warning'
  }

  if (status === OVERTIME_REQUEST_STATUS.REJECTED || status === OVERTIME_REQUEST_STATUS.CANCELLED) {
    return 'danger'
  }

  return 'default'
}

export const formatOvertimeApprovalStageLabel = (
  stage: OvertimeApprovalStage | string | null | undefined,
  stageLabel?: string | null,
) => {
  if (stageLabel?.trim()) {
    return stageLabel
  }

  if (!stage) {
    return '--'
  }

  if (stage === OVERTIME_APPROVAL_STAGE.MANAGER_REVIEW) {
    return 'Manager Review'
  }

  if (stage === OVERTIME_APPROVAL_STAGE.COMPLETED) {
    return 'Completed'
  }

  return stage
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export const formatOvertimeTypeLabel = (
  overtimeType: OvertimeType | string | null | undefined,
  overtimeTypeLabel?: string | null,
) => {
  if (overtimeTypeLabel?.trim()) {
    return overtimeTypeLabel
  }

  if (!overtimeType) {
    return '--'
  }

  if (overtimeType === OVERTIME_TYPE.NORMAL) {
    return 'Normal'
  }

  if (overtimeType === OVERTIME_TYPE.WEEKEND) {
    return 'Weekend'
  }

  if (overtimeType === OVERTIME_TYPE.HOLIDAY) {
    return 'Holiday'
  }

  return overtimeType
    .split('_')
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ')
}

export const getOvertimeTypeVariant = (overtimeType: OvertimeType | string | null | undefined) => {
  if (overtimeType === OVERTIME_TYPE.HOLIDAY) {
    return 'danger'
  }

  if (overtimeType === OVERTIME_TYPE.WEEKEND) {
    return 'warning'
  }

  if (overtimeType === OVERTIME_TYPE.NORMAL) {
    return 'primary'
  }

  return 'default'
}

export const formatOvertimeDuration = (
  hours: number | null | undefined,
  minutes: number | null | undefined,
) => {
  if (
    typeof minutes === 'number' &&
    Number.isFinite(minutes) &&
    typeof hours === 'number' &&
    Number.isFinite(hours)
  ) {
    return `${formatOvertimeHours(hours)} (${minutes} min)`
  }

  if (typeof hours === 'number' && Number.isFinite(hours)) {
    return formatOvertimeHours(hours)
  }

  if (typeof minutes === 'number' && Number.isFinite(minutes)) {
    return `${minutes} min`
  }

  return '--'
}

export const formatOvertimeHours = (value: number | null | undefined) => {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '--'
  }

  const formattedValue = value.toLocaleString('en-US', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 2,
  })

  return `${formattedValue} hr${value === 1 ? '' : 's'}`
}

export const canCancelOvertimeRequest = (request: OvertimeRequest) => {
  return request.cancelable || request.status === OVERTIME_REQUEST_STATUS.PENDING
}

export const isOvertimeRequestPending = (request: OvertimeRequest) => {
  return request.status === OVERTIME_REQUEST_STATUS.PENDING
}

export const matchesOvertimeFilters = (
  request: OvertimeRequest,
  filters: OvertimeRequestFiltersState,
) => {
  if (
    filters.employee_id.trim() &&
    Number.isFinite(Number(filters.employee_id)) &&
    request.employee_id !== Number(filters.employee_id)
  ) {
    return false
  }

  if (filters.status && request.status !== filters.status) {
    return false
  }

  if (filters.approval_stage && request.approval_stage !== filters.approval_stage) {
    return false
  }

  if (filters.overtime_type && request.overtime_type !== filters.overtime_type) {
    return false
  }

  if (filters.date_range?.[0] && request.overtime_date < filters.date_range[0]) {
    return false
  }

  if (filters.date_range?.[1] && request.overtime_date > filters.date_range[1]) {
    return false
  }

  return true
}

export const getOvertimeRequestErrorMessage = (
  error: unknown,
  fallback = 'Overtime request failed. Please try again.',
) => {
  if (axios.isAxiosError<OvertimeRequestErrorPayload>(error)) {
    const payload = error.response?.data

    if (payload?.errors && typeof payload.errors === 'object') {
      const firstValidationMessage = Object.values(payload.errors)
        .flat()
        .find((message): message is string => typeof message === 'string' && message.trim() !== '')

      if (firstValidationMessage) {
        return firstValidationMessage
      }
    }

    if (typeof payload?.message === 'string' && payload.message.trim()) {
      return payload.message
    }

    if (error.response?.status === 403) {
      return 'You do not have permission to perform this overtime action.'
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message
  }

  return fallback
}
