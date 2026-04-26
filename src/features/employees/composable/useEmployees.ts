import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { useAuth } from '@/features/auth/composable/useAuth'
import { usePermission } from '@/features/auth/composable/usePermission'
import { PERMISSIONS } from '@/constants/permissions'

import { useEmployeeStore } from '../store/employeeStore'

export const useEmployees = () => {
  const employeeStore = useEmployeeStore()
  const { currentUser } = useAuth()
  const { hasAllPermissions, hasPermission } = usePermission()
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

  const canManageEmployees = computed(() => hasPermission(PERMISSIONS.EMPLOYEE_MANAGE))
  const canManageEmployeeProfiles = computed(() =>
    hasAllPermissions([
      PERMISSIONS.EMPLOYEE_MANAGE,
      PERMISSIONS.EMPLOYEE_USER_LINK_VIEW,
      PERMISSIONS.POSITION_VIEW,
      PERMISSIONS.LOCATION_VIEW,
    ]),
  )
  const canExportEmployees = computed(() => hasPermission(PERMISSIONS.EMPLOYEE_EXPORT))

  return {
    currentUser,
    canManageEmployees,
    canManageEmployeeProfiles,
    canExportEmployees,
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
