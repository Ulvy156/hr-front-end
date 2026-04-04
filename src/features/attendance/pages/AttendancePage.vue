<script setup lang="ts">
import {
  AlertCircle,
  BadgeCheck,
  Briefcase,
  Building2,
  CalendarDays,
  Clock3,
  ClockAlert,
  Eye,
  FileDown,
  FileClock,
  Hourglass,
  NotebookTabs,
  PencilLine,
  Timer,
  UserX,
  Users,
} from 'lucide-vue-next'
import { ROLES, isManagementRole as hasManagementRole } from '@/constants/roles'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import DashboardSummaryCards, {
  type DashboardSummaryCardItem,
} from '@/features/dashboard/components/DashboardSummaryCards.vue'

import AttendanceCorrectionRequests from '../components/AttendanceCorrectionRequests.vue'
import AttendanceDepartmentSummary from '../components/AttendanceDepartmentSummary.vue'
import AttendanceEmployeeActions from '../components/AttendanceEmployeeActions.vue'
import AttendancePlaceholderSection from '../components/AttendancePlaceholderSection.vue'
import AttendanceRecordsTable from '../components/AttendanceRecordsTable.vue'
import AttendanceStatusBadge from '../components/AttendanceStatusBadge.vue'
import { useAttendance } from '../composable/useAttendance'
import type {
  AttendanceExportParams,
  AttendanceListParams,
  AttendanceRecord,
} from '../interface/attendance.interface'

const {
  attendanceDetail,
  attendanceList,
  correctionRequests,
  employeeData,
  error,
  correctAttendance,
  exportExcel,
  exportPdf,
  fetchAttendanceDetail,
  fetchAttendanceList,
  fetchCorrectionRequests,
  fetchEmployeeAttendance,
  fetchOrganizationAttendance,
  isDetailLoading,
  isLoading,
  lastUpdated,
  organizationData,
  role,
} = useAttendance()

const selectedDateRange = ref<[string, string] | null>(getCurrentMonthDateRange())
const selectedDepartmentId = ref<string | number | undefined>(undefined)
const statusFilter = ref('')
const employeeSearch = ref('')
const attendancePage = ref(1)
const allDepartmentOptions = ref<BaseDropdownOption[]>([])
const activeManagementTab = ref<'management' | 'department' | 'audit'>('management')
const isAttendanceDetailOpen = ref(false)
const isModifyModalOpen = ref(false)
const isSubmittingModification = ref(false)
const isExportingPdf = ref(false)
const isExportingExcel = ref(false)
const exportError = ref('')
const modifyForm = reactive({
  attendanceId: 0,
  attendanceDate: '',
  checkInTime: '',
  checkOutTime: '',
  correctionReason: '',
  notes: '',
})

const isEmployeeRole = computed(() => role.value === ROLES.EMPLOYEE)
const isHrRole = computed(() => role.value === ROLES.HR)
const isManagementRole = computed(() => hasManagementRole(role.value))
const hasAuditTab = computed(() => isHrRole.value)

const hasData = computed(() => {
  if (isEmployeeRole.value) {
    return employeeData.value !== null
  }

  if (isManagementRole.value) {
    return organizationData.value !== null
  }

  return false
})

const showInitialLoading = computed(() => isLoading.value && !hasData.value)
const showBlockingError = computed(() => Boolean(error.value) && !hasData.value)
const showUnsupportedRole = computed(() => !role.value && !isLoading.value)
const showEmptyState = computed(() => !hasData.value && !isLoading.value && !error.value && Boolean(role.value))

const formattedLastUpdated = computed(() => {
  if (!lastUpdated.value) return 'Never'

  return new Date(lastUpdated.value).toLocaleString()
})

const employeeIdentity = computed(() => employeeData.value?.employee ?? null)
const employeeToday = computed(() => employeeData.value?.today ?? null)
const employeeWeek = computed(() => employeeData.value?.thisWeek ?? null)
const employeeMonth = computed(() => employeeData.value?.thisMonth ?? null)
const selectedFromDate = computed(() => selectedDateRange.value?.[0] ?? undefined)
const selectedToDate = computed(() => selectedDateRange.value?.[1] ?? undefined)
const selectedSummaryMonth = computed(() => {
  const fromDate = selectedFromDate.value

  return fromDate ? fromDate.slice(0, 7) : getCurrentMonth()
})
const departmentIdFilter = computed<number | undefined>(() => {
  if (selectedDepartmentId.value === null || selectedDepartmentId.value === undefined) {
    return undefined
  }

  const parsedValue = Number(selectedDepartmentId.value)

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : undefined
})

