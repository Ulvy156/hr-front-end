import type {
  LeaveCurrentBalance,
  LeavePublicHoliday,
  LeaveRequestCreatePayload,
  LeaveRequestFormState,
  LeaveType,
} from '../interface/leave.interface'
import {
  LEAVE_DURATION,
  LEAVE_HALF_DAY_SESSION,
} from '../interface/leave.interface'
import {
  HALF_DAY_API_UNSUPPORTED_MESSAGE,
  buildPublicHolidayDateSet,
  createEmptyLeaveRequestForm,
  estimateLeaveDays,
  formatDateOnly,
  getAnnualLeaveNoticeDays,
  getDaysUntilDate,
  getLeaveTypeCompensationLabel,
  getLeaveTypeLimitLabel,
  getLeaveTypeMaxDaysPerRequest,
  getLeaveTypeMaxDaysPerYear,
  isAnnualLeaveType,
  isFullTimeEmploymentType,
  isLeaveTypeDisabledForEmployee,
  isMaternityLeaveType,
  isProbationEmploymentType,
  isSickLeaveType,
  isSpecialLeaveType,
  isUnpaidLeaveType,
  resolveLeaveTypePaidStatus,
  usesAnnualAdvanceNoticeRules,
} from '../utils/leave'

export const useLeaveRequestForm = ({
  leaveBalances,
  leaveTypes,
  publicHolidays,
  employeeEmploymentType,
}: {
  leaveBalances: () => LeaveCurrentBalance[] | null | undefined
  leaveTypes: () => LeaveType[]
  publicHolidays: () => LeavePublicHoliday[] | null | undefined
  employeeEmploymentType: () => string | null | undefined
}) => {
  const form = reactive<LeaveRequestFormState>(createEmptyLeaveRequestForm())

  const errors = reactive<Record<keyof LeaveRequestFormState, string>>({
    type: '',
    reason: '',
    start_date: '',
    end_date: '',
    duration_type: '',
    half_day_session: '',
  })

  const selectedLeaveType = computed(() => {
    return leaveTypes().find((leaveType) => leaveType.code === form.type) ?? null
  })

  const publicHolidayDateSet = computed(() => buildPublicHolidayDateSet(publicHolidays()))

  const estimatedRequestedDays = computed(() => {
    return estimateLeaveDays({
      durationType: form.duration_type,
      endDate: form.end_date,
      leaveType: selectedLeaveType.value,
      startDate: form.start_date,
    })
  })

  const hasSelectedDates = computed(() => {
    if (!form.start_date) {
      return false
    }

    if (form.duration_type === LEAVE_DURATION.HALF_DAY) {
      return Boolean(form.end_date)
    }

    return Boolean(form.end_date)
  })

  const estimatedNoticeDays = computed(() => {
    if (!usesAnnualAdvanceNoticeRules(selectedLeaveType.value, form.type)) {
      return 0
    }

    return getAnnualLeaveNoticeDays(estimatedRequestedDays.value)
  })

  const selectedLeaveBalance = computed(() => {
    const selectedYear = form.start_date ? Number(form.start_date.slice(0, 4)) : null
    const selectedTypeCode = selectedLeaveType.value?.code
    const balances = leaveBalances() ?? []

    if (!selectedTypeCode || !balances.length) {
      return null
    }

    if (selectedYear) {
      const yearlyBalance = balances.find(
        (balance) => balance.leave_type.code === selectedTypeCode && balance.year === selectedYear,
      )

      if (yearlyBalance) {
        return yearlyBalance
      }
    }

    return balances.find((balance) => balance.leave_type.code === selectedTypeCode) ?? null
  })

  const isProbationEmployee = computed(() => isProbationEmploymentType(employeeEmploymentType()))
  const isFullTimeEmployee = computed(() => isFullTimeEmploymentType(employeeEmploymentType()))

  const probationMessage = computed(() => {
    if (!isProbationEmployee.value) {
      return ''
    }

    return 'Annual leave is not allowed during probation.'
  })

  const noticeMessage = computed(() => {
    if (!selectedLeaveType.value || isSickLeaveType(selectedLeaveType.value)) {
      return 'Sick leave can be requested immediately, including the same day.'
    }

    if (isUnpaidLeaveType(selectedLeaveType.value)) {
      if (estimatedNoticeDays.value === 7) {
        return 'Unpaid leave more than 4 days requires at least 7 days notice.'
      }

      if (estimatedNoticeDays.value === 3) {
        return 'Unpaid leave more than 2 days requires at least 3 days notice.'
      }

      return 'Unpaid leave follows the standard manager then HR approval flow.'
    }

    if (!isAnnualLeaveType(selectedLeaveType.value)) {
      return 'Notice requirements for this leave type are finalized by the backend policy.'
    }

    if (estimatedNoticeDays.value === 7) {
      return 'Annual leave more than 4 days requires at least 7 days notice.'
    }

    if (estimatedNoticeDays.value === 3) {
      return 'Annual leave more than 2 days requires at least 3 days notice.'
    }

    return 'No special annual leave notice rule applies for this selection.'
  })

  const contractConstraintMessage = computed(() => {
    if (form.duration_type !== LEAVE_DURATION.HALF_DAY) {
      return ''
    }

    if (selectedLeaveType.value && !selectedLeaveType.value.supports_half_day) {
      return HALF_DAY_API_UNSUPPORTED_MESSAGE
    }

    return ''
  })

  const isHalfDaySupported = computed(() => Boolean(selectedLeaveType.value?.supports_half_day))

  const isPublicHolidayDate = (date: Date) => {
    return publicHolidayDateSet.value.has(formatDateOnly(date))
  }

  const summaryTitle = computed(() => {
    if (selectedLeaveType.value) {
      return selectedLeaveType.value.name
    }

    return 'Request Summary'
  })

  const limitLabel = computed(() => {
    return getLeaveTypeLimitLabel(selectedLeaveType.value, form.type)
  })

  const compensationLabel = computed(() => {
    if (!selectedLeaveType.value) {
      return ''
    }

    return getLeaveTypeCompensationLabel(selectedLeaveType.value, form.type)
  })

  const ruleNotices = computed(() => {
    const notices: string[] = []

    if (!selectedLeaveType.value) {
      return notices
    }

    if (isAnnualLeaveType(selectedLeaveType.value)) {
      notices.push('more than 2 days: request at least 3 days before')
      notices.push('more than 4 days: request at least 7 days before')

      if (isProbationEmployee.value) {
        notices.push('Probation: annual leave is not allowed')
      }

      if (isFullTimeEmployee.value) {
        notices.push('Confirmed full-time: annual leave can be used immediately')
      }
    }

    if (isSickLeaveType(selectedLeaveType.value)) {
      notices.push('Sick leave: can be requested immediately')
      notices.push('Sick leave: same-day request is allowed')

      const yearlyLimit = getLeaveTypeMaxDaysPerYear(selectedLeaveType.value)

      if (yearlyLimit) {
        notices.push(`Maximum ${yearlyLimit} days per year`)
      }
    }

    if (isMaternityLeaveType(selectedLeaveType.value)) {
      notices.push('Maximum 90 days per pregnancy')
      notices.push('Paid at 50% salary')
    }

    if (isUnpaidLeaveType(selectedLeaveType.value)) {
      notices.push('This leave is unpaid. No salary will be provided for the selected leave days.')
    }

    if (isSpecialLeaveType(selectedLeaveType.value)) {
      const yearlyLimit = getLeaveTypeMaxDaysPerYear(selectedLeaveType.value)

      if (yearlyLimit) {
        notices.push(`Maximum ${yearlyLimit} days per year`)
      }

      if (resolveLeaveTypePaidStatus(selectedLeaveType.value)) {
        notices.push('Paid leave')
      }
    }

    if (form.duration_type === LEAVE_DURATION.HALF_DAY) {
      notices.push('Half day: start and end date must match')
      notices.push('Half day: select AM or PM')
    }

    if (selectedLeaveType.value.auto_exclude_public_holidays) {
      notices.push('Final leave days are confirmed by backend')
    }

    if (contractConstraintMessage.value) {
      notices.push('Half day: not supported by the current API yet')
    }

    return Array.from(new Set(notices))
  })

  const resetErrors = () => {
    errors.type = ''
    errors.reason = ''
    errors.start_date = ''
    errors.end_date = ''
    errors.duration_type = ''
    errors.half_day_session = ''
  }

  const resetForm = () => {
    Object.assign(form, createEmptyLeaveRequestForm())
    resetErrors()
  }

  const validate = () => {
    resetErrors()

    errors.type = form.type ? '' : 'Leave type is required.'
    errors.reason = form.reason.trim() ? '' : 'Reason is required.'
    errors.start_date = form.start_date ? '' : 'Start date is required.'
    errors.end_date = form.end_date ? '' : 'End date is required.'
    errors.duration_type = form.duration_type ? '' : 'Leave duration is required.'

    if (form.reason.trim() && form.reason.trim().length < 3) {
      errors.reason = 'Reason must be at least 3 characters.'
    }

    if (!selectedLeaveType.value && form.type) {
      errors.type = 'Please select a valid leave type.'
    }

    if (
      selectedLeaveType.value &&
      isLeaveTypeDisabledForEmployee({
        employmentType: employeeEmploymentType(),
        leaveType: selectedLeaveType.value,
      })
    ) {
      errors.type = 'Annual leave is not allowed during probation.'
    }

    if (form.start_date && form.end_date && form.end_date < form.start_date) {
      errors.end_date = 'Start date cannot be after end date.'
    }

    if (form.start_date && publicHolidayDateSet.value.has(form.start_date)) {
      errors.start_date = 'Public holidays cannot be selected.'
    }

    if (form.end_date && publicHolidayDateSet.value.has(form.end_date)) {
      errors.end_date = 'Public holidays cannot be selected.'
    }

    if (form.duration_type === LEAVE_DURATION.HALF_DAY) {
      if (selectedLeaveType.value && !isHalfDaySupported.value) {
        errors.duration_type = HALF_DAY_API_UNSUPPORTED_MESSAGE
      }

      if (!form.half_day_session) {
        errors.half_day_session = 'Please select AM or PM for half-day leave.'
      }

      if (form.start_date && form.end_date && form.start_date !== form.end_date) {
        errors.end_date = 'Half-day leave must start and end on the same date.'
      }
    }

    if (
      selectedLeaveType.value &&
      usesAnnualAdvanceNoticeRules(selectedLeaveType.value) &&
      estimatedRequestedDays.value > 0
    ) {
      const daysUntilStart = getDaysUntilDate(form.start_date)

      if (estimatedNoticeDays.value === 7 && daysUntilStart !== null && daysUntilStart < 7) {
        errors.start_date = isUnpaidLeaveType(selectedLeaveType.value)
          ? 'Unpaid leave more than 4 days requires at least 7 days notice.'
          : 'Annual leave more than 4 days requires at least 7 days notice.'
      } else if (estimatedNoticeDays.value === 3 && daysUntilStart !== null && daysUntilStart < 3) {
        errors.start_date = isUnpaidLeaveType(selectedLeaveType.value)
          ? 'Unpaid leave more than 2 days requires at least 3 days notice.'
          : 'Annual leave more than 2 days requires at least 3 days notice.'
      }
    }

    const maxDaysPerRequest = getLeaveTypeMaxDaysPerRequest(selectedLeaveType.value, form.type)

    if (maxDaysPerRequest && estimatedRequestedDays.value > maxDaysPerRequest) {
      if (isMaternityLeaveType(selectedLeaveType.value)) {
        errors.end_date = 'Maternity leave is limited to 90 days per pregnancy.'
      } else {
        errors.end_date = `This leave type is limited to ${maxDaysPerRequest} days per request.`
      }
    }

    if (
      selectedLeaveBalance.value &&
      typeof selectedLeaveBalance.value.remaining_days === 'number' &&
      estimatedRequestedDays.value > selectedLeaveBalance.value.remaining_days
    ) {
      const leaveType = selectedLeaveType.value

      if (leaveType && isSpecialLeaveType(leaveType)) {
        const yearlyLimit = getLeaveTypeMaxDaysPerYear(leaveType)
        errors.end_date = `Special leave is limited to ${yearlyLimit ?? 7} days per year.`
      } else if (isSickLeaveType(leaveType)) {
        const yearlyLimit = getLeaveTypeMaxDaysPerYear(leaveType)
        errors.end_date = `Sick leave is limited to ${yearlyLimit ?? 7} days per year.`
      } else {
        errors.end_date = 'The selected leave duration exceeds the available balance for this leave type.'
      }
    }

    return Object.values(errors).every((value) => !value)
  }

  const buildSubmitPayload = (): LeaveRequestCreatePayload => ({
    type: form.type,
    reason: form.reason.trim(),
    duration_type: form.duration_type,
    start_date: form.start_date,
    end_date: form.end_date,
    ...(form.duration_type === LEAVE_DURATION.HALF_DAY
      ? {
          half_day_session: form.half_day_session as LeaveRequestCreatePayload['half_day_session'],
        }
      : {}),
  })

  watch(
    () => form.duration_type,
    (durationType) => {
      if (durationType === LEAVE_DURATION.FULL_DAY) {
        form.half_day_session = ''
        errors.half_day_session = ''
        return
      }

      if (form.start_date) {
        form.end_date = form.start_date
      }
    },
  )

  watch(
    () => form.start_date,
    (startDate) => {
      if (form.duration_type === LEAVE_DURATION.HALF_DAY && startDate) {
        form.end_date = startDate
      }
    },
  )

  const durationOptions = computed(() => [
    {
      label: 'Full Day',
      value: LEAVE_DURATION.FULL_DAY,
      description: 'One or more working days.',
    },
    {
      label: 'Half Day',
      value: LEAVE_DURATION.HALF_DAY,
      description: 'Single-date AM or PM.',
    },
  ])

  const halfDaySessionOptions = computed(() => {
    const apiSessions = selectedLeaveType.value?.supported_half_day_sessions ?? []

    if (apiSessions.length > 0) {
      return apiSessions.map((session) => ({
        label: session,
        value: session,
      }))
    }

    return [
      {
        label: LEAVE_HALF_DAY_SESSION.AM,
        value: LEAVE_HALF_DAY_SESSION.AM,
      },
      {
        label: LEAVE_HALF_DAY_SESSION.PM,
        value: LEAVE_HALF_DAY_SESSION.PM,
      },
    ]
  })

  return {
    form,
    errors,
    selectedLeaveType,
    estimatedRequestedDays,
    hasSelectedDates,
    estimatedNoticeDays,
    selectedLeaveBalance,
    isProbationEmployee,
    isFullTimeEmployee,
    probationMessage,
    noticeMessage,
    contractConstraintMessage,
    isHalfDaySupported,
    isPublicHolidayDate,
    summaryTitle,
    limitLabel,
    compensationLabel,
    ruleNotices,
    validate,
    resetForm,
    buildSubmitPayload,
    halfDaySessionOptions,
    durationOptions,
  }
}
