<script setup lang="ts">
import {
  Activity,
  AlarmClock,
  Briefcase,
  CalendarClock,
  CalendarDays,
  Clock3,
  LogIn,
  LogOut,
  ShieldAlert,
  UserCheck,
  Users,
} from 'lucide-vue-next'
import {
  ATTENDANCE_ACCESS_PERMISSIONS,
  EMPLOYEE_ACCESS_PERMISSIONS,
  USER_MANAGEMENT_ALL_PERMISSIONS,
} from '@/constants/accessControl'
import { PERMISSIONS } from '@/constants/permissions'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { useAuth } from '@/features/auth/composable/useAuth'
import { usePermission } from '@/features/auth/composable/usePermission'
import { hasUserEmployeePermission } from '@/features/auth/utils/permissions'
import DashboardAdminSection from '@/features/dashboard/components/DashboardAdminSection.vue'
import DashboardIssueCards from '@/features/dashboard/components/DashboardIssueCards.vue'
import DashboardQuickActions from '@/features/dashboard/components/DashboardQuickActions.vue'
import DashboardRecentRecords from '@/features/dashboard/components/DashboardRecentRecords.vue'
import DashboardSummaryCards, {
  type DashboardSummaryCardItem,
} from '@/features/dashboard/components/DashboardSummaryCards.vue'
import type { RouteLocationRaw } from 'vue-router'
import { useDashboard } from '@/features/dashboard/composable/useDashboard'
import type {
  AdminDashboardResponse,
  DashboardResponse,
  EmployeeDashboardResponse,
  EmployeeDashboardRecord,
  HrDashboardResponse,
  WorkforceDashboardRecord,
} from '@/features/dashboard/interface/dashboard.interface'
import type { DashboardIssueCardItem } from '@/features/dashboard/components/DashboardIssueCards.vue'

const { dashboard, error, isLoading, fetchDashboard, lastUpdated } = useDashboard()
const { currentUser } = useAuth()
const { hasAllPermissions, hasAnyPermission } = usePermission()
const router = useRouter()
const issueSectionRef = ref<HTMLElement | null>(null)
const recordsSectionRef = ref<HTMLElement | null>(null)

const employeeDashboard = computed(() => {
  if (!isEmployeeDashboardResponse(dashboard.value)) {
    return null
  }

  return dashboard.value
})

const hrDashboard = computed(() => {
  if (!isWorkforceDashboardResponse(dashboard.value) || isAdminDashboardResponse(dashboard.value)) {
    return null
  }

  return dashboard.value
})

const adminDashboard = computed(() => {
  if (!isAdminDashboardResponse(dashboard.value)) {
    return null
  }

  return dashboard.value
})

const activeIssueFilter = ref<string | null>(null)

const hasDashboardData = computed(() => dashboard.value !== null)
const canAccessAttendancePage = computed(() => hasAnyPermission(ATTENDANCE_ACCESS_PERMISSIONS))
const canAccessEmployeesPage = computed(() => hasAnyPermission(EMPLOYEE_ACCESS_PERMISSIONS))
const canAccessUsersPage = computed(() => hasAllPermissions(USER_MANAGEMENT_ALL_PERMISSIONS))
const canViewPersonalAttendanceSummary = computed(() =>
  hasUserEmployeePermission(
    currentUser.value,
    PERMISSIONS.ATTENDANCE_SUMMARY_SELF,
  ) ||
  hasUserEmployeePermission(currentUser.value, PERMISSIONS.ATTENDANCE_VIEW_SELF),
)
const canViewPersonalAttendanceHistory = computed(() =>
  hasUserEmployeePermission(currentUser.value, PERMISSIONS.ATTENDANCE_VIEW_SELF) ||
  hasUserEmployeePermission(currentUser.value, PERMISSIONS.ATTENDANCE_VIEW_ANY),
)
const canViewWorkforceOverview = computed(() =>
  hasAnyPermission([
    PERMISSIONS.ATTENDANCE_SUMMARY_ANY,
    PERMISSIONS.ATTENDANCE_VIEW_ANY,
    PERMISSIONS.ATTENDANCE_MANAGE,
    ...EMPLOYEE_ACCESS_PERMISSIONS,
  ]),
)
const canViewWorkforceAttendance = computed(() =>
  hasAnyPermission([PERMISSIONS.ATTENDANCE_VIEW_ANY, PERMISSIONS.ATTENDANCE_MANAGE]),
)
const canViewLeaveOverview = computed(() =>
  hasAnyPermission([
    PERMISSIONS.LEAVE_APPROVE_MANAGER,
    PERMISSIONS.LEAVE_REQUEST_VIEW_ASSIGNED,
    PERMISSIONS.LEAVE_REQUEST_VIEW_ANY,
    PERMISSIONS.LEAVE_APPROVE_HR,
  ]),
)

