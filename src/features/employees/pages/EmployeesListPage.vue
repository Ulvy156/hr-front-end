<script setup lang="ts">
import { BadgeX, Download, Eye, Plus, RefreshCw, UserCheck, UserPen, UserRoundCheck, UserX } from 'lucide-vue-next'

import ActionMenu, { type ActionMenuItem } from '@/components/ui/ActionMenu.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

import EmployeeAvatar from '../components/EmployeeAvatar.vue'
import EmployeeDeleteModal from '../components/EmployeeDeleteModal.vue'
import EmployeeTerminateModal from '../components/EmployeeTerminateModal.vue'
import EmployeeUnterminateModal from '../components/EmployeeUnterminateModal.vue'
import EmployeeStatusBadge from '../components/EmployeeStatusBadge.vue'
import { useEmployees } from '../composable/useEmployees'
import type { EmployeeListItem, EmployeeTerminatePayload } from '../interface/employee.interface'
import {
  formatEmployeeDate,
  getEmployeeRequestErrorMessage,
} from '../utils/employee'

const router = useRouter()
const {
  employees,
  filters,
  isDeleting,
  isSaving,
  isExporting,
  isHrRole,
  isLoading,
  error,
  activateEmployee,
  exportEmployeesExcel,
  fetchEmployees,
  deactivateEmployee,
  resetFilters,
  terminateEmployee,
  unterminateEmployee,
} = useEmployees()

const deleteTarget = ref<EmployeeListItem | null>(null)
const terminateTarget = ref<EmployeeListItem | null>(null)
const unterminateTarget = ref<EmployeeListItem | null>(null)
type EmployeeActionCommand =
  | 'view'
  | 'edit'
  | 'deactivate'
  | 'activate'
  | 'terminate'
  | 'unterminate'

const statusOptions: BaseDropdownOption[] = [
  { label: 'All statuses', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Terminated', value: 'terminated' },
]

const employmentTypeOptions: BaseDropdownOption[] = [
  { label: 'All employment types', value: '' },
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Intern', value: 'intern' },
  { label: 'Probation', value: 'probation' },
]

const departmentOptions = computed<BaseDropdownOption[]>(() => {
  const uniqueDepartments = new Map<number, string>()

  for (const employee of employees.value?.data ?? []) {
    if (employee.department?.id && employee.department.name) {
      uniqueDepartments.set(employee.department.id, employee.department.name)
    }
  }

  return [
    { label: 'All departments', value: '' },
    ...Array.from(uniqueDepartments.entries())
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([id, name]) => ({ label: name, value: String(id) })),
  ]
})

const positionOptions = computed<BaseDropdownOption[]>(() => {
  const uniquePositions = new Map<number, string>()

  for (const employee of employees.value?.data ?? []) {
    if (employee.current_position?.id && employee.current_position.title) {
      uniquePositions.set(employee.current_position.id, employee.current_position.title)
    }
  }

  return [
    { label: 'All positions', value: '' },
    ...Array.from(uniquePositions.entries())
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([id, title]) => ({ label: title, value: String(id) })),
  ]
})

const managerOptions = computed<BaseDropdownOption[]>(() => {
  const uniqueManagers = new Map<number, string>()

  for (const employee of employees.value?.data ?? []) {
    if (employee.manager?.id && employee.manager.name) {
      uniqueManagers.set(employee.manager.id, employee.manager.name)
    }
  }

  return [
    { label: 'All managers', value: '' },
    ...Array.from(uniqueManagers.entries())
      .sort((left, right) => left[1].localeCompare(right[1]))
      .map(([id, name]) => ({ label: name, value: String(id) })),
  ]
})

const canShowPagination = computed(() => (employees.value?.meta?.last_page ?? 1) > 1)

const loadEmployees = async () => {
  try {
    await fetchEmployees()
  } catch {
    // Store state handles the error message.
  }
}

const downloadFile = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl)
  }, 0)
}

const applyFilters = async () => {
  filters.value.page = 1
  await loadEmployees()
}

const handleReset = async () => {
  resetFilters()
  await loadEmployees()
}

const handlePageChange = async (page: number) => {
  if (page === filters.value.page) {
    return
  }

  filters.value.page = page
  await loadEmployees()
}

const handlePageSizeChange = async (perPage: number) => {
  filters.value.per_page = perPage
  filters.value.page = 1
  await loadEmployees()
}

