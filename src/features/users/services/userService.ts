import api from '@/lib/http'

import type {
  AvailableEmployeeUserListResponse,
  UserAccount,
  UserActionResponse,
  UserAccessSummary,
  UserAccessUpdatePayload,
  UserCreatePayload,
  UserListParams,
  UserListResponse,
  UserPermission,
  UserResetPasswordPayload,
  UserRoleListResponse,
  UserUpdatePayload,
} from '../interface/user.interface'

export const userService = {
  async getRoles() {
    const { data } = await api.get<UserRoleListResponse>('/users/roles')

    return data
  },

  async getPermissions() {
    const { data } = await api.get<UserPermission[]>('/permissions')

    return data
  },

  async getUsers(params?: UserListParams) {
    const { data } = await api.get<UserListResponse>('/users', {
      params,
    })

    return data
  },

  async getAvailableEmployeeUsers() {
    const { data } = await api.get<AvailableEmployeeUserListResponse>('/employees/available-users')

    return data
  },

  async getUsersByUrl(url: string) {
    const { data } = await api.get<UserListResponse>(url)

    return data
  },

  async getUser(userId: number) {
    const { data } = await api.get<UserAccount>(`/users/${userId}`)

    return data
  },

  async getUserAccess(userId: number) {
    const { data } = await api.get<UserAccessSummary>(`/users/${userId}/access`)

    return data
  },

  async createUser(payload: UserCreatePayload) {
    const { data } = await api.post<UserAccount>('/users', payload)

    return data
  },

  async updateUser(userId: number, payload: UserUpdatePayload) {
    const { data } = await api.put<UserAccount>(`/users/${userId}`, payload)

    return data
  },

  async updateUserAccess(userId: number, payload: UserAccessUpdatePayload) {
    const { data } = await api.patch<UserAccessSummary>(
      `/users/${userId}/access`,
      payload,
    )

    return data
  },

  async resetUserPassword(userId: number, payload: UserResetPasswordPayload) {
    const { data } = await api.post<UserActionResponse>(`/users/${userId}/reset-password`, payload)

    return data
  },

  async deleteUser(userId: number) {
    await api.delete(`/users/${userId}`)
  },
}
