const padMinutes = (value: number) => String(value).padStart(2, '0')

const parseDateValue = (value: string | null | undefined) => {
  if (!value) {
    return null
  }

  const parsedDate = new Date(value)

  return Number.isNaN(parsedDate.getTime()) ? null : parsedDate
}

const monthDayFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
})

const monthDayYearFormatter = new Intl.DateTimeFormat(undefined, {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

const RANGE_SEPARATOR = '\u2013'
const INLINE_SEPARATOR = '\u2022'

const to12HourParts = (hours24: number, minutes: number) => {
  const period = hours24 >= 12 ? 'PM' : 'AM'
  const normalizedHours = hours24 % 12 || 12

  return {
    hours: normalizedHours,
    minutes: padMinutes(minutes),
    period,
  }
}

const parseTimeString = (value: string) => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/)

  if (!match) {
    return null
  }

  const hours = Number(match[1])
  const minutes = Number(match[2])

  if (!Number.isFinite(hours) || !Number.isFinite(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null
  }

  return { hours, minutes }
}

export const formatTime12h = (value: string | null | undefined) => {
  if (!value) {
    return '--'
  }

  const parsedTime = parseTimeString(value)

  if (parsedTime) {
    const parts = to12HourParts(parsedTime.hours, parsedTime.minutes)
    return `${parts.hours}:${parts.minutes} ${parts.period}`
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value)
  }

  const parts = to12HourParts(parsedDate.getHours(), parsedDate.getMinutes())
  return `${parts.hours}:${parts.minutes} ${parts.period}`
}

export const formatDate = (value: string | null | undefined) => {
  if (!value) {
    return '--'
  }

  const parsedDate = parseDateValue(value)

  if (!parsedDate) {
    return String(value)
  }

  return parsedDate.toLocaleDateString()
}

export const formatShortDate = (value: string | null | undefined) => {
  if (!value) {
    return '--'
  }

  const parsedDate = parseDateValue(value)

  if (!parsedDate) {
    return String(value)
  }

  return monthDayYearFormatter.format(parsedDate)
}

export const formatReadableDateRange = (
  startValue: string | null | undefined,
  endValue: string | null | undefined,
) => {
  if (!startValue || !endValue) {
    return formatShortDate(startValue ?? endValue)
  }

  const startDate = parseDateValue(startValue)
  const endDate = parseDateValue(endValue)

  if (!startDate || !endDate) {
    return `${formatDate(startValue)} ${RANGE_SEPARATOR} ${formatDate(endValue)}`
  }

  if (startDate.toDateString() === endDate.toDateString()) {
    return monthDayYearFormatter.format(startDate)
  }

  return `${monthDayFormatter.format(startDate)} ${RANGE_SEPARATOR} ${monthDayYearFormatter.format(endDate)}`
}

export const formatDateTime12h = (value: string | null | undefined) => {
  if (!value) {
    return '--'
  }

  const parsedDate = parseDateValue(value)

  if (!parsedDate) {
    return String(value)
  }

  return `${parsedDate.toLocaleDateString()} ${formatTime12h(value)}`
}

export const formatDateTime12hCompact = (value: string | null | undefined) => {
  if (!value) {
    return '--'
  }

  const parsedDate = parseDateValue(value)

  if (!parsedDate) {
    return String(value)
  }

  return `${monthDayYearFormatter.format(parsedDate)} ${INLINE_SEPARATOR} ${formatTime12h(value)}`
}
