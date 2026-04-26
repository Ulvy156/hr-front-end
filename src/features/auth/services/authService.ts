import type {
  AuthChangePasswordPayload,
  AuthChangePasswordResponse,
  AuthUser,
  AuthUserUpdatePayload,
  LoginPayload,
  LoginResponse,
} from '../interface/auth.interface'
import api from '@/lib/http'

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await api.post<LoginResponse>('/auth/login', payload)

    return data
  },

  async logout() {
    const { data } = await api.post('/auth/logout')

    return data
  },

  async getProfile() {
    return this.getMe()
  },

  async getMe() {
    const { data } = await api.get<AuthUser>('/auth/me')

    return data
  },

  async changePassword(payload: AuthChangePasswordPayload) {
    const { data } = await api.post<AuthChangePasswordResponse>('/auth/change-password', payload)

    return data
  },

  async updateUser(userId: number, payload: AuthUserUpdatePayload) {
    const { data } = await api.put<AuthUser>(`/users/${userId}`, payload)

    return data
  },
}
