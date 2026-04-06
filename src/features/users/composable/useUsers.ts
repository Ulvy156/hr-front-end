import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { ROLES, getPrimaryRole, hasRole, type Role } from '@/constants/roles'
import { useAuth } from '@/features/auth/composable/useAuth'

import { useUserStore } from '../store/userStore'

export const useUsers = () => {
  const userStore = useUserStore()
  const { currentUser } = useAuth()
  const {
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
  } = storeToRefs(userStore)

  const role = computed<Role | null>(() => {
    return getPrimaryRole(currentUser.value)
  })

  const isAdminRole = computed(() => hasRole(currentUser.value, ROLES.ADMIN))

  return {
    currentUser,
    role,
    isAdminRole,
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
    fetchUsers: userStore.fetchUsers,
    fetchUsersByUrl: userStore.fetchUsersByUrl,
    refreshUsers: userStore.refreshUsers,
    fetchRoles: userStore.fetchRoles,
    fetchUser: userStore.fetchUser,
    createUser: userStore.createUser,
    updateUser: userStore.updateUser,
    resetUserPassword: userStore.resetUserPassword,
    deleteUser: userStore.deleteUser,
    clearSelectedUser: userStore.clearSelectedUser,
  }
}
