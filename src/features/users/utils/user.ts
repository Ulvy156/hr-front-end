import axios from 'axios'

import type { UserFiltersState } from '../interface/user.interface'

type UserRequestErrorPayload = {
  message?: string
  errors?: Record<string, string[]>
}

export const createDefaultUserFilters = (): UserFiltersState => ({
  search: '',
  role_id: '',
  employee_status: '',
  employee_id: '',
  per_page: 10,
})

export const formatUserDate = (value: string | null | undefined) => {
  if (!value) return '--'

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString()
}

export const formatUserLabel = (value: string | null | undefined) => {
  if (!value) return '--'

  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const getUserRequestErrorMessage = (
  error: unknown,
  fallback = 'User request failed. Please try again.',
) => {
  if (axios.isAxiosError<UserRequestErrorPayload>(error)) {
    const payload = error.response?.data
    const firstValidationMessage = payload?.errors
      ? Object.values(payload.errors).flat()[0]
      : null

    return firstValidationMessage ?? payload?.message ?? fallback
  }

  return fallback
}

export const getUserSuccessMessage = (response: unknown, fallback: string) => {
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
