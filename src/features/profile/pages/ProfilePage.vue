<script setup lang="ts">
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { PERMISSIONS } from '@/constants/permissions'
import { useAuth } from '@/features/auth/composable/useAuth'
import { usePermission } from '@/features/auth/composable/usePermission'
import EmployeeAvatar from '@/features/employees/components/EmployeeAvatar.vue'
import EmployeeStatusBadge from '@/features/employees/components/EmployeeStatusBadge.vue'
import EmployeeAddressesTab from '@/features/employees/components/EmployeeAddressesTab.vue'
import EmployeeEmergencyContactsTab from '@/features/employees/components/EmployeeEmergencyContactsTab.vue'
import EmployeePositionsTab from '@/features/employees/components/EmployeePositionsTab.vue'
import {
  formatEmployeeDate,
  getEmployeeRequestErrorMessage,
} from '@/features/employees/utils/employee'

import ProfileChangePasswordTab from '../components/ProfileChangePasswordTab.vue'
import ProfileEmploymentInfoTab from '../components/ProfileEmploymentInfoTab.vue'
import ProfileInfoTab from '../components/ProfileInfoTab.vue'
import ProfileReadOnlyAddressesTab from '../components/ProfileReadOnlyAddressesTab.vue'
import ProfileReadOnlyEmergencyContactsTab from '../components/ProfileReadOnlyEmergencyContactsTab.vue'
import ProfileReadOnlyPositionsTab from '../components/ProfileReadOnlyPositionsTab.vue'

const activeTab = ref('profile-info')
const route = useRoute()
const validTabs = new Set([
  'profile-info',
  'employment-info',
  'addresses',
  'emergency-contacts',
  'positions',
  'change-password',
])

const {
  currentUser,
  employee,
  addresses,
  emergencyContacts,
  positions,
  isLoading,
  fetchMe,
} = useAuth()

const { hasPermission } = usePermission()

const canEditEmployeeSections = computed(() => hasPermission(PERMISSIONS.EMPLOYEE_MANAGE))
const canEditUserAccount = computed(() => hasPermission(PERMISSIONS.USER_UPDATE))

const employeeDisplayName = computed(() => {
  if (!employee.value) {
    return currentUser.value?.name || 'Profile'
  }

  return (
    employee.value.full_name ||
    [employee.value.first_name, employee.value.last_name].filter(Boolean).join(' ') ||
    currentUser.value?.name ||
    'Profile'
  )
})

const loadProfile = async () => {
  try {
    const profile = await fetchMe()

    if (import.meta.env.DEV) {
      console.debug('[ProfilePage] employee payload', profile.employee)
    }
  } catch (error) {
    ElMessage.error(getEmployeeRequestErrorMessage(error, 'Failed to load profile.'))
  }
}

const syncActiveTabFromRoute = () => {
  const requestedTab = typeof route.query.tab === 'string' ? route.query.tab : null

  if (requestedTab && validTabs.has(requestedTab)) {
    activeTab.value = requestedTab
  }
}

watch(
  () => route.query.tab,
  () => {
    syncActiveTabFromRoute()
  },
  { immediate: true },
)

onMounted(loadProfile)
</script>

<template>
  <main class="space-y-5">
    <div class="space-y-1">
      <h1 class="text-3xl font-semibold text-slate-950">Profile</h1>
      <p class="text-sm text-slate-500">
        Review your account details, work information, and personal records in one place.
      </p>
    </div>

    <div v-if="isLoading && !currentUser" class="flex min-h-80 items-center justify-center rounded-3xl border border-slate-200 bg-white">
      <BaseSpinner />
    </div>

    <template v-else-if="currentUser">
      <BaseCard class="border border-slate-200 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4 p-6">
          <div class="flex min-w-0 items-center gap-4">
            <EmployeeAvatar
              :name="employeeDisplayName"
              :photo-url="employee?.profile_photo || null"
              size="lg"
            />

            <div class="min-w-0 space-y-1">
              <div class="flex flex-wrap items-center gap-3">
                <h2 class="text-2xl font-semibold text-slate-900">{{ employeeDisplayName }}</h2>
                <EmployeeStatusBadge v-if="employee" :status="employee.status" />
              </div>
              <p class="text-sm font-medium text-slate-600">{{ currentUser.email }}</p>
              <p class="text-sm text-slate-500">
                {{ employee?.department?.name || 'No department' }}
                <template v-if="employee?.current_position?.title">
                  • {{ employee.current_position.title }}
                </template>
                <template v-if="employee?.hire_date">
                  • Joined {{ formatEmployeeDate(employee.hire_date) }}
                </template>
              </p>
            </div>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="border border-slate-200 shadow-sm">
        <div class="p-5">
          <ElTabs v-model="activeTab" class="profile-tabs">
            <ElTabPane label="Profile Info" lazy name="profile-info">
              <ProfileInfoTab
                :can-edit-employee-info="canEditEmployeeSections"
                :can-edit-user-account="canEditUserAccount"
                :profile="currentUser"
                @refreshed="loadProfile"
              />
            </ElTabPane>

            <ElTabPane label="Employment Info" lazy name="employment-info">
              <ProfileEmploymentInfoTab :employee="employee" />
            </ElTabPane>

            <ElTabPane label="Addresses" lazy name="addresses">
              <EmployeeAddressesTab
                v-if="canEditEmployeeSections && employee"
                :employee-id="employee.id"
                @changed="loadProfile"
              />
              <ProfileReadOnlyAddressesTab v-else :addresses="addresses" />
            </ElTabPane>

            <ElTabPane label="Emergency Contacts" lazy name="emergency-contacts">
              <EmployeeEmergencyContactsTab
                v-if="canEditEmployeeSections && employee"
                :employee-id="employee.id"
                @changed="loadProfile"
              />
              <ProfileReadOnlyEmergencyContactsTab v-else :contacts="emergencyContacts" />
            </ElTabPane>

            <ElTabPane label="Positions" lazy name="positions">
              <EmployeePositionsTab
                v-if="canEditEmployeeSections && employee"
                :employee-id="employee.id"
                @changed="loadProfile"
              />
              <ProfileReadOnlyPositionsTab v-else :positions="positions" />
            </ElTabPane>

            <ElTabPane label="Change Password" lazy name="change-password">
              <ProfileChangePasswordTab />
            </ElTabPane>
          </ElTabs>
        </div>
      </BaseCard>
    </template>

    <BaseCard v-else class="border border-slate-200 shadow-sm">
      <div class="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
        <h3 class="text-lg font-semibold text-slate-900">Profile unavailable</h3>
        <p class="max-w-md text-sm text-slate-500">
          Your profile could not be loaded right now. Please try again in a moment.
        </p>
      </div>
    </BaseCard>
  </main>
</template>

<style scoped>
.profile-tabs:deep(.el-tabs__header) {
  margin-bottom: 1rem;
}

.profile-tabs:deep(.el-tabs__nav-wrap::after) {
  background-color: hsl(var(--border-gray));
}

.profile-tabs:deep(.el-tabs__item) {
  padding-inline: 0;
  margin-right: 1.5rem;
  color: hsl(var(--muted-foreground));
  font-weight: 500;
}

.profile-tabs:deep(.el-tabs__item.is-active) {
  color: hsl(var(--primary));
  font-weight: 600;
}

.profile-tabs:deep(.el-tabs__active-bar) {
  background-color: hsl(var(--primary));
  height: 2px;
}

.profile-tabs:deep(.el-tabs__content) {
  overflow: visible;
}
</style>
