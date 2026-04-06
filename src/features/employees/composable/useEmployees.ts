import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { ROLES, getPrimaryRole, hasRole, type Role } from '@/constants/roles'
import { useAuth } from '@/features/auth/composable/useAuth'

import { useEmployeeStore } from '../store/employeeStore'

export const useEmployees = () => {
  const employeeStore = useEmployeeStore()
  const { currentUser } = useAuth()
  const {
    employees,
    selectedEmployee,
    positions,
    filters,
    isLoading,
    isDetailLoading,
    isPositionsLoading,
    isSaving,
    isDeleting,
    isPhotoUploading,
    isExporting,
    error,
    detailError,
  } = storeToRefs(employeeStore)

  const role = computed<Role | null>(() => {
    return getPrimaryRole(currentUser.value)
  })

  const isHrRole = computed(() => hasRole(currentUser.value, ROLES.HR))
  const isAdminRole = computed(() => hasRole(currentUser.value, ROLES.ADMIN))

  return {
    currentUser,
    role,
    isHrRole,
    isAdminRole,
    employees,
    selectedEmployee,
    positions,
    filters,
    isLoading,
    isDetailLoading,
    isPositionsLoading,
    isSaving,
    isDeleting,
    isPhotoUploading,
    isExporting,
    error,
    detailError,
    normalizedListParams: employeeStore.normalizedListParams,
    normalizedExportParams: employeeStore.normalizedExportParams,
    fetchEmployees: employeeStore.fetchEmployees,
    fetchPositions: employeeStore.fetchPositions,
    fetchEmployee: employeeStore.fetchEmployee,
    createEmployee: employeeStore.createEmployee,
    updateEmployee: employeeStore.updateEmployee,
    deactivateEmployee: employeeStore.deactivateEmployee,
    restoreEmployee: employeeStore.restoreEmployee,
    activateEmployee: employeeStore.activateEmployee,
    terminateEmployee: employeeStore.terminateEmployee,
    unterminateEmployee: employeeStore.unterminateEmployee,
    uploadProfilePhoto: employeeStore.uploadProfilePhoto,
    exportEmployeesExcel: employeeStore.exportEmployeesExcel,
    resetFilters: employeeStore.resetFilters,
    clearSelectedEmployee: employeeStore.clearSelectedEmployee,
  }
}