const employeeIdFilter = computed<number | undefined>(() => {
  const normalizedValue = employeeSearch.value.trim()

  if (!normalizedValue) {
    return undefined
  }

  const parsedValue = Number(normalizedValue)

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : undefined
})

const departmentFilterOptions = computed<BaseDropdownOption[]>(() => allDepartmentOptions.value)

const statusFilterOptions: BaseDropdownOption[] = [
  { label: 'All statuses', value: '' },
  { label: 'Present', value: 'present' },
  { label: 'Late', value: 'late' },
  { label: 'Absent', value: 'absent' },
  { label: 'Corrected', value: 'corrected' },
]

const organizationPrimaryCards = computed<DashboardSummaryCardItem[]>(() => {
  const totals = organizationData.value?.totals

  if (!totals) return []

  return [
    {
      key: 'totalRecords',
      label: 'Total Records',
      value: formatCount(totals.totalRecords),
      icon: NotebookTabs,
    },
    {
      key: 'completedRecords',
      label: 'Completed Records',
      value: formatCount(totals.completedRecords),
      icon: BadgeCheck,
    },
    {
      key: 'lateRecords',
      label: 'Late Records',
      value: formatCount(totals.lateRecords),
      icon: ClockAlert,
    },
    {
      key: 'correctedRecords',
      label: 'Corrected Records',
      value: formatCount(totals.correctedRecords),
      icon: PencilLine,
    },
  ]
})

const organizationSecondaryCards = computed<DashboardSummaryCardItem[]>(() => {
  const totals = organizationData.value?.totals

  if (!totals) return []

  return [
    {
      key: 'absentRecords',
      label: 'Absent Records',
      value: formatCount(totals.absentRecords),
      icon: UserX,
    },
    {
      key: 'totalWorkedMinutes',
      label: 'Total Worked Minutes',
      value: formatMinutes(totals.totalWorkedMinutes),
      helper: `${formatCount(totals.totalWorkedMinutes)} minutes`,
      icon: Timer,
    },
    {
      key: 'averageWorkedMinutes',
      label: 'Average Worked Minutes',
      value: formatMinutes(totals.averageWorkedMinutes),
      helper: `${formatCount(totals.averageWorkedMinutes)} minutes`,
      icon: Hourglass,
    },
    {
      key: 'pendingCorrectionRequestsCount',
      label: 'Pending Correction Requests',
      value: formatCount(totals.pendingCorrectionRequestsCount),
      icon: FileClock,
    },
  ]
})

const employeeWeekCards = computed<DashboardSummaryCardItem[]>(() => {
  if (!employeeWeek.value) return []

  return [
    {
      key: 'presentDays',
      label: 'Present Days',
      value: formatCount(employeeWeek.value.presentDays),
      icon: CalendarDays,
    },
    {
      key: 'lateCount',
      label: 'Late Count',
      value: formatCount(employeeWeek.value.lateCount),
      icon: ClockAlert,
    },
    {
      key: 'absentCount',
      label: 'Absent Count',
      value: formatCount(employeeWeek.value.absentCount),
      icon: AlertCircle,
    },
    {
      key: 'workedMinutes',
      label: 'Worked Minutes',
      value: formatMinutes(employeeWeek.value.workedMinutes),
      helper: `${formatCount(employeeWeek.value.workedMinutes)} minutes`,
      icon: Timer,
    },
  ]
})

const employeeMonthCards = computed<DashboardSummaryCardItem[]>(() => {
  if (!employeeMonth.value) return []

  return [
    {
      key: 'presentDays',
      label: 'Present Days',
      value: formatCount(employeeMonth.value.presentDays),
      icon: CalendarDays,
    },
    {
      key: 'lateCount',
      label: 'Late Count',
      value: formatCount(employeeMonth.value.lateCount),
      icon: ClockAlert,
    },
    {
      key: 'absentCount',
      label: 'Absent Count',
      value: formatCount(employeeMonth.value.absentCount),
      icon: AlertCircle,
    },
    {
      key: 'workedMinutes',
      label: 'Worked Minutes',
      value: formatMinutes(employeeMonth.value.workedMinutes),
      helper: `${formatCount(employeeMonth.value.workedMinutes)} minutes`,
      icon: Timer,
    },
    {
      key: 'pendingCorrectionRequests',
      label: 'Pending Correction Requests',
      value: formatCount(employeeMonth.value.pendingCorrectionRequests),
      icon: FileClock,
    },
  ]
})

