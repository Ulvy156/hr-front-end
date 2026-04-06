<script setup lang="ts">
import { Eye, KeyRound, Pencil, Plus, RefreshCw, Trash2 } from 'lucide-vue-next'

import ActionMenu, { type ActionMenuItem } from '@/components/ui/ActionMenu.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseTable, { type BaseTableColumn } from '@/components/ui/BaseTable.vue'

import UserDeleteModal from '../components/UserDeleteModal.vue'
import UserDetailsModal from '../components/UserDetailsModal.vue'
import UserFormModal from '../components/UserFormModal.vue'
import UserResetPasswordModal from '../components/UserResetPasswordModal.vue'
import { useUsers } from '../composable/useUsers'
import type {
  UserAccount,
  UserCreatePayload,
  UserListParams,
  UserResetPasswordPayload,
  UserUpdatePayload,
} from '../interface/user.interface'
import {
  createDefaultUserFilters,
  formatUserDate,
  formatUserLabel,
  getUserRequestErrorMessage,
  getUserSuccessMessage,
} from '../utils/user'

type UserActionCommand = 'view' | 'edit' | 'reset-password' | 'delete'

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
} = useUsers()

const filters = reactive(createDefaultUserFilters())
const userFormMode = ref<'create' | 'edit'>('create')
const isUserFormOpen = ref(false)
const isDetailsOpen = ref(false)
const isResetPasswordOpen = ref(false)
const isDeleteOpen = ref(false)
const activeUserId = ref<number | null>(null)

