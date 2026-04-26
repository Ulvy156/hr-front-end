import { storeToRefs } from 'pinia'

import { useAuthStore } from '../store/authStore'

export const useAuth = () => {
  const authStore = useAuthStore()
  const { initialized, isAuthenticated, isLoading, user, employee, primaryRole, hasEmployeeRecord, canUseEmployeeSelfServiceEndpoints, roles, permissionNames, addresses, emergencyContacts, positions } =
    storeToRefs(authStore)

  return {
    user,
    currentUser: user,
    employee,
    primaryRole,
    hasEmployeeContext: hasEmployeeRecord,
    canUseEmployeeSelfService: canUseEmployeeSelfServiceEndpoints,
    roles,
    permissions: permissionNames,
    permissionNames,
    addresses,
    emergencyContacts,
    positions,
    isAuthenticated,
    isLoading,
    initialized,
    fetchMe: authStore.fetchMe,
    setUser: authStore.setUser,
    clearAuth: authStore.clearAuth,
    logout: authStore.logout,
  }
}