const todayDetails = computed(() => {
  const today = employeeToday.value

  if (!today) return []

  return [
    {
      key: 'attendanceDate',
      label: 'Attendance Date',
      value: formatDate(today.attendanceDate),
    },
    {
      key: 'checkInTime',
      label: 'Check-in Time',
      value: formatTime(today.checkInTime),
    },
    {
      key: 'checkOutTime',
      label: 'Check-out Time',
      value: formatTime(today.checkOutTime),
    },
    {
      key: 'workedMinutes',
      label: 'Worked Minutes',
      value: formatMinutes(today.workedMinutes),
    },
    {
      key: 'lateMinutes',
      label: 'Late Minutes',
      value: formatMinutes(today.lateMinutes),
    },
    {
      key: 'earlyLeaveMinutes',
      label: 'Early Leave Minutes',
      value: formatMinutes(today.earlyLeaveMinutes),
    },
  ]
})

const attendanceListParams = computed<AttendanceListParams>(() => {
  return {
    employee_id: isHrRole.value ? employeeIdFilter.value : undefined,
    department_id: isHrRole.value ? departmentIdFilter.value : undefined,
    status: statusFilter.value || undefined,
    from_date: selectedFromDate.value,
    to_date: selectedToDate.value,
    page: attendancePage.value,
    per_page: 20,
  }
})

const attendanceExportParams = computed<AttendanceExportParams>(() => ({
  employee_id: isHrRole.value ? employeeIdFilter.value : undefined,
  department_id: isHrRole.value ? departmentIdFilter.value : undefined,
  status: isHrRole.value ? statusFilter.value || undefined : undefined,
  from_date: selectedFromDate.value,
  to_date: selectedToDate.value,
}))

const loadAttendance = async () => {
  if (!role.value) {
    return
  }

  try {
    if (isEmployeeRole.value) {
      await fetchEmployeeAttendance()
      return
    }

    const params =
      isHrRole.value
        ? {
            month: selectedSummaryMonth.value,
            department_id: departmentIdFilter.value,
          }
        : {
            month: selectedSummaryMonth.value,
          }

    await Promise.all([
      fetchOrganizationAttendance(params),
      fetchAttendanceList(attendanceListParams.value),
      isHrRole.value
        ? fetchCorrectionRequests({
            employee_id: employeeIdFilter.value,
            from_date: attendanceListParams.value.from_date,
            to_date: attendanceListParams.value.to_date,
            per_page: 20,
            status: 'pending',
          })
        : Promise.resolve(),
    ])
  } catch {
    // Error state is handled by the attendance store.
  }
}

const openAttendanceDetail = async (record: AttendanceRecord) => {
  isAttendanceDetailOpen.value = true
  try {
    await fetchAttendanceDetail(record.id)
  } catch {
    // The page-level error state already handles request failures.
  }
}

const openModifyModal = (record: AttendanceRecord) => {
  modifyForm.attendanceId = record.id
  modifyForm.attendanceDate = record.attendanceDate
  modifyForm.checkInTime = record.checkInTime ? record.checkInTime.slice(0, 5) : ''
  modifyForm.checkOutTime = record.checkOutTime ? record.checkOutTime.slice(0, 5) : ''
  modifyForm.correctionReason = record.correctionReason ?? ''
  modifyForm.notes = record.notes ?? ''
  isModifyModalOpen.value = true
}

const resetModifyForm = () => {
  modifyForm.attendanceId = 0
  modifyForm.attendanceDate = ''
  modifyForm.checkInTime = ''
  modifyForm.checkOutTime = ''
  modifyForm.correctionReason = ''
  modifyForm.notes = ''
}

const closeModifyModal = () => {
  isModifyModalOpen.value = false
  resetModifyForm()
}