const formattedLastUpdated = computed(() => {
  if (!lastUpdated.value) return 'Never'

  return new Date(lastUpdated.value).toLocaleString()
})

const employeePrimaryCards = computed<DashboardSummaryCardItem[]>(() => {
  if (!employeeDashboard.value) return []

  return [
    {
      key: 'todayAttendanceStatus',
      label: 'Today Attendance Status',
      value: formatStatus(employeeDashboard.value.summary.todayAttendanceStatus),
      badge: getSummaryBadgeVariant(employeeDashboard.value.summary.todayAttendanceStatus),
      icon: Activity,
    },
    {
      key: 'checkInTime',
      label: 'Check-in Time',
      value: employeeDashboard.value.summary.checkInTime ?? '--',
      icon: LogIn,
    },
    {
      key: 'checkOutTime',
      label: 'Check-out Time',
      value: employeeDashboard.value.summary.checkOutTime ?? '--',
      icon: LogOut,
    },
    {
      key: 'attendanceThisWeek',
      label: 'Attendance This Week',
      value: String(employeeDashboard.value.summary.attendanceThisWeek.totalPresentDays),
      helper: 'Present days',
      icon: CalendarDays,
    },
  ]
})

const employeeSecondaryCards = computed<DashboardSummaryCardItem[]>(() => {
  if (!employeeDashboard.value) return []

  return [
    {
      key: 'lateCount',
      label: 'Late Count',
      value: String(employeeDashboard.value.summary.attendanceThisWeek.lateCount),
      helper: 'This week',
      icon: AlarmClock,
    },
    {
      key: 'totalPresentDays',
      label: 'Total Present Days',
      value: String(employeeDashboard.value.summary.attendanceThisWeek.totalPresentDays),
      helper: 'This week',
      icon: CalendarClock,
    },
    {
      key: 'nextAction',
      label: 'Next Action',
      value: employeeDashboard.value.summary.nextAction
        ? formatStatus(employeeDashboard.value.summary.nextAction)
        : '--',
      helper: 'Recommended step',
      icon: Clock3,
    },
  ]
})

const workforcePrimaryCards = computed<DashboardSummaryCardItem[]>(() => {
  const source = hrDashboard.value?.summary ?? adminDashboard.value?.summary

  if (!source) return []

  return [
    {
      key: 'totalEmployees',
      label: 'Total Employees',
      value: formatCount(source.totalEmployees),
      icon: Users,
    },
    {
      key: 'activeEmployees',
      label: 'Active Employees',
      value: formatCount(source.activeEmployees),
      icon: UserCheck,
    },
    {
      key: 'checkedInTodayCount',
      label: 'Checked In Today',
      value: formatCount(source.checkedInTodayCount),
      icon: LogIn,
    },
    {
      key: 'checkedOutTodayCount',
      label: 'Checked Out Today',
      value: formatCount(source.checkedOutTodayCount),
      icon: LogOut,
    },
  ]
})

const hrSecondaryCards = computed<DashboardSummaryCardItem[]>(() => {
  if (!hrDashboard.value?.summary) return []

  const cards: DashboardSummaryCardItem[] = []

  if (canViewWorkforceAttendance.value) {
    cards.push({
      key: 'missingAttendanceCount',
      label: 'Missing Attendance',
      value: formatCount(hrDashboard.value.summary.missingAttendanceCount),
      helper: 'Needs follow-up',
      icon: ShieldAlert,
    })
  }

  if (canViewLeaveOverview.value) {
    cards.push({
      key: 'employeesOnLeaveTodayCount',
      label: 'Employees On Leave Today',
      value: formatCount(hrDashboard.value.summary.employeesOnLeaveTodayCount),
      helper: 'Approved leave',
      icon: Briefcase,
    })
  }

  return cards
})

