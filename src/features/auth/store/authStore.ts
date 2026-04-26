import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { clearManualLogoutMarker, setManualLogoutMarker } from '@/utils/authSession'
import { removeCookie } from '@/utils/cookie'

import type { AuthUser } from '../interface/auth.interface'
import { authService } from '../services/authService'
import { getAuthUserPermissionNames } from '../utils/permissions'
import {
  canUseEmployeeSelfService,
  getAuthUserPrimaryRole,
  hasEmployeeContext,
} from '../utils/userContext'

const ACCESS_TOKEN_COOKIE_NAME = 'access_token'

const clearAccessTokenCookie = () => removeCookie(ACCESS_TOKEN_COOKIE_NAME)

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const isLoading = ref(false)
  const initialized = ref(false)

  const isAuthenticated = computed(() => user.value !== null)
  const employee = computed(() => user.value?.employee ?? null)
  const primaryRole = computed(() => getAuthUserPrimaryRole(user.value))
  const hasEmployeeRecord = computed(() => hasEmployeeContext(user.value))
  const canUseEmployeeSelfServiceEndpoints = computed(() => canUseEmployeeSelfService(user.value))
  const roles = computed(() => user.value?.roles ?? [])
  const permissionNames = computed(() => getAuthUserPermissionNames(user.value))
  const addresses = computed(() => employee.value?.addresses ?? [])
  const emergencyContacts = computed(() => employee.value?.emergency_contacts ?? [])
  const positions = computed(() => employee.value?.employee_positions ?? [])

  const setUser = (nextUser: AuthUser | null) => {
    user.value = nextUser

    if (nextUser) {
      clearManualLogoutMarker()
    }
  }

  const clearAuth = () => {
    user.value = null
    isLoading.value = false
    initialized.value = true
    clearAccessTokenCookie()
  }

  const logout = async () => {
    try {
      await authService.logout()
    } catch {
      // Always clear client auth state even if the backend logout request fails.
    } finally {
      setManualLogoutMarker()
      clearAuth()
    }
  }

  const fetchMe = async () => {
    isLoading.value = true

    try {
      const currentUser = await authService.getMe()
      setUser(currentUser)

      return currentUser
    } finally {
      isLoading.value = false
      initialized.value = true
    }
  }

  return {
    user,
    employee,
    primaryRole,
    hasEmployeeRecord,
    canUseEmployeeSelfServiceEndpoints,
    roles,
    permissionNames,
    addresses,
    emergencyContacts,
    positions,
    isAuthenticated,
    isLoading,
    initialized,
    fetchMe,
    setUser,
    clearAuth,
    logout,
  }
})
