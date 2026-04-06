import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios'

import { getCookie, removeCookie, setCookie } from '@/utils/cookie'
import { hasManualLogoutMarker } from '@/utils/authSession'

const ACCESS_TOKEN_COOKIE_NAME = 'access_token'

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean
  skipAuthRefresh?: boolean
}

type AuthTokenResponse = {
  access_token?: string
  expires_in?: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
const REFRESH_PATH = import.meta.env.VITE_API_REFRESH_PATH ?? '/auth/refresh'
const LOGIN_PATH = '/auth/login'

const getStoredAccessToken = () => getCookie(ACCESS_TOKEN_COOKIE_NAME)

const setStoredAccessToken = (accessToken: string, expiresIn?: number) => {
  setCookie(ACCESS_TOKEN_COOKIE_NAME, accessToken, expiresIn)
}

const clearStoredAccessToken = () => {
  removeCookie(ACCESS_TOKEN_COOKIE_NAME)
}

const canAttemptRefreshBeforeRequest = (config: RetryableRequestConfig) => {
  const requestUrl = config.url ?? ''

  if (config.skipAuthRefresh || hasManualLogoutMarker()) {
    return false
  }

  return !requestUrl.includes(REFRESH_PATH) && !requestUrl.includes(LOGIN_PATH)
}

const shouldRefresh = (error: AxiosError) => {
  const request = error.config as RetryableRequestConfig | undefined
  const status = error.response?.status
  const requestUrl = request?.url ?? ''

  if (
    !request ||
    status !== 401 ||
    request._retry ||
    request.skipAuthRefresh ||
    hasManualLogoutMarker()
  ) {
    return false
  }

  return !requestUrl.includes(REFRESH_PATH)
}

const createHttpClient = (config?: AxiosRequestConfig): AxiosInstance =>
  axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    ...config,
  })

const refreshClient = createHttpClient()

let refreshRequest: Promise<void> | null = null

const refreshSession = async () => {
  if (!refreshRequest) {
    refreshRequest = refreshClient
      .post<AuthTokenResponse>(
        REFRESH_PATH,
        {},
        {
          skipAuthRefresh: true,
        } as RetryableRequestConfig,
      )
      .then(({ data }) => {
        if (data.access_token) {
          setStoredAccessToken(data.access_token, data.expires_in)
        }
      })
      .finally(() => {
        refreshRequest = null
      })
  }

  return refreshRequest
}

export const api = createHttpClient()

api.interceptors.request.use(async (config) => {
  let accessToken = getStoredAccessToken()

  if (!accessToken && canAttemptRefreshBeforeRequest(config as RetryableRequestConfig)) {
    try {
      await refreshSession()
      accessToken = getStoredAccessToken()
    } catch {
      ;(config as RetryableRequestConfig).skipAuthRefresh = true
    }
  }

  if (!accessToken) {
    return config
  }

  const headers = AxiosHeaders.from(config.headers)
  headers.set('Authorization', `Bearer ${accessToken}`)
  config.headers = headers

  return config
})

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (!shouldRefresh(error)) {
      return Promise.reject(error)
    }

    const originalRequest = error.config as RetryableRequestConfig
    originalRequest._retry = true

    try {
      await refreshSession()
      return api(originalRequest)
    } catch (refreshError) {
      clearStoredAccessToken()
      return Promise.reject(refreshError)
    }
  },
)

export const authApi = {
  refresh: refreshSession,
}

export default api
