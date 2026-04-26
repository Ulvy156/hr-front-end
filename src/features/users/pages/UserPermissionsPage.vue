<script setup lang="ts">
import { ArrowLeft, RefreshCw, RotateCcw, Save, ShieldCheck } from 'lucide-vue-next'

import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermission } from '@/features/auth/composable/usePermission'

import { useUsers } from '../composable/useUsers'
import type { UserAccessSummary } from '../interface/user.interface'
import {
  createPermissionDescriptionMap,
  formatPermissionLabel,
  formatPermissionReference,
  formatUserLabel,
  getUserDisplayName,
  getUserRequestErrorMessage,
  getUserSuccessMessage,
  groupPermissionNamesByDomain,
  groupPermissionsByDomain,
  normalizeUserAccessNames,
  normalizeUserPermissionNames,
  USER_MANAGEMENT_LABELS,
} from '../utils/user'

const route = useRoute()
const router = useRouter()

const { hasPermission } = usePermission()
const {
  selectedUserAccess,
  roles,
  permissions,
  isRolesLoading,
  isPermissionsLoading,
  isAccessLoading,
  isSaving,
  accessError,
  permissionsError,
  fetchUserAccess,
  fetchRoles,
  fetchPermissions,
  updateUserAccess,
} = useUsers()

const loadError = ref('')
const saveFeedback = ref('')
const saveError = ref('')
const currentRoleNames = ref<string[]>([])
const currentRolePermissionNames = ref<string[]>([])
const selectedRoleName = ref('')
const currentDirectPermissionNames = ref<string[]>([])
const selectedDirectPermissionNames = ref<string[]>([])

const userId = computed(() => Number(route.params.id))
const hasValidUserId = computed(() => Number.isFinite(userId.value) && userId.value > 0)
const activeUserAccess = computed(() => {
  return selectedUserAccess.value?.id === userId.value ? selectedUserAccess.value : null
})
const availableRoles = computed(() => roles.value)
const availablePermissions = computed(() => permissions.value ?? [])
const permissionDescriptionMap = computed(() =>
  createPermissionDescriptionMap(availablePermissions.value),
)
const availablePermissionNameSet = computed(() => {
  return new Set(
    availablePermissions.value
      .map((permission) => permission.name)
      .filter((name): name is string => typeof name === 'string' && name.trim() !== ''),
  )
})
const groupedPermissionOptions = computed(() => groupPermissionsByDomain(availablePermissions.value))
const groupedRolePermissions = computed(() =>
  groupPermissionNamesByDomain(
    activeUserAccess.value?.role_permissions ?? [],
    permissionDescriptionMap.value,
  ),
)
const groupedEffectivePermissions = computed(() =>
  groupPermissionNamesByDomain(
    activeUserAccess.value?.effective_permissions ?? [],
    permissionDescriptionMap.value,
  ),
)
const currentDirectPermissionItems = computed(() =>
  currentDirectPermissionNames.value.map((permissionName) => ({
    name: permissionName,
    label: formatPermissionLabel(permissionName, permissionDescriptionMap.value),
    reference: formatPermissionReference(permissionName, permissionDescriptionMap.value),
  })),
)
const isInitialLoading = computed(() => {
  return isAccessLoading.value || isRolesLoading.value || isPermissionsLoading.value
})
const canAssignRoles = computed(() => hasPermission(PERMISSIONS.USER_ROLE_ASSIGN))
const canAssignPermissions = computed(() => hasPermission(PERMISSIONS.USER_PERMISSION_ASSIGN))
const canSaveAccess = computed(() => canAssignRoles.value || canAssignPermissions.value)
const selectedRolePermissionNames = computed(() => {
  const selectedRole = availableRoles.value.find((role) => role.name === selectedRoleName.value)

  if (selectedRole?.permissions?.length) {
    return normalizeAvailablePermissionNames(selectedRole.permissions)
  }

  return selectedRoleName.value === (currentRoleNames.value[0] ?? '')
    ? [...currentRolePermissionNames.value]
    : []
})
const selectedRolePermissionSet = computed(() => new Set(selectedRolePermissionNames.value))
const roleOptions = computed<BaseDropdownOption[]>(() =>
  availableRoles.value.map((role) => ({
    label: role.description || formatUserLabel(role.name),
    value: role.name,
  })),
)
const selectedPermissionSet = computed(() => new Set(selectedDirectPermissionNames.value))
const hasRoleChanges = computed(() => {
  if (!canAssignRoles.value) {
    return false
  }

  return (currentRoleNames.value[0] ?? '') !== selectedRoleName.value
})
const hasPermissionChanges = computed(() => {
  if (!canAssignPermissions.value) {
    return false
  }

  if (currentDirectPermissionNames.value.length !== selectedDirectPermissionNames.value.length) {
    return true
  }

  return currentDirectPermissionNames.value.some(
    (permissionName) => !selectedPermissionSet.value.has(permissionName),
  )
})
const hasUnsavedChanges = computed(() => hasRoleChanges.value || hasPermissionChanges.value)