const hrIssueCards = computed<DashboardIssueCardItem[]>(() => {
  const source = hrDashboard.value ?? adminDashboard.value

  if (!source || !canViewWorkforceAttendance.value) return []

  return [
    {
      key: 'missingAttendanceCount',
      label: 'Missing Attendance',
      value: formatCount(source.summary?.missingAttendanceCount),
      tone: 'danger',
      helper: 'High priority',
    },
    {
      key: 'missingCheckout',
      label: 'Missing Checkout',
      value: formatCount(source.extra?.attendanceIssues?.missingCheckout),
      tone: 'danger',
      helper: 'High priority',
    },
    {
      key: 'lateArrivals',
      label: 'Late Arrivals',
      value: formatCount(source.extra?.attendanceIssues?.lateArrivals),
      tone: 'warning',
      helper: 'Medium priority',
    },
    {
      key: 'incompleteAttendance',
      label: 'Incomplete Attendance',
      value: formatCount(source.extra?.attendanceIssues?.incompleteAttendance),
      tone: 'warning',
      helper: 'Medium priority',
    },
  ]
})

const workforceRecentRecords = computed(() => {
  const records = hrDashboard.value?.recentRecords ?? adminDashboard.value?.recentRecords ?? []

  if (!activeIssueFilter.value) {
    return records
  }

  return records.filter((record) => {
    if (activeIssueFilter.value === 'missingAttendanceCount') {
      return record.status === 'missing'
    }

    if (activeIssueFilter.value === 'missingCheckout') {
      return record.checkInTime !== null && record.checkOutTime === null
    }

    if (activeIssueFilter.value === 'lateArrivals') {
      return record.status === 'late'
    }

    if (activeIssueFilter.value === 'incompleteAttendance') {
      return (
        record.status === 'incomplete' ||
        record.checkInTime === null ||
        record.checkOutTime === null
      )
    }

    return true
  })
})

const employeeQuickActions = computed(() =>
  employeeDashboard.value?.quickActions.filter((action) => canAccessDashboardAction(action.key)) ?? [],
)

const hrQuickActions = computed(() =>
  hrDashboard.value?.quickActions.filter((action) => canAccessDashboardAction(action.key)) ?? [],
)

const adminQuickActions = computed(() =>
  adminDashboard.value?.quickActions.filter((action) => canAccessDashboardAction(action.key)) ?? [],
)

const showAdminSecondaryGrid = computed(() => hrIssueCards.value.length > 0 || canAccessUsersPage.value)

const attendanceRouteLocation = (query?: Record<string, string | number>) => ({
  path: '/attendance',
  query,
})

const routeExists = (target: RouteLocationRaw) => {
  return router.resolve(target).matched.length > 0
}

const navigateIfAvailable = async (target: RouteLocationRaw) => {
  if (!routeExists(target)) {
    return false
  }

  await router.push(target)
  return true
}

const scrollToSection = (element: HTMLElement | null) => {
  element?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  })
}

const handleDashboardAction = async (actionKey: string) => {
  const targetByAction: Partial<Record<string, RouteLocationRaw>> = {
    scan_attendance: { path: '/attendance/scan' },
    manage_employees: { path: '/employees' },
    manage_users: { path: '/users' },
    review_attendance: attendanceRouteLocation({ mode: 'review', date: 'today' }),
    view_attendance_history: attendanceRouteLocation({ view: 'history' }),
    attendance_history: attendanceRouteLocation({ view: 'history' }),
    profile: { path: '/profile' },
    change_password: { path: '/profile', query: { tab: 'change-password' } },
  }

  const target = targetByAction[actionKey]

  if (!target) {
    return
  }

  if (await navigateIfAvailable(target)) {
    return
  }

  if (actionKey === 'review_attendance') {
    scrollToSection(issueSectionRef.value)
  }

  if (actionKey === 'attendance_history') {
    scrollToSection(recordsSectionRef.value)
  }
}

const loadDashboard = async () => {
  try {
    activeIssueFilter.value = null
    await fetchDashboard()
  } catch {
    // Error state is handled in the dashboard store.
  }
}

const handleIssueSelect = async (issueKey: string) => {
  const targetByIssue: Record<string, RouteLocationRaw> = {
    missingAttendanceCount: attendanceRouteLocation({
      status: 'missing_attendance',
      date: 'today',
    }),
    missingCheckout: attendanceRouteLocation({
      status: 'missing_checkout',
      date: 'today',
    }),
    lateArrivals: attendanceRouteLocation({
      status: 'late',
      date: 'today',
    }),
    incompleteAttendance: attendanceRouteLocation({
      status: 'incomplete',
      date: 'today',
    }),
  }

  const target = targetByIssue[issueKey]

  if (target && (await navigateIfAvailable(target))) {
    return
  }

  activeIssueFilter.value = activeIssueFilter.value === issueKey ? null : issueKey
}

