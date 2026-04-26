import { storeToRefs } from 'pinia'

import { useAuth } from '@/features/auth/composable/useAuth'

import { useUserStore } from '../store/userStore'

export const useUsers = () => {
  const userStore = useUserStore()
  const { currentUser } = useAuth()
  const {
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
  } = storeToRefs(userStore)

  return {
    currentUser,
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
    fetchAvailableEmployeeUsers: userStore.fetchAvailableEmployeeUsers,
    fetchUsers: userStore.fetchUsers,
    fetchUsersByUrl: userStore.fetchUsersByUrl,
    refreshUsers: userStore.refreshUsers,
    fetchRoles: userStore.fetchRoles,
    fetchPermissions: userStore.fetchPermissions,
    fetchUser: userStore.fetchUser,
    fetchUserAccess: userStore.fetchUserAccess,
    createUser: userStore.createUser,
    updateUser: userStore.updateUser,
    updateUserAccess: userStore.updateUserAccess,
    resetUserPassword: userStore.resetUserPassword,
    deleteUser: userStore.deleteUser,
    clearSelectedUser: userStore.clearSelectedUser,
  }
}