const normalizeAvailablePermissionNames = (
  names: Array<{ name: string } | string> | null | undefined,
) => {
  return normalizeUserPermissionNames({ permissions: names }).filter((name) =>
    availablePermissionNameSet.value.has(name),
  )
}

const roleNameModel = computed({
  get: () => selectedRoleName.value || null,
  set: (value: unknown) => {
    selectedRoleName.value = typeof value === 'string' ? value : ''
  },
})

const syncAccessState = (accessSummary: UserAccessSummary | null | undefined) => {
  const rolePermissionNames = normalizeAvailablePermissionNames(accessSummary?.role_permissions)
  const directPermissionNames = normalizeUserAccessNames(accessSummary?.direct_permissions)

  currentRoleNames.value = normalizeUserAccessNames(accessSummary?.roles.map((role) => role.name) ?? [])
  selectedRoleName.value = currentRoleNames.value[0] ?? ''
  currentRolePermissionNames.value = rolePermissionNames
  currentDirectPermissionNames.value = directPermissionNames
  selectedDirectPermissionNames.value = [...currentDirectPermissionNames.value]
}

const isPermissionChecked = (permissionName: string) => {
  return isPermissionAssignedDirectly(permissionName) || isPermissionInherited(permissionName)
}

const isPermissionAssignedDirectly = (permissionName: string) => {
  return selectedPermissionSet.value.has(permissionName)
}

const isPermissionInherited = (permissionName: string) => {
  return selectedRolePermissionSet.value.has(permissionName)
}

const isPermissionInheritedOnly = (permissionName: string) => {
  return isPermissionInherited(permissionName) && !isPermissionAssignedDirectly(permissionName)
}

const isPermissionEditable = (permissionName: string) => {
  if (!canAssignPermissions.value || isSaving.value) {
    return false
  }

  return !isPermissionInheritedOnly(permissionName)
}

const handlePermissionChange = (permissionName: string, event: Event) => {
  if (!isPermissionEditable(permissionName)) {
    return
  }

  const target = event.target

  if (!(target instanceof HTMLInputElement)) {
    return
  }

  if (target.checked) {
    selectedDirectPermissionNames.value = normalizeUserAccessNames([
      ...selectedDirectPermissionNames.value,
      permissionName,
    ])
    return
  }

  selectedDirectPermissionNames.value = selectedDirectPermissionNames.value.filter(
    (currentPermissionName) => currentPermissionName !== permissionName,
  )
}

const getRoleVariant = (value: string | null | undefined) => {
  if (value === 'admin') return 'primary'
  if (value === 'hr') return 'warning'
  return 'default'
}

const loadPage = async () => {
  loadError.value = ''
  saveError.value = ''
  saveFeedback.value = ''

  if (!hasValidUserId.value) {
    loadError.value = 'The selected user ID is invalid.'
    return
  }

  try {
    const [accessSummary] = await Promise.all([
      fetchUserAccess(userId.value),
      fetchRoles(),
      fetchPermissions(),
    ])

    syncAccessState(accessSummary)
  } catch (err) {
    loadError.value = getUserRequestErrorMessage(err, 'Unable to load user access.')
  }
}