const handleViewAllRecords = async () => {
  if (await navigateIfAvailable({ path: '/attendance' })) {
    return
  }

  activeIssueFilter.value = null
  scrollToSection(recordsSectionRef.value)
}

const handleRecordClick = async (
  record: EmployeeDashboardRecord | WorkforceDashboardRecord,
) => {
  const query: Record<string, string | number> = {
    date: record.date,
  }

  if ('employee' in record) {
    query.employeeId = record.employee.id
  }

  await navigateIfAvailable(attendanceRouteLocation(query))
}

onMounted(async () => {
  await loadDashboard()
})

function canAccessDashboardAction(actionKey: string) {
  if (actionKey === 'scan_attendance') {
    return hasUserEmployeePermission(currentUser.value, PERMISSIONS.ATTENDANCE_RECORD)
  }

  if (actionKey === 'view_attendance_history' || actionKey === 'attendance_history') {
    return canAccessAttendancePage.value && canViewPersonalAttendanceHistory.value
  }

  if (actionKey === 'review_attendance') {
    return canAccessAttendancePage.value && canViewWorkforceAttendance.value
  }

  if (actionKey === 'manage_employees') {
    return canAccessEmployeesPage.value
  }

  if (actionKey === 'manage_users') {
    return canAccessUsersPage.value
  }

  if (actionKey === 'profile' || actionKey === 'change_password') {
    return true
  }

  return false
}

function formatStatus(status: string) {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function formatCount(value: number | null | undefined) {
  return String(value ?? 0)
}

function getSummaryBadgeVariant(status: string): 'default' | 'success' | 'warning' | 'danger' {
  if (status === 'checked_in' || status === 'present') return 'success'
  if (status === 'checked_out') return 'default'
  if (status === 'late') return 'warning'
  return 'danger'
}

function isEmployeeDashboardResponse(
  value: DashboardResponse | null,
): value is EmployeeDashboardResponse {
  return Boolean(value?.summary && 'todayAttendanceStatus' in value.summary)
}

function isWorkforceDashboardResponse(
  value: DashboardResponse | null,
): value is HrDashboardResponse | AdminDashboardResponse {
  return Boolean(value?.summary && 'totalEmployees' in value.summary)
}

function isAdminDashboardResponse(
  value: DashboardResponse | null,
): value is AdminDashboardResponse {
  return Boolean(value?.summary && 'totalUsers' in value.summary)
}
</script>

<template>
  <main class="dashboard-page">
    <div class="dashboard-header">
      <div>
        <h1 class="dashboard-title">Dashboard</h1>
        <p class="dashboard-subtitle">
          See important updates, recent activity, and key information in one place.
        </p>
      </div>

      <div class="dashboard-header-actions">
        <p class="dashboard-last-updated">Last updated: {{ formattedLastUpdated }}</p>
        <BaseButton :loading="isLoading" variant="secondary" @click="loadDashboard">
          Refresh
        </BaseButton>
      </div>
    </div>

    <div v-if="isLoading" class="dashboard-loading">
      <BaseCard v-for="index in 8" :key="index" class="dashboard-skeleton-card">
        <div class="dashboard-skeleton-body">
          <div class="dashboard-skeleton-line short" />
          <div class="dashboard-skeleton-line large" />
          <BaseSpinner />
        </div>
      </BaseCard>
    </div>

    <BaseCard v-else-if="error" class="dashboard-state-card">
      <div class="dashboard-state-body">
        <h3 class="dashboard-state-title">Failed to load dashboard</h3>
        <p class="dashboard-state-text">{{ error }}</p>
        <BaseButton @click="loadDashboard">Try Again</BaseButton>
      </div>
    </BaseCard>

    <BaseCard v-else-if="!hasDashboardData" class="dashboard-state-card">
      <div class="dashboard-state-body">
        <h3 class="dashboard-state-title">No dashboard data</h3>
        <p class="dashboard-state-text">
          There is no dashboard information to show right now.
        </p>
      </div>
    </BaseCard>

    <template v-else-if="employeeDashboard">
      <section v-if="canViewPersonalAttendanceSummary" class="dashboard-stack-section">
        <DashboardSummaryCards :items="employeePrimaryCards" />
      </section>

      <section v-if="canViewPersonalAttendanceSummary" class="dashboard-stack-section">
        <DashboardSummaryCards :items="employeeSecondaryCards" tone="secondary" />
      </section>

      <section
        v-if="employeeQuickActions.length"
        class="dashboard-stack-section dashboard-stack-section-contained"
      >
        <DashboardQuickActions
          :actions="employeeQuickActions"
          :next-action="employeeDashboard.summary.nextAction"
          primary-action-key="scan_attendance"
          @action-click="handleDashboardAction"
        />
      </section>

      <section v-if="canViewPersonalAttendanceHistory" class="dashboard-stack-section">
        <DashboardRecentRecords
          :records="employeeDashboard.recentRecords"
          :show-employee-column="false"
          @row-click="handleRecordClick"
          @view-all="handleViewAllRecords"
        />
      </section>
    </template>

    <template v-else-if="hrDashboard">
      <DashboardSummaryCards v-if="canViewWorkforceOverview" :items="workforcePrimaryCards" />

      <DashboardSummaryCards v-if="hrSecondaryCards.length" :items="hrSecondaryCards" tone="secondary" />

      <div v-if="hrIssueCards.length" ref="issueSectionRef">
        <DashboardIssueCards
          :active-key="activeIssueFilter"
          :items="hrIssueCards"
          @select="handleIssueSelect"
        />
      </div>

      <DashboardQuickActions
        v-if="hrQuickActions.length"
        :actions="hrQuickActions"
        @action-click="handleDashboardAction"
      />

      <div v-if="canViewWorkforceAttendance" ref="recordsSectionRef">
        <DashboardRecentRecords
          :records="workforceRecentRecords"
          :show-employee-column="true"
          @row-click="handleRecordClick"
          @view-all="handleViewAllRecords"
        />
      </div>
    </template>

    <template v-else-if="adminDashboard">
      <DashboardSummaryCards v-if="canViewWorkforceOverview" :items="workforcePrimaryCards" />

      <div v-if="showAdminSecondaryGrid" class="dashboard-secondary-grid">
        <DashboardIssueCards
          v-if="hrIssueCards.length"
          :active-key="activeIssueFilter"
          :items="hrIssueCards"
          @select="handleIssueSelect"
        />
        <DashboardAdminSection v-if="canAccessUsersPage" :summary="adminDashboard.summary" />
      </div>

      <DashboardQuickActions
        v-if="adminQuickActions.length"
        :actions="adminQuickActions"
        primary-action-key="manage_users"
        @action-click="handleDashboardAction"
      />

      <DashboardRecentRecords
        v-if="canViewWorkforceAttendance"
        :records="workforceRecentRecords"
        :show-employee-column="true"
        @row-click="handleRecordClick"
        @view-all="handleViewAllRecords"
      />
    </template>
  </main>
</template>

<style scoped>
.dashboard-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
  min-width: 0;
}

