<script setup lang="ts">
import { Eye, KeyRound, Pencil, Plus, RefreshCw, ShieldCheck, Trash2 } from 'lucide-vue-next'

import ActionMenu, { type ActionMenuItem } from '@/components/ui/ActionMenu.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseTable, { type BaseTableColumn } from '@/components/ui/BaseTable.vue'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermission } from '@/features/auth/composable/usePermission'

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
  getUserDisplayName,
  getUserRequestErrorMessage,
  getUserSuccessMessage,
  USER_MANAGEMENT_LABELS,
} from '../utils/user'

type UserActionCommand = 'view' | 'edit' | 'permissions' | 'reset-password' | 'delete'

const router = useRouter()
const { hasPermission } = usePermission()
const canManageUsers = computed(() => hasPermission(PERMISSIONS.USER_MANAGE))
const canManageUserAccess = computed(() => {
  return (
    hasPermission(PERMISSIONS.USER_VIEW) &&
    hasPermission(PERMISSIONS.ROLE_VIEW) &&
    hasPermission(PERMISSIONS.PERMISSION_VIEW) &&
    (
      hasPermission(PERMISSIONS.USER_ROLE_ASSIGN) ||
      hasPermission(PERMISSIONS.USER_PERMISSION_ASSIGN)
    )
  )
})

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
  { key: 'roles', label: USER_MANAGEMENT_LABELS.userType },
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
  { label: `All ${USER_MANAGEMENT_LABELS.userTypes.toLowerCase()}`, value: '' },
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

  return `Showing ${from ?? 0}-${to ?? 0} of ${total} users | Page ${current_page} of ${last_page}`
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

const getUserActions = (user: UserAccount): ActionMenuItem[] => {
  const items: ActionMenuItem[] = []

  if (canManageUsers.value) {
    items.push(
      { key: `view:${user.id}`, label: 'View Details', icon: Eye },
      { key: `edit:${user.id}`, label: 'Edit User', icon: Pencil },
    )
  }

  if (canManageUserAccess.value) {
    items.push({
      key: `permissions:${user.id}`,
      label: 'Manage Access',
      icon: ShieldCheck,
    })
  }

  if (canManageUsers.value) {
    items.push(
      { key: `reset-password:${user.id}`, label: 'Reset Password', icon: KeyRound },
      { key: `delete:${user.id}`, label: 'Delete User', icon: Trash2, tone: 'danger' },
    )
  }

  return items
}

const asUserAccount = (row: Record<string, unknown>) => row as unknown as UserAccount