const resetSelection = () => {
  selectedRoleName.value = currentRoleNames.value[0] ?? ''
  selectedDirectPermissionNames.value = [...currentDirectPermissionNames.value]
  saveError.value = ''
  saveFeedback.value = ''
}

const handleBack = async () => {
  await router.push({ name: 'users' })
}

const handleSave = async () => {
  if (!hasValidUserId.value) {
    saveError.value = 'The selected user ID is invalid.'
    return
  }

  if (!hasUnsavedChanges.value) {
    return
  }

  const payload: {
    roles?: string[]
    permissions?: string[]
  } = {}

  if (hasRoleChanges.value && canAssignRoles.value) {
    payload.roles = selectedRoleName.value ? [selectedRoleName.value] : []
  }

  if (hasPermissionChanges.value && canAssignPermissions.value) {
    payload.permissions = [...selectedDirectPermissionNames.value]
  }

  if (!('roles' in payload) && !('permissions' in payload)) {
    return
  }

  saveError.value = ''
  saveFeedback.value = ''

  try {
    const response = await updateUserAccess(userId.value, payload)

    syncAccessState(response)
    saveFeedback.value = getUserSuccessMessage(response, 'Access saved.')
  } catch (err) {
    saveError.value = getUserRequestErrorMessage(err, 'Unable to save access.')
  }
}

watch(
  () => route.params.id,
  () => {
    void loadPage()
  },
  { immediate: true },
)
</script>

