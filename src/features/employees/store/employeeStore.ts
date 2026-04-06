import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'

import type {
  EmployeeDetail,
  EmployeeExportParams,
  EmployeeListFiltersState,
  EmployeeListParams,
  EmployeeListResponse,
  EmployeePosition,
  EmployeeTerminatePayload,
  EmployeeUpsertPayload,
} from '../interface/employee.interface'
import { employeeService } from '../services/employeeService'
import { createDefaultEmployeeFilters } from '../utils/employee'

export const useEmployeeStore = defineStore('employees', () => {
  const employees = ref<EmployeeListResponse | null>(null)
  const selectedEmployee = ref<EmployeeDetail | null>(null)
  const positions = ref<EmployeePosition[]>([])
  const filters = reactive<EmployeeListFiltersState>(createDefaultEmployeeFilters())
  const isLoading = ref(false)
  const isDetailLoading = ref(false)
  const isPositionsLoading = ref(false)
  const isSaving = ref(false)
  const isDeleting = ref(false)
  const isPhotoUploading = ref(false)
  const isExporting = ref(false)
  const error = ref('')
  const detailError = ref('')

  const normalizedListParams = (): EmployeeListParams => ({
    search: filters.search.trim() || undefined,
    status: filters.status || undefined,
    department_id: filters.department_id ? Number(filters.department_id) : undefined,
    current_position_id: filters.current_position_id
      ? Number(filters.current_position_id)
      : undefined,
    manager_id: filters.manager_id ? Number(filters.manager_id) : undefined,
    employment_type: filters.employment_type || undefined,
    hire_date_from: filters.hire_date_range?.[0] ?? undefined,
    hire_date_to: filters.hire_date_range?.[1] ?? undefined,
    sort_by: filters.sort_by || undefined,
    sort_direction: filters.sort_direction,
    page: filters.page,
    per_page: filters.per_page,
  })

  const fetchEmployees = async (params?: EmployeeListParams) => {
    isLoading.value = true
    error.value = ''

    try {
      const response = await employeeService.getEmployees(params ?? normalizedListParams())
      employees.value = response
      return response
    } catch (err) {
      employees.value = null
      error.value = err instanceof Error ? err.message : 'Failed to load employees.'
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const fetchPositions = async () => {
    isPositionsLoading.value = true

    try {
      const response = await employeeService.getPositions()
      positions.value = response.data
      return response.data
    } finally {
      isPositionsLoading.value = false
    }
  }

  const normalizedExportParams = (): EmployeeExportParams => ({
    search: filters.search.trim() || undefined,
    status: filters.status || undefined,
    department_id: filters.department_id ? Number(filters.department_id) : undefined,
    current_position_id: filters.current_position_id
      ? Number(filters.current_position_id)
      : undefined,
    manager_id: filters.manager_id ? Number(filters.manager_id) : undefined,
    employment_type: filters.employment_type || undefined,
    hire_date_from: filters.hire_date_range?.[0] ?? undefined,
    hire_date_to: filters.hire_date_range?.[1] ?? undefined,
    sort_by: filters.sort_by || undefined,
    sort_direction: filters.sort_direction,
  })

  const fetchEmployee = async (id: number, params?: { include?: string[] | string }) => {
    isDetailLoading.value = true
    detailError.value = ''

    try {
      const response = await employeeService.getEmployee(id, params)
      selectedEmployee.value = response
      return response
    } catch (err) {
      selectedEmployee.value = null
      detailError.value = err instanceof Error ? err.message : 'Failed to load employee details.'
      throw err
    } finally {
      isDetailLoading.value = false
    }
  }

  const createEmployee = async (payload: EmployeeUpsertPayload) => {
    isSaving.value = true

    try {
      const response = await employeeService.createEmployee(payload)
      selectedEmployee.value = response
      return response
    } finally {
      isSaving.value = false
    }
  }

  const updateEmployee = async (id: number, payload: EmployeeUpsertPayload) => {
    isSaving.value = true

    try {
      const response = await employeeService.updateEmployee(id, payload)
      selectedEmployee.value = response
      return response
    } finally {
      isSaving.value = false
    }
  }

  const deactivateEmployee = async (id: number) => {
    isDeleting.value = true

    try {
      const response = await employeeService.deactivateEmployee(id)
      selectedEmployee.value = response
      return response
    } finally {
      isDeleting.value = false
    }
  }

  const restoreEmployee = async (id: number) => {
    isSaving.value = true

    try {
      const response = await employeeService.restoreEmployee(id)
      selectedEmployee.value = response
      return response
    } finally {
      isSaving.value = false
    }
  }

  const activateEmployee = async (id: number) => {
    isSaving.value = true

    try {
      const response = await employeeService.activateEmployee(id)
      selectedEmployee.value = response
      return response
    } finally {
      isSaving.value = false
    }
  }

  const terminateEmployee = async (id: number, payload?: EmployeeTerminatePayload) => {
    isSaving.value = true

    try {
      const response = await employeeService.terminateEmployee(id, payload)
      selectedEmployee.value = response
      return response
    } finally {
      isSaving.value = false
    }
  }

  const unterminateEmployee = async (id: number) => {
    isSaving.value = true

    try {
      const response = await employeeService.unterminateEmployee(id)
      selectedEmployee.value = response
      return response
    } finally {
      isSaving.value = false
    }
  }

  const uploadProfilePhoto = async (id: number, file: File) => {
    isPhotoUploading.value = true

    try {
      const response = await employeeService.uploadProfilePhoto(id, file)
      selectedEmployee.value = response.employee
      return response
    } finally {
      isPhotoUploading.value = false
    }
  }

  const exportEmployeesExcel = async (params?: EmployeeExportParams) => {
    isExporting.value = true

    try {
      return await employeeService.exportEmployeesExcel(params ?? normalizedExportParams())
    } finally {
      isExporting.value = false
    }
  }

  const resetFilters = () => {
    Object.assign(filters, createDefaultEmployeeFilters())
  }

  const clearSelectedEmployee = () => {
    selectedEmployee.value = null
    detailError.value = ''
  }

  return {
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
    normalizedListParams,
    normalizedExportParams,
    fetchEmployees,
    fetchPositions,
    fetchEmployee,
    createEmployee,
    updateEmployee,
    deactivateEmployee,
    restoreEmployee,
    activateEmployee,
    terminateEmployee,
    unterminateEmployee,
    uploadProfilePhoto,
    exportEmployeesExcel,
    resetFilters,
    clearSelectedEmployee,
  }
})
