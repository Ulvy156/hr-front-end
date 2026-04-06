const padMinutes = (value: number) => String(value).padStart(2, '0')

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

export const formatDateTime12h = (value: string | null | undefined) => {
  if (!value) {
    return '--'
  }

  const parsedDate = new Date(value)

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value)
  }

  return `${parsedDate.toLocaleDateString()} ${formatTime12h(value)}`
}