const handleSortChange = async (sort: {
  prop: string
  order: 'ascending' | 'descending' | null
}) => {
  filters.value.sort_by = sort.order ? sort.prop : 'created_at'
  filters.value.sort_direction = sort.order === 'ascending' ? 'asc' : 'desc'
  filters.value.page = 1
  await loadEmployees()
}

const openDeleteModal = (employee: EmployeeListItem) => {
  deleteTarget.value = employee
}

const closeDeleteModal = () => {
  deleteTarget.value = null
}

const openTerminateModal = (employee: EmployeeListItem) => {
  terminateTarget.value = employee
}

const closeTerminateModal = () => {
  terminateTarget.value = null
}

const openUnterminateModal = (employee: EmployeeListItem) => {
  unterminateTarget.value = employee
}

const closeUnterminateModal = () => {
  unterminateTarget.value = null
}

const confirmDelete = async () => {
  if (!deleteTarget.value) {
    return
  }

  try {
    await deactivateEmployee(deleteTarget.value.id)
    ElMessage.success('Employee deactivated successfully.')

    if ((employees.value?.data.length ?? 0) === 1 && filters.value.page > 1) {
      filters.value.page -= 1
    }

    await loadEmployees()
    closeDeleteModal()
  } catch (err) {
    ElMessage.error(getEmployeeRequestErrorMessage(err))
  }
}

const goToDetail = (employeeId: number) => {
  router.push({ name: 'employees-detail', params: { id: employeeId } })
}

const goToEdit = (employeeId: number) => {
  router.push({ name: 'employees-edit', params: { id: employeeId } })
}

const goToCreate = () => {
  router.push({ name: 'employees-create' })
}

const handleExport = async () => {
  try {
    const response = await exportEmployeesExcel()
    downloadFile(response.blob, response.filename)
  } catch (err) {
    ElMessage.error(getEmployeeRequestErrorMessage(err, 'Failed to export employees.'))
  }
}

const handleActionCommand = (
  employee: EmployeeListItem,
  command: EmployeeActionCommand,
) => {
  if (command === 'view') {
    goToDetail(employee.id)
    return
  }

  if (command === 'edit') {
    goToEdit(employee.id)
    return
  }

  if (command === 'deactivate') {
    openDeleteModal(employee)
    return
  }

  if (command === 'activate') {
    void handleActivate(employee)
    return
  }

  if (command === 'terminate') {
    openTerminateModal(employee)
    return
  }

  if (command === 'unterminate') {
    openUnterminateModal(employee)
  }
}

const handleActivate = async (employee: EmployeeListItem) => {
  if (!window.confirm(`Activate ${employee.full_name}?`)) {
    return
  }

  try {
    await activateEmployee(employee.id)
    ElMessage.success('Employee activated successfully.')
    await loadEmployees()
  } catch (err) {
    ElMessage.error(getEmployeeRequestErrorMessage(err))
  }
}

const submitTerminate = async (payload: Required<EmployeeTerminatePayload>) => {
  if (!terminateTarget.value) {
    return
  }

  try {
    await terminateEmployee(terminateTarget.value.id, payload)
    ElMessage.success('Employee terminated successfully.')
    await loadEmployees()
    closeTerminateModal()
  } catch (err) {
    ElMessage.error(getEmployeeRequestErrorMessage(err))
  }
}

const confirmUnterminate = async () => {
  if (!unterminateTarget.value) {
    return
  }

  try {
    await unterminateEmployee(unterminateTarget.value.id)
    ElMessage.success('Employee restored to active status.')
    await loadEmployees()
    closeUnterminateModal()
  } catch (err) {
    ElMessage.error(getEmployeeRequestErrorMessage(err))
  }
}

