import { ref } from 'vue'
import { defineStore } from 'pinia'

import type {
  UserAccount,
  UserCreatePayload,
  UserListParams,
  UserListResponse,
  UserResetPasswordPayload,
  UserRole,
  UserUpdatePayload,
} from '../interface/user.interface'
import { userService } from '../services/userService'

type UserListRequestState = {
  params?: UserListParams
  url?: string
}

export const useUserStore = defineStore('users', () => {
  const users = ref<UserListResponse | null>(null)
  const selectedUser = ref<UserAccount | null>(null)
  const roles = ref<UserRole[]>([])
  const isLoading = ref(false)
  const isRolesLoading = ref(false)
  const isDetailLoading = ref(false)
  const isSaving = ref(false)
  const isDeleting = ref(false)
  const isResettingPassword = ref(false)
  const error = ref('')
  const detailError = ref('')
  const lastListRequest = ref<UserListRequestState | null>(null)

  const fetchUsers = async (params?: UserListParams) => {
    isLoading.value = true
    error.value = ''

    try {
      const response = await userService.getUsers(params)
      users.value = response
      lastListRequest.value = {
        params,
      }

      return response
    } catch (err) {
      users.value = null
      error.value = err instanceof Error ? err.message : 'Failed to load users.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchUsersByUrl = async (url: string) => {
    isLoading.value = true
    error.value = ''

    try {
      const response = await userService.getUsersByUrl(url)
      users.value = response
      lastListRequest.value = {
        url,
      }

      return response
    } catch (err) {
      users.value = null
      error.value = err instanceof Error ? err.message : 'Failed to load users.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const refreshUsers = async () => {
    if (lastListRequest.value?.url) {
      return fetchUsersByUrl(lastListRequest.value.url)
    }

    return fetchUsers(lastListRequest.value?.params)
  }

  const fetchRoles = async () => {
    isRolesLoading.value = true

    try {
      const response = await userService.getRoles()
      roles.value = response.data

      return response.data
    } finally {
      isRolesLoading.value = false
    }
  }

  const fetchUser = async (userId: number) => {
    isDetailLoading.value = true
    detailError.value = ''

    try {
      const response = await userService.getUser(userId)
      selectedUser.value = response

      return response
    } catch (err) {
      selectedUser.value = null
      detailError.value = err instanceof Error ? err.message : 'Failed to load user details.'
      throw err
    } finally {
      isDetailLoading.value = false
    }
  }

  const createUser = async (payload: UserCreatePayload) => {
    isSaving.value = true

    try {
      const response = await userService.createUser(payload)
      selectedUser.value = response

      return response
    } finally {
      isSaving.value = false
    }
  }

  const updateUser = async (userId: number, payload: UserUpdatePayload) => {
    isSaving.value = true

    try {
      const response = await userService.updateUser(userId, payload)
      selectedUser.value = response

      return response
    } finally {
      isSaving.value = false
    }
  }

  const resetUserPassword = async (userId: number, payload: UserResetPasswordPayload) => {
    isResettingPassword.value = true

    try {
      return await userService.resetUserPassword(userId, payload)
    } finally {
      isResettingPassword.value = false
    }
  }

  const deleteUser = async (userId: number) => {
    isDeleting.value = true

    try {
      await userService.deleteUser(userId)

      if (selectedUser.value?.id === userId) {
        selectedUser.value = null
      }
    } finally {
      isDeleting.value = false
    }
  }

  const clearSelectedUser = () => {
    selectedUser.value = null
    detailError.value = ''
    isDetailLoading.value = false
  }

  return {
    users,
    selectedUser,
    roles,
    isLoading,
    isRolesLoading,
    isDetailLoading,
    isSaving,
    isDeleting,
    isResettingPassword,
    error,
    detailError,
    fetchUsers,
    fetchUsersByUrl,
    refreshUsers,
    fetchRoles,
    fetchUser,
    createUser,
    updateUser,
    resetUserPassword,
    deleteUser,
    clearSelectedUser,
  }
})