<template>
  <main class="user-access-page">
    <header class="user-access-header">
      <div class="user-access-copy">
        <BaseButton variant="ghost" @click="handleBack">
          <ArrowLeft :size="16" />
          Back to Users
        </BaseButton>
        <div class="user-access-heading">
          <h1 class="user-access-title">User Access</h1>
          <p class="user-access-subtitle">
            View and update this user's user type and access in one place.
          </p>
        </div>
      </div>

      <div class="user-access-header-actions">
        <BaseButton :disabled="isInitialLoading || !hasValidUserId" variant="ghost" @click="loadPage">
          <RefreshCw :size="16" />
          Refresh
        </BaseButton>
      </div>
    </header>

    <div v-if="isInitialLoading && !activeUserAccess" class="user-access-state-card">
      <BaseCard class="user-access-state">
        <BaseSpinner />
        <p class="user-access-state-text">Loading user access...</p>
      </BaseCard>
    </div>

    <div v-else-if="loadError || accessError || permissionsError" class="user-access-state-card">
      <BaseCard class="user-access-state user-access-state-error">
        <h2 class="user-access-state-title">Unable to load user access</h2>
        <p class="user-access-state-text">{{ loadError || accessError || permissionsError }}</p>
        <div class="user-access-state-actions">
          <BaseButton variant="ghost" @click="handleBack">Back to Users</BaseButton>
          <BaseButton @click="loadPage">Try Again</BaseButton>
        </div>
      </BaseCard>
    </div>

    <template v-else-if="activeUserAccess">
      <BaseCard class="user-access-summary-card">
        <div class="user-access-summary-header">
          <div>
            <p class="user-access-summary-label">User Details</p>
            <h2 class="user-access-summary-name">{{ getUserDisplayName(activeUserAccess) }}</h2>
            <p class="user-access-summary-email">{{ activeUserAccess.email }}</p>
          </div>

          <div class="user-access-summary-stats">
            <div class="user-access-summary-stat">
              <span class="user-access-summary-stat-label">{{ USER_MANAGEMENT_LABELS.userType }}</span>
              <strong>{{ activeUserAccess.roles[0]?.description || formatUserLabel(activeUserAccess.roles[0]?.name) || '--' }}</strong>
            </div>
            <div class="user-access-summary-stat">
              <span class="user-access-summary-stat-label">{{ USER_MANAGEMENT_LABELS.extraAccess }}</span>
              <strong>{{ currentDirectPermissionNames.length }}</strong>
            </div>
            <div class="user-access-summary-stat">
              <span class="user-access-summary-stat-label">{{ USER_MANAGEMENT_LABELS.totalAccess }}</span>
              <strong>{{ activeUserAccess.effective_permissions.length }}</strong>
            </div>
          </div>
        </div>

        <div class="user-access-summary-grid">
          <section class="user-access-summary-section">
            <h3 class="user-access-section-title">Linked Employee</h3>
            <div class="user-access-summary-meta">
              <p class="user-access-summary-meta-value">
                {{ activeUserAccess.employee?.full_name || 'No linked employee' }}
              </p>
              <p class="user-access-muted">
                {{
                  activeUserAccess.employee
                    ? `${activeUserAccess.employee.employee_code || `Employee #${activeUserAccess.employee.id}`} • ${activeUserAccess.employee.department?.name || 'No department'}`
                    : 'This user is currently not linked to an employee profile.'
                }}
              </p>
            </div>
          </section>

          <section class="user-access-summary-section">
            <div class="user-access-section-heading">
              <div>
                <h3 class="user-access-section-title">Current {{ USER_MANAGEMENT_LABELS.userType }}</h3>
                <p class="user-access-muted">This user type gives the user their standard access.</p>
              </div>
              <BaseBadge variant="default">{{ activeUserAccess.roles.length ? 'Set' : 'Not Set' }}</BaseBadge>
            </div>

            <div class="user-access-badges">
              <BaseBadge
                v-for="role in activeUserAccess.roles"
                :key="role.id"
                :variant="getRoleVariant(role.name)"
              >
                {{ role.description || formatUserLabel(role.name) }}
              </BaseBadge>
              <p v-if="!activeUserAccess.roles.length" class="user-access-muted">No user type set.</p>
            </div>
          </section>
        </div>
      </BaseCard>

      <BaseCard class="user-access-assignment-card">
        <div class="user-access-assignment-header">
          <div class="user-access-assignment-copy">
            <p class="user-access-summary-label">Update Access</p>
            <h2 class="user-access-assignment-title">User Type and Access</h2>
            <p class="user-access-subtitle user-access-subtitle-compact">
              Choose a user type and any extra access for this user.
            </p>
          </div>

          <div class="user-access-assignment-actions">
            <BaseButton
              :disabled="!hasUnsavedChanges || isSaving"
              variant="ghost"
              @click="resetSelection"
            >
              <RotateCcw :size="16" />
              Reset
            </BaseButton>
            <BaseButton
              :disabled="!canSaveAccess || !hasUnsavedChanges"
              :loading="isSaving"
              @click="handleSave"
            >
              <Save :size="16" />
              Save Changes
            </BaseButton>
          </div>
        </div>

        <div class="user-access-toolbar">
          <div class="user-access-toolbar-chip">
            <ShieldCheck :size="16" />
            <span>{{ availableRoles.length }} {{ USER_MANAGEMENT_LABELS.userTypes.toLowerCase() }}</span>
          </div>
          <div class="user-access-toolbar-chip">
            <span>{{ availablePermissions.length }} {{ USER_MANAGEMENT_LABELS.accessOptions.toLowerCase() }}</span>
          </div>
          <div v-if="hasUnsavedChanges" class="user-access-toolbar-chip user-access-toolbar-chip-warning">
            <span>Unsaved changes</span>
          </div>
        </div>

        <p v-if="saveFeedback" class="user-access-feedback user-access-feedback-success">
          {{ saveFeedback }}
        </p>
        <p v-else-if="saveError" class="user-access-feedback user-access-feedback-error">
          {{ saveError }}
        </p>

        <section class="user-access-panel">
          <div class="user-access-panel-header">
            <div>
              <h3 class="user-access-section-title">{{ USER_MANAGEMENT_LABELS.userType }}</h3>
              <p class="user-access-muted">
                Choose one user type. It sets the user's standard access.
              </p>
            </div>
            <BaseBadge :variant="canAssignRoles ? 'success' : 'default'">
              {{ canAssignRoles ? 'Editable' : 'Read Only' }}
            </BaseBadge>
          </div>

          <BaseDropdown
            v-model="roleNameModel"
            :disabled="!canAssignRoles || isSaving"
            :loading="isRolesLoading"
            :options="roleOptions"
            filterable
            :label="USER_MANAGEMENT_LABELS.userType"
            :placeholder="`Select a ${USER_MANAGEMENT_LABELS.userType.toLowerCase()}`"
          />

          <div class="user-access-current-grid">
            <article
              v-for="role in activeUserAccess.roles"
              :key="role.id"
              class="user-access-current-card"
            >
              <div class="user-access-current-card-header">
                <BaseBadge :variant="getRoleVariant(role.name)">
                  {{ role.description || formatUserLabel(role.name) }}
                </BaseBadge>
                <span class="user-access-current-card-count">
                  {{ role.permissions?.length ?? 0 }} included access item{{ (role.permissions?.length ?? 0) === 1 ? '' : 's' }}
                </span>
              </div>
              <p class="user-access-current-card-text">
                {{
                  role.permissions?.slice(0, 3)
                    .map((permission) => {
                      const label = formatPermissionLabel(permission, permissionDescriptionMap)
                      const reference = formatPermissionReference(permission, permissionDescriptionMap)

                      return reference ? `${label} (${reference})` : label
                    })
                    .join(', ') || 'No access details available.'
                }}
                <span v-if="(role.permissions?.length ?? 0) > 3">...</span>
              </p>
            </article>
            <p v-if="!activeUserAccess.roles.length" class="user-access-muted">
              No user type set for this user.
            </p>
          </div>
        </section>

        <section class="user-access-panel">
          <div class="user-access-panel-header">
            <div>
              <h3 class="user-access-section-title">{{ USER_MANAGEMENT_LABELS.extraAccess }}</h3>
              <p class="user-access-muted">
                Extra access is added on top of the user's standard access.
              </p>
            </div>
            <BaseBadge :variant="canAssignPermissions ? 'success' : 'default'">
              {{ canAssignPermissions ? 'Editable' : 'Read Only' }}
            </BaseBadge>
          </div>

          <div class="user-access-current-direct">
            <div class="user-access-section-heading">
              <div>
                <h4 class="user-access-subsection-title">Current {{ USER_MANAGEMENT_LABELS.extraAccess }}</h4>
                <p class="user-access-muted">
                  {{ currentDirectPermissionNames.length }} extra access item{{ currentDirectPermissionNames.length === 1 ? '' : 's' }}
                </p>
              </div>
            </div>

            <div class="user-access-badges">
              <BaseBadge
                v-for="permission in currentDirectPermissionItems"
                :key="permission.name"
                variant="default"
              >
                <span class="user-access-permission-copy">
                  <span>{{ permission.label }}</span>
                  <span v-if="permission.reference" class="user-access-permission-reference">
                    {{ permission.reference }}
                  </span>
                </span>
              </BaseBadge>
              <p v-if="!currentDirectPermissionNames.length" class="user-access-muted">
                No extra access set.
              </p>
            </div>
          </div>

          <div v-if="!availablePermissions.length" class="user-access-empty-state">
            <h3 class="user-access-state-title">No access options</h3>
            <p class="user-access-state-text">
              There are no access options to choose from right now.
            </p>
          </div>

          <div v-else class="user-access-groups">
            <section
              v-for="group in groupedPermissionOptions"
              :key="group.group"
              class="user-access-group"
            >
              <div class="user-access-group-header">
                <div>
                  <h3 class="user-access-group-title">{{ group.groupLabel }}</h3>
                  <p class="user-access-muted">
                    {{ group.permissions.length }} access item{{ group.permissions.length === 1 ? '' : 's' }}
                  </p>
                </div>
              </div>

              <div class="user-access-options">
                <label
                  v-for="permission in group.permissions"
                  :key="permission.name"
                  :for="permission.id"
                  class="user-access-option"
                  :class="{
                    'is-disabled': !isPermissionEditable(permission.name),
                    'is-readonly': isPermissionInheritedOnly(permission.name),
                  }"
                >
                  <input
                    :id="permission.id"
                    :checked="isPermissionChecked(permission.name)"
                    :disabled="!isPermissionEditable(permission.name)"
                    :value="permission.name"
                    class="user-access-checkbox"
                    type="checkbox"
                    @change="handlePermissionChange(permission.name, $event)"
                  />
                  <span class="user-access-option-copy">
                    <span class="user-access-option-label">{{ permission.label }}</span>
                    <span
                      v-if="permission.reference"
                      class="user-access-permission-reference"
                    >
                      {{ permission.reference }}
                    </span>
                    <span
                      v-if="isPermissionAssignedDirectly(permission.name)"
                      class="user-access-option-note user-access-option-note-direct"
                    >
                      Assigned directly
                    </span>
                    <span
                      v-if="isPermissionInheritedOnly(permission.name)"
                      class="user-access-option-note"
                    >
                      Inherited from user type
                    </span>
                    <span
                      v-else-if="
                        isPermissionAssignedDirectly(permission.name) &&
                        isPermissionInherited(permission.name)
                      "
                      class="user-access-option-note"
                    >
                      Also inherited from user type
                    </span>
                  </span>
                </label>
              </div>
            </section>
          </div>
        </section>

        <section class="user-access-panel">
          <div class="user-access-panel-header">
            <div>
              <h3 class="user-access-section-title">{{ USER_MANAGEMENT_LABELS.totalAccess }}</h3>
              <p class="user-access-muted">
                This shows all access from the user type plus any extra access.
              </p>
            </div>
            <BaseBadge variant="default">
              {{ activeUserAccess.effective_permissions.length }} total
            </BaseBadge>
          </div>

          <div class="user-access-effective-grid">
            <div class="user-access-effective-column">
              <div class="user-access-section-heading">
                <div>
                  <h4 class="user-access-subsection-title">From {{ USER_MANAGEMENT_LABELS.userType }}</h4>
                  <p class="user-access-muted">
                    {{ activeUserAccess.role_permissions.length }} access item{{ activeUserAccess.role_permissions.length === 1 ? '' : 's' }}
                  </p>
                </div>
              </div>

              <div class="user-access-readonly-groups">
                <section
                  v-for="group in groupedRolePermissions"
                  :key="`role-${group.group}`"
                  class="user-access-readonly-group"
                >
                  <h5 class="user-access-readonly-group-title">{{ group.groupLabel }}</h5>
                  <div class="user-access-badges">
                    <BaseBadge
                      v-for="permission in group.permissions"
                      :key="permission.name"
                      variant="default"
                    >
                      <span class="user-access-permission-copy">
                        <span>{{ permission.label }}</span>
                        <span
                          v-if="permission.reference"
                          class="user-access-permission-reference"
                        >
                          {{ permission.reference }}
                        </span>
                      </span>
                    </BaseBadge>
                  </div>
                </section>
                <p v-if="!groupedRolePermissions.length" class="user-access-muted">
                  No access from the user type.
                </p>
              </div>
            </div>

            <div class="user-access-effective-column">
              <div class="user-access-section-heading">
                <div>
                  <h4 class="user-access-subsection-title">All Access</h4>
                  <p class="user-access-muted">
                    Includes user type access and extra access.
                  </p>
                </div>
              </div>

              <div class="user-access-readonly-groups">
                <section
                  v-for="group in groupedEffectivePermissions"
                  :key="`effective-${group.group}`"
                  class="user-access-readonly-group"
                >
                  <h5 class="user-access-readonly-group-title">{{ group.groupLabel }}</h5>
                  <div class="user-access-badges">
                    <BaseBadge
                      v-for="permission in group.permissions"
                      :key="permission.name"
                      variant="default"
                    >
                      <span class="user-access-permission-copy">
                        <span>{{ permission.label }}</span>
                        <span
                          v-if="permission.reference"
                          class="user-access-permission-reference"
                        >
                          {{ permission.reference }}
                        </span>
                      </span>
                    </BaseBadge>
                  </div>
                </section>
                <p v-if="!groupedEffectivePermissions.length" class="user-access-muted">
                  No access found.
                </p>
              </div>
            </div>
          </div>
        </section>
      </BaseCard>
    </template>
  </main>