const getActionItems = (employee: EmployeeListItem): ActionMenuItem[] => {
  const items: ActionMenuItem[] = [
    {
      key: 'view',
      label: 'View',
      icon: Eye,
      tone: 'primary',
    },
  ]

  if (!isHrRole.value) {
    return items
  }

  items.push({
    key: 'edit',
    label: 'Edit',
    icon: UserPen,
    tone: 'warning',
  })

  if (employee.status === 'inactive') {
    items.push(
      {
        key: 'activate',
        label: 'Activate',
        icon: UserCheck,
        tone: 'primary',
        disabled: isSaving.value,
      },
      {
        key: 'terminate',
        label: 'Terminate',
        icon: BadgeX,
        tone: 'danger',
        disabled: isSaving.value,
      },
    )
    return items
  }

  if (employee.status === 'terminated') {
    items.push({
      key: 'unterminate',
      label: 'Unterminate',
      icon: UserRoundCheck,
      tone: 'primary',
      disabled: isSaving.value,
    })
    return items
  }

  items.push(
    {
      key: 'deactivate',
      label: 'Deactivate',
      icon: UserX,
      tone: 'danger',
      disabled: isDeleting.value,
    },
    {
      key: 'terminate',
      label: 'Terminate',
      icon: BadgeX,
      tone: 'danger',
      disabled: isSaving.value,
    },
  )

  return items
}

onMounted(async () => {
  await loadEmployees()
})
</script>

<template>
  <main class="employees-page">
    <div class="employees-header">
      <div>
        <h1 class="employees-title">Employees</h1>
        <p class="employees-subtitle">
          View employee records, check work details, and manage employee information in one place.
        </p>
      </div>

      <div class="employees-header-actions">
        <BaseButton
          v-if="isHrRole"
          :loading="isExporting"
          variant="ghost"
          @click="handleExport"
        >
          <Download :size="16" />
          Export
        </BaseButton>
        <BaseButton v-if="isHrRole" @click="goToCreate">
          <Plus :size="16" />
          Add Employee
        </BaseButton>
      </div>
    </div>

    <BaseCard class="employees-filters-card">
      <div class="employees-filters-grid">
        <BaseInput
          v-model="filters.search"
          label="Search"
          placeholder="Search by name, email, or employee code"
        />
        <BaseDropdown
          v-model="filters.status"
          :options="statusOptions"
          clearable
          label="Status"
        />
        <BaseDropdown
          v-model="filters.department_id"
          :options="departmentOptions"
          clearable
          filterable
          label="Department"
        />
        <BaseDropdown
          v-model="filters.current_position_id"
          :options="positionOptions"
          clearable
          filterable
          label="Position"
        />
        <BaseDropdown
          v-model="filters.manager_id"
          :options="managerOptions"
          clearable
          filterable
          label="Manager"
        />
        <BaseDropdown
          v-model="filters.employment_type"
          :options="employmentTypeOptions"
          clearable
          label="Employment Type"
        />
        <BaseDatePicker
          v-model="filters.hire_date_range"
          end-placeholder="To date"
          label="Hire Date Range"
          start-placeholder="From date"
          type="daterange"
          value-format="YYYY-MM-DD"
        />
      </div>

      <div class="employees-filters-actions">
        <BaseButton variant="ghost" @click="handleReset">Reset</BaseButton>
        <BaseButton variant="secondary" @click="loadEmployees">
          <RefreshCw :size="16" />
          Refresh
        </BaseButton>
        <BaseButton @click="applyFilters">Apply Filters</BaseButton>
      </div>
    </BaseCard>

    <BaseCard class="employees-table-card">
      <div v-if="error && !employees" class="employees-state">
        <h3 class="employees-state-title">Failed to load employees</h3>
        <p class="employees-state-text">{{ error }}</p>
        <BaseButton @click="loadEmployees">Try Again</BaseButton>
      </div>

      <template v-else>
        <div class="employees-table-scroll">
          <ElTable
            v-loading="isLoading"
            :data="employees?.data ?? []"
            empty-text="No employees matched the current filters."
            row-key="id"
            class="employees-table"
            @sort-change="handleSortChange"
          >
            <ElTableColumn label="Employee Code" min-width="150" prop="employee_code" sortable="custom">
              <template #default="{ row }">
                <button class="employees-link" type="button" @click="goToDetail(row.id)">
                  {{ row.employee_code || '--' }}
                </button>
              </template>
            </ElTableColumn>

            <ElTableColumn label="Name" min-width="240" prop="first_name" sortable="custom">
              <template #default="{ row }">
                <div class="employees-name-cell">
                  <EmployeeAvatar :name="row.full_name" :photo-url="row.profile_photo || row.profile_photo_path" size="sm" />
                  <div>
                    <p class="employees-name">{{ row.full_name }}</p>
                    <p class="employees-name-sub">{{ row.position?.title || row.current_position?.title || '--' }}</p>
                  </div>
                </div>
              </template>
            </ElTableColumn>

            <ElTableColumn label="Email" min-width="220" prop="email" sortable="custom" />
            <ElTableColumn label="Phone" min-width="140" prop="phone" />
            <ElTableColumn label="Department" min-width="160">
              <template #default="{ row }">
                {{ row.department?.name || '--' }}
              </template>
            </ElTableColumn>
            <!-- <ElTableColumn label="Position" min-width="160">
              <template #default="{ row }">
                {{ row.current_position?.title || row.position?.title || '--' }}
              </template>
            </ElTableColumn> -->
            <ElTableColumn label="Status" min-width="120" prop="status" sortable="custom">
              <template #default="{ row }">
                <EmployeeStatusBadge :status="row.status" />
              </template>
            </ElTableColumn>
            <ElTableColumn label="Hire Date" min-width="130" prop="hire_date" sortable="custom">
              <template #default="{ row }">
                {{ formatEmployeeDate(row.hire_date) }}
              </template>
            </ElTableColumn>
            <ElTableColumn label="Actions" min-width="100" fixed="right" align="right">
              <template #default="{ row }">
                <div class="employees-actions-cell">
                  <ActionMenu
                    :aria-label="`Open actions for ${row.full_name}`"
                    :items="getActionItems(row)"
                    @select="(command) => handleActionCommand(row, command as EmployeeActionCommand)"
                  />
                </div>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>

        <div v-if="!isLoading && !(employees?.data?.length ?? 0)" class="employees-empty-state">
          <p class="employees-state-text">No employee records are available for the current filters.</p>
        </div>

        <div v-if="canShowPagination" class="employees-pagination">
          <p class="employees-pagination-text">
            Showing {{ employees?.meta.from ?? 0 }}-{{ employees?.meta.to ?? 0 }} of
            {{ employees?.meta.total ?? 0 }}
          </p>

          <ElPagination
            :current-page="filters.page"
            :page-size="filters.per_page"
            :page-sizes="[10, 20, 50, 100]"
            :total="employees?.meta.total ?? 0"
            background
            layout="prev, pager, next, sizes"
            @current-change="handlePageChange"
            @size-change="handlePageSizeChange"
          />
        </div>
      </template>
    </BaseCard>

    <EmployeeDeleteModal
      :employee-name="deleteTarget?.full_name"
      :loading="isDeleting"
      :open="Boolean(deleteTarget)"
      @close="closeDeleteModal"
      @confirm="confirmDelete"
    />
    <EmployeeTerminateModal
      :employee-name="terminateTarget?.full_name"
      :loading="isSaving"
      :open="Boolean(terminateTarget)"
      @close="closeTerminateModal"
      @confirm="submitTerminate"
    />
    <EmployeeUnterminateModal
      :employee-name="unterminateTarget?.full_name"
      :loading="isSaving"
      :open="Boolean(unterminateTarget)"
      @close="closeUnterminateModal"
      @confirm="confirmUnterminate"
    />
  </main>