.dashboard-stack-section {
  width: 100%;
  min-width: 0;
}

.dashboard-stack-section-contained {
  overflow: hidden;
}

.dashboard-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
  min-width: 0;
}

.dashboard-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.dashboard-title {
  color: hsl(var(--foreground));
}

.dashboard-subtitle {
  margin-top: 0.25rem;
  color: hsl(var(--muted-foreground));
}

.dashboard-last-updated {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-xs);
  white-space: nowrap;
}

.dashboard-loading {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 1rem;
  width: 100%;
  min-width: 0;
}

.dashboard-skeleton-card {
  min-height: 10rem;
}

.dashboard-skeleton-body {
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.25rem;
}

.dashboard-skeleton-line {
  border-radius: 9999px;
  background: hsl(var(--secondary));
}

.dashboard-skeleton-line.short {
  width: 40%;
  height: 0.75rem;
}

.dashboard-skeleton-line.large {
  width: 65%;
  height: 2rem;
}

.dashboard-state-card {
  min-height: 16rem;
}

.dashboard-state-body {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
}

.dashboard-state-title {
  color: hsl(var(--foreground));
}

.dashboard-state-text {
  color: hsl(var(--muted-foreground));
}

.dashboard-secondary-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(16rem, 1fr);
  gap: 1rem;
  align-items: start;
  min-width: 0;
}

@media (max-width: 768px) {
  .dashboard-header {
    flex-direction: column;
  }

  .dashboard-header-actions {
    width: 100%;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
  }

  .dashboard-secondary-grid {
    grid-template-columns: 1fr;
  }
}
</style>
