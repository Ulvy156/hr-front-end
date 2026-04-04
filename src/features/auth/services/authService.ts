import type { AuthUser, LoginPayload, LoginResponse } from '../interface/auth.interface'
import api from '@/lib/http'

export const authService = {
  async login(payload: LoginPayload) {
    const { data } = await api.post<LoginResponse>('/auth/login', payload)

    return data
  },

  async getMe() {
    const { data } = await api.get<AuthUser>('/auth/me')

    return data
  },
}
