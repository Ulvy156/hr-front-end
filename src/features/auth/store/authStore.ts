import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { removeCookie } from '@/utils/cookie'

import type { AuthUser } from '../interface/auth.interface'
import { authService } from '../services/authService'

const ACCESS_TOKEN_COOKIE_NAME = 'access_token'

const clearAccessTokenCookie = () => removeCookie(ACCESS_TOKEN_COOKIE_NAME)

export const useAuthStore = defineStore('auth', () => {
  const user = ref<AuthUser | null>(null)
  const isLoading = ref(false)
  const initialized = ref(false)

  const isAuthenticated = computed(() => user.value !== null)

  const setUser = (nextUser: AuthUser | null) => {
    user.value = nextUser
  }

  const clearAuth = () => {
    user.value = null
    isLoading.value = false
    initialized.value = true
    clearAccessTokenCookie()
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
    isAuthenticated,
    isLoading,
    initialized,
    fetchMe,
    setUser,
    clearAuth,
  }
})
