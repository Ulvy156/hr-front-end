import { ref } from 'vue'
import { defineStore } from 'pinia'

import type {
  AvailableEmployeeUser,
  UserAccount,
  UserAccessSummary,
  UserAccessUpdatePayload,
  UserCreatePayload,
  UserListParams,
  UserListResponse,
  UserPermission,
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
  const availableUsers = ref<AvailableEmployeeUser[] | null>(null)
  const users = ref<UserListResponse | null>(null)
  const selectedUser = ref<UserAccount | null>(null)
  const selectedUserAccess = ref<UserAccessSummary | null>(null)
  const roles = ref<UserRole[]>([])
  const permissions = ref<UserPermission[] | null>(null)
  const isLoading = ref(false)
  const isRolesLoading = ref(false)
  const isPermissionsLoading = ref(false)
  const isDetailLoading = ref(false)
  const isAccessLoading = ref(false)
  const isSaving = ref(false)
  const isDeleting = ref(false)
  const isResettingPassword = ref(false)
  const error = ref('')
  const permissionsError = ref('')
  const detailError = ref('')
  const accessError = ref('')
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

  const fetchAvailableEmployeeUsers = async () => {
    isLoading.value = true
    error.value = ''

    try {
      const response = await userService.getAvailableEmployeeUsers()
      availableUsers.value = response.data

      return response.data
    } catch (err) {
      availableUsers.value = null
      error.value = err instanceof Error ? err.message : 'Failed to load available users.'
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

  const fetchPermissions = async (force = false) => {
    if (permissions.value && !force) {
      return permissions.value
    }

    isPermissionsLoading.value = true
    permissionsError.value = ''

    try {
      const response = await userService.getPermissions()
      permissions.value = response

      return response
    } catch (err) {
      permissions.value = null
      permissionsError.value =
        err instanceof Error ? err.message : 'Unable to load available access options.'
      throw err
    } finally {
      isPermissionsLoading.value = false
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

  const fetchUserAccess = async (userId: number) => {
    isAccessLoading.value = true
    accessError.value = ''

    try {
      const response = await userService.getUserAccess(userId)
      selectedUserAccess.value = response

      return response
    } catch (err) {
      selectedUserAccess.value = null
      accessError.value = err instanceof Error ? err.message : 'Unable to load user access.'
      throw err
    } finally {
      isAccessLoading.value = false
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

  const updateUserAccess = async (userId: number, payload: UserAccessUpdatePayload) => {
    isSaving.value = true

    try {
      const response = await userService.updateUserAccess(userId, payload)
      selectedUserAccess.value = 'effective_permissions' in response ? response : selectedUserAccess.value

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
    selectedUserAccess.value = null
    detailError.value = ''
    accessError.value = ''
    isDetailLoading.value = false
    isAccessLoading.value = false
  }

  return {
    availableUsers,
    users,
    selectedUser,
    selectedUserAccess,
    roles,
    permissions,
    isLoading,
    isRolesLoading,
    isPermissionsLoading,
    isDetailLoading,
    isAccessLoading,
    isSaving,
    isDeleting,
    isResettingPassword,
    error,
    permissionsError,
    detailError,
    accessError,
    fetchAvailableEmployeeUsers,
    fetchUsers,
    fetchUsersByUrl,
    refreshUsers,
    fetchRoles,
    fetchPermissions,
    fetchUser,
    fetchUserAccess,
    createUser,
    updateUser,
    updateUserAccess,
    resetUserPassword,
    deleteUser,
    clearSelectedUser,
  }
})