const toAttendanceDateTime = (date: string, time: string) => {
  if (!date || !time) {
    return null
  }

  return `${date}T${time}:00+07:00`
}

const submitAttendanceModification = async () => {
  if (!modifyForm.attendanceId || !modifyForm.correctionReason.trim()) {
    return
  }

  isSubmittingModification.value = true

  try {
    await correctAttendance(modifyForm.attendanceId, {
      check_in_time: toAttendanceDateTime(modifyForm.attendanceDate, modifyForm.checkInTime),
      check_out_time: toAttendanceDateTime(modifyForm.attendanceDate, modifyForm.checkOutTime),
      correction_reason: modifyForm.correctionReason.trim(),
      notes: modifyForm.notes.trim() || null,
    })

    await loadAttendance()
    closeModifyModal()
  } finally {
    isSubmittingModification.value = false
  }
}

const downloadExportFile = (blob: Blob, filename: string) => {
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

const handleExport = async (format: 'pdf' | 'excel') => {
  exportError.value = ''

  if (format === 'pdf') {
    isExportingPdf.value = true
  } else {
    isExportingExcel.value = true
  }

  try {
    const response =
      format === 'pdf'
        ? await exportPdf(attendanceExportParams.value)
        : await exportExcel(attendanceExportParams.value)

    downloadExportFile(response.blob, response.filename)
  } catch (err) {
    exportError.value = err instanceof Error ? err.message : 'Failed to export attendance.'
  } finally {
    if (format === 'pdf') {
      isExportingPdf.value = false
    } else {
      isExportingExcel.value = false
    }
  }
}

const applyFilters = async () => {
  attendancePage.value = 1
  await loadAttendance()
}

const handleAttendancePageChange = async (page: number) => {
  if (!isManagementRole.value || page < 1 || page === attendancePage.value) {
    return
  }

  attendancePage.value = page

  try {
    await fetchAttendanceList(attendanceListParams.value)
  } catch {
    // Error state is handled by the attendance store.
  }
}

watch(
  () => organizationData.value?.byDepartment,
  (departments) => {
    if (!departments?.length) {
      return
    }

    const nextOptions = [...allDepartmentOptions.value]

    departments.forEach((department) => {
      const existingIndex = nextOptions.findIndex(
        (option) => option.value === department.departmentId,
      )
      const nextOption = {
        label: department.departmentName,
        value: department.departmentId,
      }

      if (existingIndex >= 0) {
        nextOptions[existingIndex] = nextOption
        return
      }

      nextOptions.push(nextOption)
    })

    nextOptions.sort((left, right) => left.label.localeCompare(right.label))
    allDepartmentOptions.value = nextOptions
  },
  { immediate: true },
)

watch(
  () => role.value,
  async (nextRole) => {
    if (!nextRole) return

    activeManagementTab.value = 'management'

    if (nextRole !== ROLES.HR) {
      selectedDepartmentId.value = undefined
      allDepartmentOptions.value = []
    }

    attendancePage.value = 1

    await loadAttendance()
  },
  { immediate: true },
)

watch([selectedDateRange, selectedDepartmentId, statusFilter, employeeSearch], () => {
  attendancePage.value = 1
})

function formatCount(value: number | null | undefined) {
  return String(value ?? 0)
}

function formatDate(value: string | null | undefined) {
  if (!value) return '--'

  return new Date(value).toLocaleDateString()
}

function formatTime(value: string | null | undefined) {
  if (!value) return '--'

  return value.slice(0, 5)
}

function formatMinutes(value: number | null | undefined) {
  const minutes = value ?? 0
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) {
    return `${remainingMinutes}m`
  }

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}m`
}

function getCurrentMonth() {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')

  return `${now.getFullYear()}-${month}`
}

function getCurrentMonthDateRange(): [string, string] {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const monthText = String(month + 1).padStart(2, '0')
  const lastDay = new Date(year, month + 1, 0).getDate()

  return [
    `${year}-${monthText}-01`,
    `${year}-${monthText}-${String(lastDay).padStart(2, '0')}`,
  ]
}
</script>

<template>
  <main class="attendance-page">
    <div class="attendance-header">
      <div>
        <h1 class="attendance-title">Attendance</h1>
        <p class="attendance-subtitle">
          Attendance view adapts to your authenticated role and the connected attendance APIs.
        </p>
      </div>

      <div class="attendance-header-actions">
        <div class="attendance-header-meta">
          <p class="attendance-last-updated">Last updated: {{ formattedLastUpdated }}</p>
          <p v-if="exportError" class="attendance-export-error">{{ exportError }}</p>
        </div>

        <div class="attendance-header-buttons">
          <BaseButton
            :loading="isExportingPdf"
            variant="ghost"
            @click="handleExport('pdf')"
          >
            <FileDown :size="16" />
            Export PDF
          </BaseButton>
          <BaseButton
            :loading="isExportingExcel"
            variant="ghost"
            @click="handleExport('excel')"
          >
            <FileDown :size="16" />
            Export Excel
          </BaseButton>
          <BaseButton :loading="isLoading" variant="secondary" @click="loadAttendance">
            Refresh
          </BaseButton>
        </div>
      </div>
    </div>

    <div v-if="showInitialLoading" class="attendance-loading">
      <BaseCard v-for="index in 6" :key="index" class="attendance-skeleton-card">
        <div class="attendance-skeleton-body">
          <div class="attendance-skeleton-line short" />
          <div class="attendance-skeleton-line large" />
          <BaseSpinner />
        </div>
      </BaseCard>
    </div>

    <BaseCard v-else-if="showBlockingError" class="attendance-state-card">
      <div class="attendance-state-body">
        <h3 class="attendance-state-title">Failed to load attendance</h3>
        <p class="attendance-state-text">{{ error }}</p>
        <BaseButton @click="loadAttendance">Try Again</BaseButton>
      </div>
    </BaseCard>

    <BaseCard v-else-if="showUnsupportedRole" class="attendance-state-card">
      <div class="attendance-state-body">
        <h3 class="attendance-state-title">Unsupported role</h3>
        <p class="attendance-state-text">
          This attendance page supports employee, hr, and admin roles.
        </p>
      </div>
    </BaseCard>

    <BaseCard v-else-if="showEmptyState" class="attendance-state-card">
      <div class="attendance-state-body">
        <h3 class="attendance-state-title">No attendance data</h3>
        <p class="attendance-state-text">
          Attendance data is not available for this role yet.
        </p>
      </div>
    </BaseCard>

    <template v-else-if="isEmployeeRole && employeeData">
      <BaseCard class="attendance-identity-card">
        <div class="attendance-identity-body">
          <div>
            <p class="attendance-section-label">Employee</p>
            <h2 class="attendance-identity-title">{{ employeeIdentity?.name ?? '--' }}</h2>
          </div>
          <div class="attendance-identity-meta">
            <span class="attendance-meta-item">
              <Briefcase :size="16" />
              {{ employeeIdentity?.department ?? '--' }}
            </span>
            <span class="attendance-meta-item">
              <Users :size="16" />
              ID #{{ employeeIdentity?.id ?? '--' }}
            </span>
          </div>
        </div>
      </BaseCard>

      <BaseCard class="attendance-today-card">
        <div class="attendance-today-header">
          <div>
            <h3 class="attendance-section-title">Today Attendance</h3>
            <p class="attendance-section-text">
              Self-service attendance state for {{ formatDate(employeeToday?.attendanceDate) }}.
            </p>
          </div>

          <div class="attendance-today-badges">
            <AttendanceStatusBadge :status="employeeToday?.todayAttendanceStatus" />
            <AttendanceStatusBadge :status="employeeToday?.correctionStatus" />
          </div>
        </div>

        <div class="attendance-today-grid">
          <div class="attendance-detail-card">
            <span class="attendance-detail-label">Next Action</span>
            <div class="attendance-detail-inline">
              <Clock3 :size="16" />
              <span class="attendance-detail-value">
                {{
                  employeeToday?.nextAction
                    ? employeeToday.nextAction
                        .split('_')
                        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')
                    : '--'
                }}
              </span>
            </div>
          </div>

          <div
            v-for="detail in todayDetails"
            :key="detail.key"
            class="attendance-detail-card"
          >
            <span class="attendance-detail-label">{{ detail.label }}</span>
            <span class="attendance-detail-value">{{ detail.value }}</span>
          </div>
        </div>
      </BaseCard>

      <AttendanceEmployeeActions
        :correction-status="employeeToday?.correctionStatus ?? 'none'"
        :next-action="employeeToday?.nextAction ?? null"
      />

      <section class="attendance-summary-section">
        <div>
          <h3 class="attendance-section-title">This Week</h3>
          <p class="attendance-section-text">Weekly self-service attendance summary.</p>
        </div>
        <DashboardSummaryCards :items="employeeWeekCards" />
      </section>

      <section class="attendance-summary-section">
        <div>
          <h3 class="attendance-section-title">This Month</h3>
          <p class="attendance-section-text">Monthly self-service attendance summary.</p>
        </div>
        <DashboardSummaryCards :items="employeeMonthCards" tone="secondary" />
      </section>
    </template>

    <template v-else-if="isManagementRole && organizationData">
      <BaseCard class="attendance-context-card">
        <div class="attendance-context-body">
          <div>
            <p class="attendance-section-label">Attendance Overview</p>
            <h2 class="attendance-context-title">{{ organizationData.month ?? '--' }}</h2>
          </div>

          <div class="attendance-context-range">
            <span class="attendance-meta-item">
              <CalendarDays :size="16" />
              {{ formatDate(organizationData.dateRange?.from) }}
            </span>
            <span class="attendance-meta-separator">to</span>
            <span class="attendance-meta-item">
              <CalendarDays :size="16" />
              {{ formatDate(organizationData.dateRange?.to) }}
            </span>
          </div>
        </div>
      </BaseCard>

      <DashboardSummaryCards :items="organizationPrimaryCards" />
      <DashboardSummaryCards :items="organizationSecondaryCards" tone="secondary" />

      <ElTabs v-model="activeManagementTab" class="attendance-tabs">
        <ElTabPane name="management">
          <template #label>
            <span class="attendance-tab-label">
              <CalendarDays :size="16" />
              <span>Attendance Management</span>
            </span>
          </template>

          <div class="attendance-tab-panel">
            <section class="attendance-summary-section">
              <div v-if="isHrRole">
                <h3 class="attendance-section-title">Attendance Management</h3>
                <p class="attendance-section-text">
                  Filters, attendance records, and correction requests are managed together in one operational section.
                </p>
              </div>
              <div v-else>
                <h3 class="attendance-section-title">Attendance Records</h3>
                <p class="attendance-section-text">
                  Read-only attendance records returned from the attendance list endpoint.
                </p>
              </div>

              <BaseCard v-if="isHrRole" class="attendance-management-card">
                <div class="attendance-filters-grid">
                  <BaseDatePicker
                    v-model="selectedDateRange"
                    @change="applyFilters"
                    end-placeholder="To date"
                    label="Date Range"
                    start-placeholder="From date"
                    type="daterange"
                    value-format="YYYY-MM-DD"
                  />
                  <BaseDropdown
                    v-model="selectedDepartmentId"
                    @change="applyFilters"
                    label="Department"
                    :options="departmentFilterOptions"
                    placeholder="All available departments"
                  />
                  <BaseDropdown
                    v-model="statusFilter"
                    @change="applyFilters"
                    :options="statusFilterOptions"
                    clearable
                    label="Status"
                    placeholder="All statuses"
                  />
                  <BaseInput
                    v-model="employeeSearch"
                    label="Employee ID"
                    placeholder="Filter by employee ID"
                    type="number"
                  />
                </div>

                <div class="attendance-filters-actions">
                  <BaseButton variant="secondary" @click="applyFilters">Apply Filters</BaseButton>
                </div>
                <div class="attendance-management-content">
                  <AttendanceRecordsTable
                    :can-modify="true"
                    :records="attendanceList"
                    @modify-click="openModifyModal"
                    @page-change="handleAttendancePageChange"
                    @row-click="openAttendanceDetail"
                  />

                  <AttendanceCorrectionRequests :requests="correctionRequests" embedded />
                </div>
              </BaseCard>

              <AttendanceRecordsTable
                v-else
                :records="attendanceList"
                @page-change="handleAttendancePageChange"
                @row-click="openAttendanceDetail"
              />
            </section>
          </div>
        </ElTabPane>

        <ElTabPane name="department">
          <template #label>
            <span class="attendance-tab-label">
              <Building2 :size="16" />
              <span>Department Summary</span>
            </span>
          </template>

          <div class="attendance-tab-panel">
            <section class="attendance-summary-section">
              <AttendanceDepartmentSummary :rows="organizationData.byDepartment ?? []" />
            </section>
          </div>
        </ElTabPane>

        <ElTabPane v-if="hasAuditTab" name="audit">
          <template #label>
            <span class="attendance-tab-label">
              <Eye :size="16" />
              <span>Audit & Oversight</span>
            </span>
          </template>

          <div class="attendance-tab-panel">
            <section class="attendance-summary-section">
              <AttendancePlaceholderSection
                description="Audit logs and oversight-specific attendance reporting can be added here when those read-only endpoints are connected to this page."
                title="Audit & Oversight"
              />
            </section>
          </div>
        </ElTabPane>
      </ElTabs>
    </template>

    <BaseModal
      :open="isAttendanceDetailOpen"
      title="Attendance Detail"
      @close="isAttendanceDetailOpen = false"
    >
      <div v-if="isDetailLoading" class="attendance-detail-modal-state">
        <BaseSpinner />
      </div>

      <div v-else-if="attendanceDetail" class="attendance-detail-modal-grid">
        <div class="attendance-detail-modal-item">
          <span class="attendance-detail-label">Employee</span>
          <span class="attendance-detail-value">{{ attendanceDetail.employee?.name ?? '--' }}</span>
        </div>
        <div class="attendance-detail-modal-item">
          <span class="attendance-detail-label">Department</span>
          <span class="attendance-detail-value">
            {{ attendanceDetail.employee?.department ?? '--' }}
          </span>
        </div>
        <div class="attendance-detail-modal-item">
          <span class="attendance-detail-label">Attendance Date</span>
          <span class="attendance-detail-value">{{ formatDate(attendanceDetail.attendanceDate) }}</span>
        </div>
        <div class="attendance-detail-modal-item">
          <span class="attendance-detail-label">Check In</span>
          <span class="attendance-detail-value">{{ formatTime(attendanceDetail.checkInTime) }}</span>
        </div>
        <div class="attendance-detail-modal-item">
          <span class="attendance-detail-label">Check Out</span>
          <span class="attendance-detail-value">{{ formatTime(attendanceDetail.checkOutTime) }}</span>
        </div>
        <div class="attendance-detail-modal-item">
          <span class="attendance-detail-label">Status</span>
          <AttendanceStatusBadge :status="attendanceDetail.status" />
        </div>
        <div class="attendance-detail-modal-item">
          <span class="attendance-detail-label">Correction Status</span>
          <AttendanceStatusBadge :status="attendanceDetail.correctionStatus" />
        </div>
        <div class="attendance-detail-modal-item">
          <span class="attendance-detail-label">Source</span>
          <span class="attendance-detail-value">{{ attendanceDetail.source ?? '--' }}</span>
        </div>
        <div class="attendance-detail-modal-item attendance-detail-modal-item-full">
          <span class="attendance-detail-label">Notes</span>
          <span class="attendance-detail-value">{{ attendanceDetail.notes ?? '--' }}</span>
        </div>
        <div class="attendance-detail-modal-item attendance-detail-modal-item-full">
          <span class="attendance-detail-label">Correction Reason</span>
          <span class="attendance-detail-value">
            {{ attendanceDetail.correctionReason ?? '--' }}
          </span>
        </div>
      </div>
    </BaseModal>

    <BaseModal
      :open="isModifyModalOpen"
      title="Modify Attendance"
      @close="closeModifyModal"
    >
      <div class="attendance-modify-form">
        <BaseInput
          v-model="modifyForm.checkInTime"
          label="Check In Time"
          placeholder="HH:mm"
          type="time"
        />
        <BaseInput
          v-model="modifyForm.checkOutTime"
          label="Check Out Time"
          placeholder="HH:mm"
          type="time"
        />
        <BaseTextarea
          v-model="modifyForm.correctionReason"
          label="Correction Reason"
          placeholder="Explain why the record is being modified."
          :rows="3"
        />
        <BaseTextarea
          v-model="modifyForm.notes"
          label="Notes"
          placeholder="Optional notes for this attendance update."
          :rows="3"
        />
      </div>

      <template #footer>
        <BaseButton variant="ghost" @click="closeModifyModal">Cancel</BaseButton>
        <BaseButton
          :disabled="!modifyForm.correctionReason.trim()"
          :loading="isSubmittingModification"
          @click="submitAttendanceModification"
        >
          Save Changes
        </BaseButton>
      </template>
    </BaseModal>
  </main>
</template>

<style scoped>
.attendance-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.attendance-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.attendance-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.attendance-header-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.attendance-header-buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
}

.attendance-title,
.attendance-section-title,
.attendance-context-title,
.attendance-identity-title,
.attendance-state-title {
  color: hsl(var(--foreground));
}

.attendance-subtitle,
.attendance-last-updated,
.attendance-section-text,
.attendance-state-text,
.attendance-detail-label,
.attendance-section-label {
  color: hsl(var(--muted-foreground));
}

.attendance-last-updated {
  font-size: var(--text-xs);
}

.attendance-export-error {
  color: hsl(var(--destructive));
  font-size: var(--text-xs);
}

.attendance-loading {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 1rem;
}

.attendance-skeleton-card {
  min-height: 10rem;
}

.attendance-skeleton-body {
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.25rem;
}

.attendance-skeleton-line {
  border-radius: 9999px;
  background: hsl(var(--secondary));
}

.attendance-skeleton-line.short {
  width: 40%;
  height: 0.75rem;
}

.attendance-skeleton-line.large {
  width: 65%;
  height: 2rem;
}

.attendance-state-card {
  min-height: 15rem;
}

.attendance-state-body {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  gap: 0.75rem;
  padding: 1.5rem;
}

.attendance-identity-body,
.attendance-context-body {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
}

.attendance-identity-meta,
.attendance-context-range,
.attendance-today-badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.75rem;
}

.attendance-meta-item,
.attendance-detail-inline {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: hsl(var(--foreground));
}

.attendance-meta-separator {
  color: hsl(var(--muted-foreground));
}

.attendance-today-card {
  overflow: hidden;
}

.attendance-today-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.25rem 0;
}

.attendance-today-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1rem;
  padding: 1.25rem;
}

.attendance-detail-card {
  display: flex;
  min-height: 6rem;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 1rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--secondary) / 0.5);
}

.attendance-detail-value {
  font-size: clamp(1.1rem, 2vw, 1.35rem);
  font-weight: 700;
  color: hsl(var(--foreground));
}

.attendance-summary-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.attendance-tabs {
  width: 100%;
}

.attendance-tabs:deep(.el-tabs__header) {
  margin-bottom: 1rem;
}

.attendance-tabs:deep(.el-tabs__nav-wrap::after) {
  background: hsl(var(--border-gray));
}

.attendance-tabs:deep(.el-tabs__item) {
  color: hsl(var(--muted-foreground));
  font-weight: 600;
}

.attendance-tab-label {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.attendance-tab-panel {
  padding: 1rem 0.25rem 0.25rem;
}

.attendance-tabs:deep(.el-tabs__item.is-active) {
  color: hsl(var(--foreground));
}

.attendance-tabs:deep(.el-tabs__active-bar) {
  background: hsl(var(--primary));
}

.attendance-filters-card {
  overflow: hidden;
}

.attendance-management-card {
  overflow: hidden;
}

.attendance-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1rem;
  padding: 1.25rem;
}

.attendance-filters-actions {
  display: flex;
  justify-content: flex-end;
  padding: 0 1.25rem 1.25rem;
}

.attendance-management-content {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0 1.25rem 1.25rem;
}

.attendance-detail-modal-state {
  display: flex;
  justify-content: center;
  padding: 1rem 0;
}

.attendance-detail-modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.attendance-detail-modal-item {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.attendance-detail-modal-item-full {
  grid-column: 1 / -1;
}

.attendance-modify-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 768px) {
  .attendance-header,
  .attendance-identity-body,
  .attendance-context-body,
  .attendance-today-header {
    flex-direction: column;
  }

  .attendance-header-actions {
    width: 100%;
    justify-content: space-between;
    flex-wrap: wrap;
  }

  .attendance-header-meta {
    align-items: flex-start;
  }

  .attendance-header-buttons {
    width: 100%;
    justify-content: flex-start;
  }

  .attendance-filters-actions {
    justify-content: flex-start;
  }

  .attendance-detail-modal-grid {
    grid-template-columns: 1fr;
  }
}
</style>