const tableColumns: BaseTableColumn[] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'roles', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'employee', label: 'Linked Employee' },
  { key: 'created_at', label: 'Created At' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

const perPageOptions: BaseDropdownOption[] = [
  { label: '10 per page', value: 10 },
  { label: '20 per page', value: 20 },
  { label: '50 per page', value: 50 },
]

const employeeStatusOptions: BaseDropdownOption[] = [
  { label: 'All employee statuses', value: '' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Terminated', value: 'terminated' },
]

const roleOptions = computed<BaseDropdownOption[]>(() => [
  { label: 'All roles', value: '' },
  ...roles.value.map((role) => ({
    label: role.description || formatUserLabel(role.name),
    value: String(role.id),
  })),
])

const hasUsers = computed(() => (users.value?.data.length ?? 0) > 0)
const userRows = computed(() => users.value?.data ?? [])
const pageSummary = computed(() => {
  if (!users.value?.meta) {
    return 'No users loaded.'
  }

  const { from, to, total, current_page, last_page } = users.value.meta

  return `Showing ${from ?? 0}-${to ?? 0} of ${total} users • Page ${current_page} of ${last_page}`
})

const buildListParams = (): UserListParams => {
  const params: UserListParams = {
    per_page: filters.per_page,
  }
  const trimmedSearch = filters.search.trim()
  const trimmedStatus = filters.employee_status.trim()
  const roleId = Number(filters.role_id)
  const employeeId = Number(filters.employee_id)

  if (trimmedSearch) {
    params.search = trimmedSearch
  }

  if (Number.isFinite(roleId) && roleId > 0) {
    params.role_id = roleId
  }

  if (trimmedStatus) {
    params.employee_status = trimmedStatus
  }

  if (Number.isFinite(employeeId) && employeeId > 0) {
    params.employee_id = employeeId
  }

  return params
}

const loadUsers = async () => {
  try {
    await fetchUsers(buildListParams())
  } catch {
    // Store state powers the visible error.
  }
}

const loadRoles = async () => {
  try {
    await fetchRoles()
  } catch (err) {
    ElMessage.error(getUserRequestErrorMessage(err, 'Failed to load roles.'))
  }
}

const refreshList = async () => {
  try {
    await refreshUsers()
  } catch {
    // Store state powers the visible error.
  }
}

const applyFilters = async () => {
  await loadUsers()
}

const resetFilters = async () => {
  Object.assign(filters, createDefaultUserFilters())
  await loadUsers()
}

const handleNavigateByUrl = async (url: string | null) => {
  if (!url) {
    return
  }

  try {
    await fetchUsersByUrl(url)
  } catch {
    // Store state powers the visible error.
  }
}

const openCreateModal = () => {
  userFormMode.value = 'create'
  activeUserId.value = null
  clearSelectedUser()
  isUserFormOpen.value = true
}

const openEditModal = async (user: UserAccount) => {
  userFormMode.value = 'edit'
  activeUserId.value = user.id
  selectedUser.value = user
  isUserFormOpen.value = true

  try {
    await fetchUser(user.id)
  } catch (err) {
    ElMessage.error(getUserRequestErrorMessage(err, 'Failed to load the selected user.'))
  }
}

const retryEditLoad = async () => {
  if (!activeUserId.value) {
    return
  }

  try {
    await fetchUser(activeUserId.value)
  } catch (err) {
    ElMessage.error(getUserRequestErrorMessage(err, 'Failed to load the selected user.'))
  }
}

const openDetailsModal = async (user: UserAccount) => {
  activeUserId.value = user.id
  isDetailsOpen.value = true

  try {
    await fetchUser(user.id)
  } catch (err) {
    ElMessage.error(getUserRequestErrorMessage(err, 'Failed to load user details.'))
  }
}

const retryDetailsLoad = async () => {
  if (!activeUserId.value) {
    return
  }

  try {
    await fetchUser(activeUserId.value)
  } catch (err) {
    ElMessage.error(getUserRequestErrorMessage(err, 'Failed to load user details.'))
  }
}

const openResetPasswordModal = (user: UserAccount) => {
  activeUserId.value = user.id
  selectedUser.value = user
  isResetPasswordOpen.value = true
}

const openDeleteModal = (user: UserAccount) => {
  activeUserId.value = user.id
  selectedUser.value = user
  isDeleteOpen.value = true
}

const closeUserFormModal = () => {
  isUserFormOpen.value = false
  activeUserId.value = null
  clearSelectedUser()
}

const closeDetailsModal = () => {
  isDetailsOpen.value = false
  activeUserId.value = null
  clearSelectedUser()
}

const closeResetPasswordModal = () => {
  isResetPasswordOpen.value = false
  activeUserId.value = null
  clearSelectedUser()
}

const closeDeleteModal = () => {
  isDeleteOpen.value = false
  activeUserId.value = null
  clearSelectedUser()
}

const handleSaveUser = async (payload: UserCreatePayload | UserUpdatePayload) => {
  try {
    if (userFormMode.value === 'create') {
      const response = await createUser(payload as UserCreatePayload)
      ElMessage.success(getUserSuccessMessage(response, 'User created successfully.'))
    } else if (activeUserId.value) {
      const response = await updateUser(activeUserId.value, payload as UserUpdatePayload)
      ElMessage.success(getUserSuccessMessage(response, 'User updated successfully.'))
    }

    closeUserFormModal()
    await refreshList()
  } catch (err) {
    ElMessage.error(getUserRequestErrorMessage(err))
  }
}

const handleResetPassword = async (payload: UserResetPasswordPayload) => {
  if (!activeUserId.value) {
    return
  }

  try {
    const response = await resetUserPassword(activeUserId.value, payload)
    ElMessage.success(getUserSuccessMessage(response, 'Password reset successfully.'))
    closeResetPasswordModal()
  } catch (err) {
    ElMessage.error(getUserRequestErrorMessage(err))
  }
}

const handleDeleteUser = async () => {
  if (!activeUserId.value) {
    return
  }

  try {
    await deleteUser(activeUserId.value)
    ElMessage.success('User deleted successfully.')
    closeDeleteModal()
    await refreshList()

    if (!users.value?.data.length && users.value?.links.prev) {
      await handleNavigateByUrl(users.value.links.prev)
    }
  } catch (err) {
    ElMessage.error(getUserRequestErrorMessage(err))
  }
}

const getStatusVariant = (value: string | null | undefined) => {
  if (value === 'active') return 'success'
  if (value === 'inactive') return 'warning'
  if (value === 'terminated') return 'danger'
  return 'default'
}

const getRoleVariant = (value: string | null | undefined) => {
  if (value === 'admin') return 'primary'
  if (value === 'hr') return 'warning'
  return 'default'
}

const getUserActions = (user: UserAccount): ActionMenuItem[] => [
  { key: `view:${user.id}`, label: 'View Details', icon: Eye },
  { key: `edit:${user.id}`, label: 'Edit User', icon: Pencil },
  { key: `reset-password:${user.id}`, label: 'Reset Password', icon: KeyRound },
  { key: `delete:${user.id}`, label: 'Delete User', icon: Trash2, tone: 'danger' },
]

const asUserAccount = (row: Record<string, unknown>) => row as unknown as UserAccount

const handleActionSelect = (user: UserAccount, actionKey: string) => {
  const [command] = actionKey.split(':') as [UserActionCommand]

  if (command === 'view') {
    void openDetailsModal(user)
    return
  }

  if (command === 'edit') {
    void openEditModal(user)
    return
  }

  if (command === 'reset-password') {
    openResetPasswordModal(user)
    return
  }

  if (command === 'delete') {
    openDeleteModal(user)
  }
}

onMounted(async () => {
  await Promise.all([loadUsers(), loadRoles()])
})
</script>

<template>
  <main class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-3xl font-semibold text-slate-950">Users</h1>
      <p class="text-sm text-slate-500">
        Manage system user accounts, assigned roles, and linked employees using the admin user APIs.
      </p>
    </div>

    <BaseCard class="border border-slate-200 shadow-sm">
      <div class="flex flex-col gap-4 p-5 lg:flex-row lg:items-end lg:justify-between">
        <div class="grid flex-1 grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <BaseInput v-model="filters.search" label="Search" placeholder="Search by name or email" />
          <BaseDropdown
            v-model="filters.role_id"
            :loading="isRolesLoading"
            :options="roleOptions"
            filterable
            label="Role"
            placeholder="All roles"
          />
          <BaseDropdown
            v-model="filters.employee_status"
            :options="employeeStatusOptions"
            label="Employee Status"
            placeholder="All employee statuses"
          />
          <BaseInput
            v-model="filters.employee_id"
            label="Employee ID"
            placeholder="Filter by employee ID"
            type="number"
          />
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <div class="min-w-40">
            <BaseDropdown
              v-model="filters.per_page"
              :clearable="false"
              :options="perPageOptions"
              label="Rows"
            />
          </div>
          <BaseButton variant="ghost" @click="resetFilters">Reset</BaseButton>
          <BaseButton variant="secondary" @click="applyFilters">Apply Filters</BaseButton>
          <BaseButton variant="secondary" @click="refreshList">
            <RefreshCw :size="16" />
            Refresh
          </BaseButton>
          <BaseButton @click="openCreateModal">
            <Plus :size="16" />
            New User
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <BaseCard class="border border-slate-200 shadow-sm">
      <div class="space-y-4 p-5">
        <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">User Directory</h2>
            <p class="text-sm text-slate-500">{{ pageSummary }}</p>
          </div>

          <div v-if="users?.meta" class="flex flex-wrap items-center gap-2">
            <BaseButton
              :disabled="!users.links.first || isLoading"
              variant="ghost"
              @click="handleNavigateByUrl(users.links.first)"
            >
              First
            </BaseButton>
            <BaseButton
              :disabled="!users.links.prev || isLoading"
              variant="ghost"
              @click="handleNavigateByUrl(users.links.prev)"
            >
              Previous
            </BaseButton>
            <BaseButton
              :disabled="!users.links.next || isLoading"
              variant="ghost"
              @click="handleNavigateByUrl(users.links.next)"
            >
              Next
            </BaseButton>
            <BaseButton
              :disabled="!users.links.last || isLoading"
              variant="ghost"
              @click="handleNavigateByUrl(users.links.last)"
            >
              Last
            </BaseButton>
          </div>
        </div>

        <div v-if="isLoading && !hasUsers" class="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <BaseSpinner />
        </div>

        <div v-else-if="error && !hasUsers" class="flex min-h-72 flex-col items-center justify-center gap-3 rounded-2xl border border-red-100 bg-red-50/40 p-8 text-center">
          <h3 class="text-lg font-semibold text-slate-900">Unable to load users</h3>
          <p class="max-w-md text-sm text-slate-500">{{ error }}</p>
          <BaseButton @click="loadUsers">Try Again</BaseButton>
        </div>

        <div v-else class="space-y-4">
          <BaseTable
            :columns="tableColumns"
            :rows="userRows"
            empty-text="No users match the current filters."
          >
            <template #cell-name="{ row }">
              <div class="space-y-1">
                <p class="font-medium text-slate-900">{{ row.name }}</p>
                <p class="text-xs text-slate-500">User #{{ row.id }}</p>
              </div>
            </template>

            <template #cell-email="{ value, row }">
              <div class="space-y-1">
                <p class="text-sm text-slate-900">{{ value }}</p>
                <p class="text-xs text-slate-500">
                  Verified: {{ formatUserDate(row.email_verified_at as string | null) }}
                </p>
              </div>
            </template>

            <template #cell-roles="{ value }">
              <div class="flex flex-wrap gap-2">
                <BaseBadge
                  v-for="role in (value as UserAccount['roles'])"
                  :key="role.id"
                  :variant="getRoleVariant(role.name)"
                >
                  {{ role.description || formatUserLabel(role.name) }}
                </BaseBadge>
              </div>
            </template>

            <template #cell-status="{ row }">
              <BaseBadge :variant="getStatusVariant((row.employee as UserAccount['employee'])?.status)">
                {{ formatUserLabel((row.employee as UserAccount['employee'])?.status) }}
              </BaseBadge>
            </template>

            <template #cell-employee="{ row }">
              <div class="space-y-1">
                <p class="text-sm font-medium text-slate-900">
                  {{ (row.employee as UserAccount['employee'])?.full_name || '--' }}
                </p>
                <p class="text-xs text-slate-500">
                  {{
                    (row.employee as UserAccount['employee'])?.employee_code ||
                    (row.employee_id as number | null) ||
                    '--'
                  }}
                </p>
              </div>
            </template>

            <template #cell-created_at="{ value }">
              <span class="text-sm text-slate-600">{{ formatUserDate(value as string | null) }}</span>
            </template>

            <template #cell-actions="{ row }">
              <div class="flex justify-end">
                <ActionMenu
                  :aria-label="`Actions for ${(row.name as string) || 'user'}`"
                  :items="getUserActions(asUserAccount(row))"
                  @select="handleActionSelect(asUserAccount(row), $event)"
                />
              </div>
            </template>
          </BaseTable>

          <div
            v-if="users?.meta && users.meta.total > 0"
            class="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 md:flex-row md:items-center md:justify-between"
          >
            <p>{{ pageSummary }}</p>
            <p>Filters supported: search, role_id, employee_status, employee_id, per_page.</p>
          </div>
        </div>
      </div>
    </BaseCard>

    <UserFormModal
      :open="isUserFormOpen"
      :mode="userFormMode"
      :user="selectedUser"
      :roles="roles"
      :roles-loading="isRolesLoading"
      :loading="userFormMode === 'edit' && isDetailLoading"
      :error="userFormMode === 'edit' ? detailError : ''"
      :submitting="isSaving"
      @close="closeUserFormModal"
      @retry="retryEditLoad"
      @save="handleSaveUser"
    />

    <UserDetailsModal
      :open="isDetailsOpen"
      :user="selectedUser"
      :loading="isDetailLoading"
      :error="detailError"
      @close="closeDetailsModal"
      @retry="retryDetailsLoad"
    />

    <UserResetPasswordModal
      :open="isResetPasswordOpen"
      :submitting="isResettingPassword"
      :user="selectedUser"
      @close="closeResetPasswordModal"
      @confirm="handleResetPassword"
    />

    <UserDeleteModal
      :open="isDeleteOpen"
      :loading="isDeleting"
      :user="selectedUser"
      @close="closeDeleteModal"
      @confirm="handleDeleteUser"
    />
  </main>
</template>
