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
import { ROLES, isOneOfRoles } from '@/constants/roles'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
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
  EmployeeDashboardResponse,
  EmployeeDashboardRecord,
  HrDashboardResponse,
  WorkforceDashboardRecord,
} from '@/features/dashboard/interface/dashboard.interface'
import type { DashboardIssueCardItem } from '@/features/dashboard/components/DashboardIssueCards.vue'

const { dashboard, error, isLoading, fetchDashboard, lastUpdated } = useDashboard()
const router = useRouter()
const issueSectionRef = ref<HTMLElement | null>(null)
const recordsSectionRef = ref<HTMLElement | null>(null)

const employeeDashboard = computed(() => {
  if (!isOneOfRoles(dashboard.value?.role, [ROLES.EMPLOYEE])) return null
  return dashboard.value as EmployeeDashboardResponse
})

const hrDashboard = computed(() => {
  if (!isOneOfRoles(dashboard.value?.role, [ROLES.HR])) return null
  return dashboard.value as HrDashboardResponse
})

const adminDashboard = computed(() => {
  if (!isOneOfRoles(dashboard.value?.role, [ROLES.ADMIN])) return null
  return dashboard.value as AdminDashboardResponse
})

const activeIssueFilter = ref<string | null>(null)

const hasDashboardData = computed(() => dashboard.value !== null)

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

  return [
    {
      key: 'missingAttendanceCount',
      label: 'Missing Attendance',
      value: formatCount(hrDashboard.value.summary.missingAttendanceCount),
      helper: 'Needs follow-up',
      icon: ShieldAlert,
    },
    {
      key: 'employeesOnLeaveTodayCount',
      label: 'Employees On Leave Today',
      value: formatCount(hrDashboard.value.summary.employeesOnLeaveTodayCount),
      helper: 'Approved leave',
      icon: Briefcase,
    },
  ]
})

const hrIssueCards = computed<DashboardIssueCardItem[]>(() => {
  const source = hrDashboard.value ?? adminDashboard.value

  if (!source) return []

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
    manage_employees: { path: '/employees' },
    manage_users: { path: '/users' },
    review_attendance: attendanceRouteLocation({ mode: 'review', date: 'today' }),
    attendance_history: attendanceRouteLocation({ view: 'history' }),
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
      <section class="dashboard-stack-section">
        <DashboardSummaryCards :items="employeePrimaryCards" />
      </section>

      <section class="dashboard-stack-section">
        <DashboardSummaryCards :items="employeeSecondaryCards" tone="secondary" />
      </section>

      <section class="dashboard-stack-section dashboard-stack-section-contained">
        <DashboardQuickActions
          :actions="employeeDashboard.quickActions"
          :next-action="employeeDashboard.summary.nextAction"
          primary-action-key="scan_attendance"
        />
      </section>

      <section class="dashboard-stack-section">
        <DashboardRecentRecords
          :records="employeeDashboard.recentRecords"
          :role="employeeDashboard.role"
          @view-all="handleViewAllRecords"
        />
      </section>
    </template>

    <template v-else-if="hrDashboard">
      <DashboardSummaryCards :items="workforcePrimaryCards" />

      <DashboardSummaryCards :items="hrSecondaryCards" tone="secondary" />

      <div ref="issueSectionRef">
        <DashboardIssueCards
          :active-key="activeIssueFilter"
          :items="hrIssueCards"
          @select="handleIssueSelect"
        />
      </div>

      <DashboardQuickActions
        :actions="hrDashboard.quickActions ?? []"
        @action-click="handleDashboardAction"
      />

      <div ref="recordsSectionRef">
        <DashboardRecentRecords
          :records="workforceRecentRecords"
          :role="hrDashboard.role"
          @row-click="handleRecordClick"
          @view-all="handleViewAllRecords"
        />
      </div>
    </template>

    <template v-else-if="adminDashboard">
      <DashboardSummaryCards :items="workforcePrimaryCards" />

      <div class="dashboard-secondary-grid">
        <DashboardIssueCards
          :active-key="activeIssueFilter"
          :items="hrIssueCards"
          @select="handleIssueSelect"
        />
        <DashboardAdminSection :summary="adminDashboard.summary" />
      </div>

      <DashboardQuickActions
        :actions="adminDashboard.quickActions"
        primary-action-key="manage_users"
      />

      <DashboardRecentRecords
        :records="workforceRecentRecords"
        :role="adminDashboard.role"
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