</template>

<style scoped>
.user-access-page {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-access-header,
.user-access-summary-header,
.user-access-assignment-header,
.user-access-panel-header,
.user-access-group-header,
.user-access-section-heading,
.user-access-current-card-header {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.user-access-copy,
.user-access-heading,
.user-access-assignment-copy,
.user-access-state,
.user-access-summary-meta,
.user-access-option-copy,
.user-access-panel,
.user-access-effective-column,
.user-access-readonly-groups,
.user-access-readonly-group {
  display: flex;
  flex-direction: column;
}

.user-access-copy,
.user-access-heading,
.user-access-assignment-copy,
.user-access-state,
.user-access-option-copy,
.user-access-permission-copy,
.user-access-readonly-group {
  gap: 0.5rem;
}

.user-access-summary-meta,
.user-access-panel,
.user-access-effective-column,
.user-access-readonly-groups {
  gap: 0.75rem;
}

.user-access-copy {
  align-items: flex-start;
}

.user-access-header-actions,
.user-access-summary-stats,
.user-access-assignment-actions,
.user-access-toolbar,
.user-access-badges,
.user-access-state-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-access-header-actions,
.user-access-assignment-actions,
.user-access-state-actions {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.user-access-title,
.user-access-summary-name,
.user-access-assignment-title,
.user-access-section-title,
.user-access-group-title,
.user-access-state-title,
.user-access-summary-meta-value,
.user-access-option-label,
.user-access-subsection-title,
.user-access-readonly-group-title {
  color: hsl(var(--foreground));
}

.user-access-title {
  font-size: 1.9rem;
  font-weight: 700;
  line-height: 1.1;
}

.user-access-summary-name {
  font-size: 1.4rem;
  font-weight: 700;
}

.user-access-assignment-title {
  font-size: 1.05rem;
  font-weight: 700;
}

.user-access-summary-label,
.user-access-summary-stat-label,
.user-access-option-note,
.user-access-current-card-count {
  font-size: var(--text-xs);
}

.user-access-summary-label {
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: hsl(var(--muted-foreground));
}

.user-access-subtitle,
.user-access-summary-email,
.user-access-muted,
.user-access-state-text,
.user-access-permission-reference,
.user-access-option-note,
.user-access-current-card-text,
.user-access-current-card-count {
  color: hsl(var(--muted-foreground));
}

.user-access-subtitle,
.user-access-summary-email,
.user-access-muted,
.user-access-state-text,
.user-access-current-card-text {
  font-size: var(--text-sm);
  line-height: 1.55;
}

.user-access-subtitle-compact {
  max-width: 42rem;
}

.user-access-summary-card,
.user-access-assignment-card,
.user-access-state-card :deep(.base-card) {
  overflow: hidden;
  border: 1px solid hsl(var(--border-gray));
  box-shadow: var(--shadow-card);
}

.user-access-summary-card,
.user-access-assignment-card {
  padding: 1.2rem;
}

.user-access-state-card :deep(.base-card) {
  min-height: 18rem;
}

.user-access-summary-header {
  align-items: flex-start;
  padding-bottom: 1rem;
  border-bottom: 1px solid hsl(var(--border-gray));
}

.user-access-summary-stats {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.user-access-summary-stat {
  min-width: 9rem;
  padding: 0.85rem 1rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 1rem;
  background: hsl(var(--secondary) / 0.14);
}

.user-access-summary-stat strong {
  display: block;
  margin-top: 0.25rem;
  font-size: 1.15rem;
  color: hsl(var(--foreground));
}

.user-access-summary-grid,
.user-access-effective-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.user-access-summary-grid {
  padding-top: 1rem;
}

.user-access-summary-section,
.user-access-panel,
.user-access-effective-column {
  padding: 1rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 1rem;
  background: hsl(var(--card));
}

.user-access-section-title {
  font-size: 0.95rem;
  font-weight: 700;
}

.user-access-subsection-title {
  font-size: 0.9rem;
  font-weight: 700;
}

.user-access-readonly-group-title {
  font-size: 0.85rem;
  font-weight: 700;
}

.user-access-summary-meta-value,
.user-access-option-label {
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: 1.45;
}

.user-access-permission-copy {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.1rem;
}

.user-access-permission-reference {
  font-size: var(--text-xs);
  line-height: 1.4;
}

.user-access-option-note {
  font-weight: 600;
}

.user-access-assignment-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.user-access-assignment-header {
  align-items: flex-start;
}

.user-access-toolbar {
  flex-wrap: wrap;
}

.user-access-toolbar-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.45rem;
  padding: 0.45rem 0.75rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 999px;
  background: hsl(var(--secondary) / 0.12);
  font-size: var(--text-xs);
  font-weight: 600;
  color: hsl(var(--muted-foreground));
}

.user-access-toolbar-chip-warning {
  border-color: hsl(var(--primary) / 0.2);
  background: hsl(var(--primary) / 0.08);
  color: hsl(var(--foreground));
}

.user-access-feedback {
  padding: 0.85rem 1rem;
  border-radius: 1rem;
  font-size: var(--text-sm);
  font-weight: 500;
}

.user-access-feedback-success {
  background: hsl(142 76% 96%);
  color: hsl(142 72% 24%);
}

.user-access-feedback-error {
  background: hsl(0 86% 97%);
  color: hsl(var(--destructive));
}

.user-access-current-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem;
}

.user-access-current-direct {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 0.95rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 1rem;
  background: hsl(var(--secondary) / 0.12);
}

.user-access-current-card {
  padding: 0.9rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 0.95rem;
  background: hsl(var(--secondary) / 0.12);
}

.user-access-options {
  display: grid;
  gap: 0.65rem;
}

.user-access-groups {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.user-access-group {
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 1rem;
  background: linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.12) 100%);
}

.user-access-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.8rem 0.9rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 0.95rem;
  background: hsl(var(--card));
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    background-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.16s ease;
}