const openPermissionsPage = async (user: UserAccount) => {
  await router.push({
    name: 'user-permissions',
    params: {
      id: user.id,
    },
  })
}

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

  if (command === 'permissions') {
    void openPermissionsPage(user)
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
  <main class="users-page">
    <header class="users-page-header">
      <div class="users-page-copy">
        <h1 class="users-page-title">Users</h1>
        <p class="users-page-subtitle">
          View users, choose a user type, and connect each account to the right employee.
        </p>
      </div>

      <div class="users-page-header-actions">
        <BaseButton v-if="canManageUsers" @click="openCreateModal">
          <Plus :size="16" />
          New User
        </BaseButton>
      </div>
    </header>

    <BaseCard class="users-toolbar-card">
      <div class="users-toolbar">
        <div class="users-toolbar-filters">
          <div class="users-toolbar-filter users-toolbar-filter-search">
            <BaseInput v-model="filters.search" label="Search" placeholder="Search by name or email" size="large" />
          </div>
          <div class="users-toolbar-filter">
            <BaseDropdown
              v-model="filters.role_id"
              :loading="isRolesLoading"
              :options="roleOptions"
              filterable
              :label="USER_MANAGEMENT_LABELS.userType"
              :placeholder="`All ${USER_MANAGEMENT_LABELS.userTypes.toLowerCase()}`"
            />
          </div>
          <div class="users-toolbar-filter">
            <BaseDropdown
              v-model="filters.employee_status"
              :options="employeeStatusOptions"
              label="Employee Status"
              placeholder="All employee statuses"
            />
          </div>
          <div class="users-toolbar-filter">
            <BaseInput
              v-model="filters.employee_id"
              label="Employee ID"
              placeholder="Filter by employee ID"
              size="large"
              type="number"
            />
          </div>
          <div class="users-toolbar-filter users-toolbar-filter-rows">
            <BaseDropdown
              v-model="filters.per_page"
              :clearable="false"
              :options="perPageOptions"
              label="Rows"
            />
          </div>
        </div>

        <div class="users-toolbar-actions">
          <BaseButton variant="ghost" @click="resetFilters">Reset</BaseButton>
          <BaseButton variant="ghost" @click="refreshList">
            <RefreshCw :size="16" />
            Refresh
          </BaseButton>
          <BaseButton variant="secondary" @click="applyFilters">Apply Filters</BaseButton>
        </div>
      </div>
    </BaseCard>

    <BaseCard class="users-table-card">
      <div class="users-table-card-body">
        <div class="users-table-topbar">
          <div class="users-table-heading">
            <h2 class="users-table-title">User Directory</h2>
            <p class="users-table-summary">{{ pageSummary }}</p>
          </div>

          <div v-if="users?.meta" class="users-pagination-controls">
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

        <div v-if="isLoading && !hasUsers" class="users-state">
          <BaseSpinner />
        </div>

        <div v-else-if="error && !hasUsers" class="users-state users-state-error">
          <h3 class="users-state-title">Unable to load users</h3>
          <p class="users-state-text">{{ error }}</p>
          <BaseButton @click="loadUsers">Try Again</BaseButton>
        </div>

        <div v-else class="users-table-content">
          <BaseTable
            :columns="tableColumns"
            :rows="userRows"
            empty-text="No users match the current filters."
          >
            <template #cell-name="{ row }">
              <div class="users-cell-stack">
                <p class="users-cell-title">{{ getUserDisplayName(asUserAccount(row)) }}</p>
                <p class="users-cell-subtext">User #{{ row.id }}</p>
              </div>
            </template>

            <template #cell-email="{ value, row }">
              <div class="users-cell-stack">
                <p class="users-cell-text">{{ value }}</p>
                <p class="users-cell-subtext">
                  Verified: {{ formatUserDate(row.email_verified_at as string | null) }}
                </p>
              </div>
            </template>

            <template #cell-roles="{ value }">
              <div class="users-badge-group">
                <BaseBadge
                  v-for="role in (value as UserAccount['roles'])"
                  :key="role.id"
                  :variant="getRoleVariant(role.name)"
                  class="users-role-badge"
                >
                  {{ role.description || formatUserLabel(role.name) }}
                </BaseBadge>
              </div>
            </template>

            <template #cell-status="{ row }">
              <BaseBadge
                :variant="getStatusVariant((row.employee as UserAccount['employee'])?.status)"
                class="users-status-badge"
              >
                {{ formatUserLabel((row.employee as UserAccount['employee'])?.status) }}
              </BaseBadge>
            </template>

            <template #cell-employee="{ row }">
              <div class="users-cell-stack">
                <p class="users-cell-title users-cell-title-compact">
                  {{ (row.employee as UserAccount['employee'])?.full_name || '--' }}
                </p>
                <p class="users-cell-subtext">
                  {{
                    (row.employee as UserAccount['employee'])?.employee_code ||
                    (row.employee_id as number | null) ||
                    '--'
                  }}
                </p>
              </div>
            </template>

            <template #cell-created_at="{ value }">
              <span class="users-cell-text users-created-at">{{ formatUserDate(value as string | null) }}</span>
            </template>

            <template #cell-actions="{ row }">
              <div class="users-actions-cell">
                <ActionMenu
                  :aria-label="`Actions for ${getUserDisplayName(asUserAccount(row), 'user')}`"
                  :items="getUserActions(asUserAccount(row))"
                  @select="handleActionSelect(asUserAccount(row), $event)"
                />
              </div>
            </template>
          </BaseTable>

          <div
            v-if="users?.meta && users.meta.total > 0"
            class="users-table-footer"
          >
            <p class="users-table-footer-text">{{ pageSummary }}</p>
            <p class="users-table-footer-text users-table-footer-note">
              Filters: name, email, user type, status, employee ID, and rows per page.
            </p>
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

<style scoped>
.users-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.users-page-header,
.users-table-topbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.users-page-copy,
.users-table-heading,
.users-cell-stack {
  display: flex;
  flex-direction: column;
}

.users-page-copy,
.users-table-heading,
.users-cell-stack {
  gap: 0.2rem;
}

.users-page-header {
  margin-bottom: 0.15rem;
}

.users-page-header-actions,
.users-toolbar-actions,
.users-pagination-controls,
.users-badge-group {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.users-page-title,
.users-table-title,
.users-state-title,
.users-cell-title,
.users-cell-text {
  color: hsl(var(--foreground));
}

.users-page-title {
  font-size: 1.9rem;
  font-weight: 700;
  line-height: 1.1;
}

.users-page-subtitle,
.users-table-summary,
.users-state-text,
.users-cell-subtext,
.users-table-footer-text {
  color: hsl(var(--muted-foreground));
}

.users-page-subtitle,
.users-table-summary,
.users-table-footer-text {
  font-size: var(--text-sm);
}

.users-toolbar-card,
.users-table-card {
  overflow: hidden;
  border: 1px solid hsl(var(--border-gray));
  box-shadow: var(--shadow-card);
}

.users-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.875rem 1rem;
  padding: 1rem 1.1rem;
}

.users-toolbar-filters {
  display: grid;
  grid-template-columns: minmax(15rem, 1.5fr) repeat(4, minmax(10.5rem, 1fr));
  flex: 1;
  gap: 0.85rem;
}

.users-toolbar-filter {
  min-width: 0;
}

.users-toolbar-filter-search {
  min-width: 15rem;
}

.users-toolbar-filter-rows {
  min-width: 8rem;
}

.users-toolbar-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.users-table-card-body {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  padding: 1rem 1.1rem 1.05rem;
}

.users-table-topbar {
  align-items: center;
  padding-bottom: 0.2rem;
}

.users-table-title {
  font-size: 1rem;
  font-weight: 700;
}

.users-pagination-controls {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.users-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 16rem;
  padding: 1rem;
  text-align: center;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 1rem;
  background: hsl(var(--card));
}

.users-state-error {
  border-color: hsl(var(--destructive) / 0.18);
  background: hsl(var(--destructive) / 0.04);
}

.users-state-text {
  max-width: 36rem;
}

.users-table-content {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

.users-cell-title {
  font-size: var(--text-sm);
  font-weight: 700;
  line-height: 1.35;
}

.users-cell-title-compact {
  font-weight: 600;
}

.users-cell-text {
  font-size: var(--text-sm);
  line-height: 1.35;
}

.users-cell-subtext {
  font-size: var(--text-xs);
  line-height: 1.35;
}

.users-badge-group {
  flex-wrap: wrap;
  gap: 0.45rem;
}

.users-role-badge,
.users-status-badge {
  min-height: 1.75rem;
  font-size: 0.72rem;
}

.users-created-at {
  white-space: nowrap;
}

.users-actions-cell {
  display: flex;
  justify-content: flex-end;
}

.users-table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.85rem 1rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 1rem;
  background: hsl(var(--secondary) / 0.14);
}

.users-table-footer-note {
  text-align: right;
}

.users-table-card :deep(.base-table-shell) {
  border: 1px solid hsl(var(--border-gray));
  box-shadow: none;
}

.users-table-card :deep(.base-table th),
.users-table-card :deep(.base-table td) {
  padding: 0.72rem 0.85rem;
}

.users-table-card :deep(.base-table th) {
  font-size: 0.7rem;
  letter-spacing: 0.03em;
}

.users-table-card :deep(.base-table tbody tr:hover) {
  background: hsl(var(--secondary) / 0.24);
}

@media (max-width: 1280px) {
  .users-toolbar-filters {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .users-page-header,
  .users-table-topbar,
  .users-table-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .users-page-header-actions,
  .users-toolbar-actions,
  .users-pagination-controls {
    justify-content: flex-start;
  }

  .users-toolbar {
    align-items: stretch;
  }

  .users-toolbar-filters {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .users-table-footer-note {
    text-align: left;
  }
}

@media (max-width: 640px) {
  .users-toolbar-filters {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
