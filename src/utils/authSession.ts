const MANUAL_LOGOUT_STORAGE_KEY = 'auth.manual_logout'

const canUseStorage = () => typeof window !== 'undefined'

export const hasManualLogoutMarker = () => {
  if (!canUseStorage()) {
    return false
  }

  return window.localStorage.getItem(MANUAL_LOGOUT_STORAGE_KEY) === '1'
}

export const setManualLogoutMarker = () => {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(MANUAL_LOGOUT_STORAGE_KEY, '1')
}

export const clearManualLogoutMarker = () => {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(MANUAL_LOGOUT_STORAGE_KEY)
}