</template>

<style scoped>
.employees-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.employees-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.employees-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.employees-title {
  color: hsl(var(--foreground));
}

.employees-subtitle,
.employees-name-sub,
.employees-state-text,
.employees-pagination-text {
  color: hsl(var(--muted-foreground));
}

.employees-filters-card,
.employees-table-card {
  overflow: hidden;
}

.employees-filters-grid {
  display: grid;
  grid-template-columns: repeat(7, minmax(0, 1fr));
  gap: 1rem;
  padding: 1.25rem;
}

.employees-filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0 1.25rem 1.25rem;
}

.employees-table {
  width: 100%;
  min-width: 1520px;
}

.employees-table-scroll {
  overflow-x: auto;
}

.employees-name-cell {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.employees-name {
  color: hsl(var(--foreground));
  font-size: var(--text-sm);
  font-weight: 700;
}

.employees-link {
  border: 0;
  background: transparent;
  color: hsl(var(--primary));
  cursor: pointer;
  font: inherit;
  font-weight: 700;
  padding: 0;
}

.employees-link:hover {
  text-decoration: underline;
}

.employees-actions-cell {
  display: flex;
  align-items: center;
  justify-content: flex-end;
}

.employees-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem 1.25rem;
}

.employees-state,
.employees-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 20rem;
  padding: 1.5rem;
  text-align: center;
}

.employees-state-title {
  color: hsl(var(--foreground));
}
</style>
