import { ref } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'

import { setCookie } from '@/utils/cookie'

import type { LoginPayload } from '../interface/auth.interface'
import { authService } from '../services/authService'
import { useAuthStore } from '../store/authStore'

type LoginAuthResponse = {
  access_token: string
  expires_in: number
}

const ACCESS_TOKEN_COOKIE_NAME = 'access_token'

const setAccessTokenCookie = (token: string, expiresIn: number) =>
  setCookie(ACCESS_TOKEN_COOKIE_NAME, token, expiresIn)

const getErrorMessage = (error: unknown) => {
  if (axios.isAxiosError<{ message?: string }>(error)) {
    return error.response?.data?.message ?? 'Login failed. Please try again.'
  }

  return 'Login failed. Please try again.'
}

export const useLogin = () => {
  const authStore = useAuthStore()
  const router = useRouter()
  const loading = ref(false)
  const error = ref('')

  const login = async (payload: LoginPayload) => {
    loading.value = true
    error.value = ''

    try {
      const response = await authService.login(payload)
      const { access_token, expires_in } = response as LoginAuthResponse

      setAccessTokenCookie(access_token, expires_in)
      await authStore.fetchMe()
      await router.push('/dashboard')

      return response
    } catch (err) {
      authStore.clearAuth()
      error.value = getErrorMessage(err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    login,
    loading,
    error,
  }
}