.user-access-option:hover {
  border-color: hsl(var(--primary) / 0.28);
  background: hsl(var(--secondary) / 0.18);
  box-shadow: 0 10px 20px hsl(var(--foreground) / 0.04);
  transform: translateY(-1px);
}

.user-access-option:has(.user-access-checkbox:checked) {
  border-color: hsl(var(--primary) / 0.32);
  background: hsl(var(--primary) / 0.05);
  box-shadow: 0 12px 22px hsl(var(--primary) / 0.08);
}

.user-access-option.is-disabled {
  cursor: default;
  opacity: 0.8;
}

.user-access-option.is-disabled:hover {
  border-color: hsl(var(--border-gray));
  background: hsl(var(--card));
  box-shadow: none;
  transform: none;
}

.user-access-checkbox {
  width: 1rem;
  height: 1rem;
  margin-top: 0.15rem;
  accent-color: hsl(var(--primary));
}

.user-access-readonly-groups {
  gap: 1rem;
}

.user-access-badges {
  flex-wrap: wrap;
}

.user-access-empty-state,
.user-access-state {
  align-items: center;
  justify-content: center;
  padding: 1rem;
  text-align: center;
}

.user-access-state {
  min-height: 18rem;
}

.user-access-state-error {
  background: hsl(var(--destructive) / 0.04);
}

@media (max-width: 1024px) {
  .user-access-summary-grid,
  .user-access-effective-grid,
  .user-access-current-grid,
  .user-access-groups {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 960px) {
  .user-access-header,
  .user-access-summary-header,
  .user-access-assignment-header,
  .user-access-panel-header,
  .user-access-group-header,
  .user-access-section-heading,
  .user-access-current-card-header {
    flex-direction: column;
    align-items: stretch;
  }

  .user-access-summary-stats,
  .user-access-header-actions,
  .user-access-assignment-actions {
    justify-content: flex-start;
  }
}
</style>
