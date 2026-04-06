import axios from 'axios'

export type SelfServiceAttendanceAction = 'check_in' | 'check_out'

type AttendanceRequestErrorPayload = {
  message?: string
  errors?: Record<string, string[]>
}

export const isSelfServiceAttendanceAction = (
  value: string | null | undefined,
): value is SelfServiceAttendanceAction => {
  return value === 'check_in' || value === 'check_out'
}

export const formatAttendanceActionLabel = (value: string | null) => {
  if (!value) return 'Attendance Action'

  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export const getAttendanceRequestErrorMessage = (
  error: unknown,
  fallback = 'Attendance action failed. Please try again.',
) => {
  if (axios.isAxiosError<AttendanceRequestErrorPayload>(error)) {
    const errorPayload = error.response?.data
    const firstValidationMessage = errorPayload?.errors
      ? Object.values(errorPayload.errors).flat()[0]
      : null

    return firstValidationMessage ?? errorPayload?.message ?? fallback
  }

  return fallback
}
