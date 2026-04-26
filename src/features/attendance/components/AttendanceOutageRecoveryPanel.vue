<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseTable, { type BaseTableColumn } from '@/components/ui/BaseTable.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import { formatDateTime12h } from '@/utils/time'

import type {
  AttendanceOutageRecoveryEmployee,
  AttendanceOutageRecoveryPreviewData,
} from '../interface/attendance.interface'

const props = defineProps<{
  preview: AttendanceOutageRecoveryPreviewData | null
  previewDate: string
  search: string
  departmentId?: string | number | null
  perPage: number
  recoveryMode: string
  recoveryCheckInAt: Date | null
  recoveryCheckOutAt: Date | null
  departmentOptions: BaseDropdownOption[]
  selectedEmployeeIds: number[]
  notes: string
  loading?: boolean
  applying?: boolean
  error?: string
}>()

const emit = defineEmits<{
  'update:previewDate': [value: string]
  'update:search': [value: string]
  'update:departmentId': [value: string | number | null]
  'update:perPage': [value: number]
  'update:recoveryMode': [value: string]
  'update:recoveryCheckInAt': [value: Date | null]
  'update:recoveryCheckOutAt': [value: Date | null]
  'update:selectedEmployeeIds': [value: number[]]
  'update:notes': [value: string]
  preview: []
  apply: []
  resetFilters: []
  pageChange: [page: number]
}>()

const selectedColumns: BaseTableColumn[] = [
  { key: 'selected', label: 'Select', align: 'center' },
  { key: 'employeeCode', label: 'Employee Code' },
  { key: 'name', label: 'Name' },
  { key: 'department', label: 'Department' },
  { key: 'currentPosition', label: 'Position' },
]

const skippedColumns: BaseTableColumn[] = [
  { key: 'employeeCode', label: 'Employee Code' },
  { key: 'name', label: 'Name' },
  { key: 'department', label: 'Department' },
  { key: 'currentPosition', label: 'Position' },
  { key: 'details', label: 'Details' },
]

const perPageOptions: BaseDropdownOption[] = [
  { label: '10 per page', value: 10 },
  { label: '15 per page', value: 15 },
  { label: '25 per page', value: 25 },
  { label: '50 per page', value: 50 },
]

const recoveryModeOptions: BaseDropdownOption[] = [
  { label: 'Full Day Recovery', value: 'full_day' },
  { label: 'Morning Check In', value: 'morning' },
  { label: 'Evening Check Out', value: 'evening' },
]

const selectedEmployeesPage = computed(() => props.preview?.selectedEmployees ?? null)
const selectedEmployees = computed(() => selectedEmployeesPage.value?.data ?? [])
const currentPageEmployeeIds = computed(() => selectedEmployees.value.map((employee) => employee.id))
const allSelected = computed(() =>
  currentPageEmployeeIds.value.length > 0 &&
  currentPageEmployeeIds.value.every((employeeId) => props.selectedEmployeeIds.includes(employeeId)),
)

const selectedRows = computed(() =>
  selectedEmployees.value.map((employee) => ({
    selected: employee.id,
    employeeCode: employee.employeeCode ?? '--',
    name: employee.name,
    department: employee.department ?? '--',
    currentPosition: employee.currentPosition ?? '--',
    _rowClass: props.selectedEmployeeIds.includes(employee.id) ? 'outage-row-selected' : '',
    raw: employee,
  })),
)

const onLeaveRows = computed(() =>
  (props.preview?.skipped.onLeave ?? []).map((employee) => mapSkippedRow(employee)),
)

const existingAttendanceRows = computed(() =>
  (props.preview?.skipped.existingAttendance ?? []).map((employee) =>
    mapSkippedRow(
      employee,
      employee.existingAttendance
        ? `${humanize(employee.existingAttendance.status)} • ${humanize(employee.existingAttendance.source ?? '--')}`
        : humanize(employee.skipReason ?? '--'),
    ),
  ),
)

const paginationPages = computed(() =>
  (selectedEmployeesPage.value?.links ?? []).filter(
    (link): link is NonNullable<typeof selectedEmployeesPage.value>['links'][number] => link.page !== null,
  ),
)

const canGoPrevious = computed(() => Boolean(selectedEmployeesPage.value?.prev_page_url))
const canGoNext = computed(() => Boolean(selectedEmployeesPage.value?.next_page_url))
const hasPreview = computed(() => Boolean(props.preview))
const hasSelectedEmployees = computed(() => props.selectedEmployeeIds.length > 0)
const showMorningTime = computed(() => props.recoveryMode === 'morning')
const showEveningTime = computed(() => props.recoveryMode === 'evening')
const canApply = computed(() => {
  if (!hasPreview.value || !hasSelectedEmployees.value || props.applying) {
    return false
  }

  if (showMorningTime.value) {
    return props.recoveryCheckInAt instanceof Date
  }

  if (showEveningTime.value) {
    return props.recoveryCheckOutAt instanceof Date
  }

  return true
})

const toggleEmployee = (employeeId: number, checked: boolean) => {
  const nextIds = checked
    ? Array.from(new Set([...props.selectedEmployeeIds, employeeId]))
    : props.selectedEmployeeIds.filter((id) => id !== employeeId)

  emit('update:selectedEmployeeIds', nextIds)
}

const selectCurrentPage = () => {
  emit(
    'update:selectedEmployeeIds',
    Array.from(new Set([...props.selectedEmployeeIds, ...currentPageEmployeeIds.value])),
  )
}

const clearCurrentPageSelection = () => {
  emit(
    'update:selectedEmployeeIds',
    props.selectedEmployeeIds.filter((id) => !currentPageEmployeeIds.value.includes(id)),
  )
}

const changePage = (page: number | null | undefined) => {
  if (!page || page === selectedEmployeesPage.value?.current_page) {
    return
  }

  emit('pageChange', page)
}

function mapSkippedRow(employee: AttendanceOutageRecoveryEmployee, details?: string) {
  return {
    employeeCode: employee.employeeCode ?? '--',
    name: employee.name,
    department: employee.department ?? '--',
    currentPosition: employee.currentPosition ?? '--',
    details: details ?? humanize(employee.skipReason ?? '--'),
  }
}

function formatDateTime(value: string | null | undefined) {
  return formatDateTime12h(value)
}

function humanize(value: string) {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function disableFutureDate(date: Date) {
  const today = new Date()
  today.setHours(23, 59, 59, 999)

  return date.getTime() > today.getTime()
}
</script>

<template>
  <div class="overflow-hidden rounded-2xl border border-[hsl(var(--border-gray))] bg-[hsl(var(--secondary)/0.08)]">
    <div class="flex flex-col gap-5 p-5">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <h3 class="text-lg font-semibold text-[hsl(var(--foreground))]">Outage Recovery</h3>
          <p class="text-sm text-[hsl(var(--muted-foreground))]">
            Review eligible employees, choose the recovery type, and create attendance for the confirmed list.
          </p>
        </div>

        <div class="rounded-full border border-[hsl(var(--border-gray))] bg-[hsl(var(--card))] px-3 py-1 text-xs font-semibold text-[hsl(var(--muted-foreground))] shadow-sm">
          HR Recovery Tool
        </div>
      </div>

      <section class="rounded-2xl border border-[hsl(var(--border-gray))] bg-[hsl(var(--card))] p-4 shadow-sm">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div class="space-y-1">
            <h4 class="text-sm font-semibold text-[hsl(var(--foreground))]">Recovery Setup</h4>
            <p class="text-sm text-[hsl(var(--muted-foreground))]">
              Narrow the employee list first, then preview the people who can be recovered.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <BaseButton variant="ghost" @click="emit('resetFilters')">Reset</BaseButton>
            <BaseButton :loading="loading" variant="secondary" @click="emit('preview')">
              Preview Employees
            </BaseButton>
          </div>
        </div>

        <div class="grid grid-cols-4 gap-4">
          <BaseDatePicker
            :model-value="previewDate"
            :disabled-date="disableFutureDate"
            label="Recovery Date"
            value-format="YYYY-MM-DD"
            @update:model-value="emit('update:previewDate', String($event ?? ''))"
          />
          <BaseInput
            :model-value="search"
            label="Search"
            placeholder="Search by employee name or code"
            size="large"
            @update:model-value="emit('update:search', $event)"
          />
          <BaseDropdown
            :model-value="departmentId ?? null"
            :options="departmentOptions"
            clearable
            label="Department"
            placeholder="All departments"
            @update:model-value="emit('update:departmentId', $event as string | number | null)"
          />
          <BaseDropdown
            :model-value="perPage"
            :options="perPageOptions"
            :clearable="false"
            label="Rows Per Page"
            @update:model-value="emit('update:perPage', Number($event ?? 10))"
          />
        </div>

        <div class="mt-4 grid grid-cols-3 gap-4">
          <BaseDropdown
            :model-value="recoveryMode"
            :options="recoveryModeOptions"
            :clearable="false"
            label="Recovery Type"
            @update:model-value="emit('update:recoveryMode', String($event ?? 'full_day'))"
          />
          <BaseDatePicker
            v-if="showMorningTime"
            :disabled-date="disableFutureDate"
            :model-value="recoveryCheckInAt"
            format="MMM D, YYYY h:mm A"
            label="Check In Time"
            type="datetime"
            @update:model-value="emit('update:recoveryCheckInAt', ($event as Date | null) ?? null)"
          />
          <BaseDatePicker
            v-if="showEveningTime"
            :disabled-date="disableFutureDate"
            :model-value="recoveryCheckOutAt"
            format="MMM D, YYYY h:mm A"
            label="Check Out Time"
            type="datetime"
            @update:model-value="emit('update:recoveryCheckOutAt', ($event as Date | null) ?? null)"
          />
          <div
            class="rounded-xl border border-dashed border-[hsl(var(--border-gray))] bg-[hsl(var(--secondary)/0.1)] p-4 text-sm text-[hsl(var(--muted-foreground))]"
            :class="showMorningTime || showEveningTime ? 'col-span-1' : 'col-span-2'"
          >
            <p class="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              Recovery Guidance
            </p>
            <p class="mt-2 leading-6">
              <span v-if="recoveryMode === 'full_day'">
                Creates a full-day recovery record using the normal work start and end time.
              </span>
              <span v-else-if="recoveryMode === 'morning'">
                Creates an open attendance record so the employee can check out later.
              </span>
              <span v-else>
                Creates attendance using the normal check-in time and your selected check-out time.
              </span>
            </p>
          </div>
        </div>
      </section>

      <div
        v-if="error"
        class="rounded-xl border border-[hsl(var(--destructive)/0.25)] bg-[hsl(var(--destructive)/0.08)] px-4 py-3 text-sm text-[hsl(var(--destructive))]"
      >
        {{ error }}
      </div>

      <div v-if="loading" class="flex min-h-[16rem] items-center justify-center rounded-2xl border border-[hsl(var(--border-gray))] bg-[hsl(var(--secondary)/0.12)]">
        <BaseSpinner />
      </div>

      <template v-else-if="preview">
        <section class="grid grid-cols-3 gap-4">
          <div class="rounded-2xl border border-[hsl(var(--border-gray))] bg-[hsl(var(--card))] p-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              Default Check In
            </p>
            <p class="mt-2 text-base font-semibold text-[hsl(var(--foreground))]">
              {{ formatDateTime(preview.defaults.checkInAt) }}
            </p>
          </div>
          <div class="rounded-2xl border border-[hsl(var(--border-gray))] bg-[hsl(var(--card))] p-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              Default Check Out
            </p>
            <p class="mt-2 text-base font-semibold text-[hsl(var(--foreground))]">
              {{ formatDateTime(preview.defaults.checkOutAt) }}
            </p>
          </div>
          <div class="rounded-2xl border border-[hsl(var(--border-gray))] bg-[hsl(var(--card))] p-4 shadow-sm">
            <p class="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              Preview Date
            </p>
            <p class="mt-2 text-base font-semibold text-[hsl(var(--foreground))]">
              {{ preview.date }}
            </p>
          </div>
        </section>

        <section class="rounded-2xl border border-[hsl(var(--border-gray))] bg-[hsl(var(--card))] p-4">
          <div class="mb-3 space-y-1">
            <h4 class="text-sm font-semibold text-[hsl(var(--foreground))]">Recovery Notes</h4>
            <p class="text-sm text-[hsl(var(--muted-foreground))]">
              Add a short note so the reason for this recovery is clear later.
            </p>
          </div>

          <BaseTextarea
            :model-value="notes"
            label="Notes"
            placeholder="System outage recovery"
            :rows="3"
            @update:model-value="emit('update:notes', $event)"
          />
        </section>

        <section class="rounded-2xl border border-[hsl(var(--primary)/0.16)] bg-[hsl(var(--card))] p-4 shadow-md">
          <div class="mb-4 flex items-start justify-between gap-4 border-b border-[hsl(var(--border-gray))] pb-4">
            <div class="space-y-1">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-semibold text-[hsl(var(--foreground))]">Selected Employees</h4>
                <span class="rounded-full border border-[hsl(var(--primary)/0.12)] bg-[hsl(var(--primary)/0.08)] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--foreground))]">
                  {{ selectedEmployeesPage?.total ?? 0 }} total
                </span>
              </div>
              <p class="text-sm text-[hsl(var(--muted-foreground))]">
                Active employees who are not on leave and do not already have attendance on the selected date.
              </p>
            </div>

            <div class="flex items-center gap-2">
              <BaseButton variant="ghost" @click="clearCurrentPageSelection">Clear Page</BaseButton>
              <BaseButton variant="secondary" @click="selectCurrentPage">
                {{ allSelected ? 'Page Selected' : 'Select Page' }}
              </BaseButton>
            </div>
          </div>

          <div
            v-if="selectedRows.length"
            class="outage-recovery-table-shell outage-recovery-table-shell-primary max-h-[24rem] overflow-auto rounded-xl border border-[hsl(var(--primary)/0.16)]"
          >
            <BaseTable
              :columns="selectedColumns"
              :rows="selectedRows"
              empty-text="No employees are available for outage recovery on this date."
            >
              <template #cell-selected="{ value }">
                <input
                  :checked="selectedEmployeeIds.includes(Number(value))"
                  class="outage-recovery-checkbox"
                  type="checkbox"
                  @change="toggleEmployee(Number(value), ($event.target as HTMLInputElement).checked)"
                />
              </template>
            </BaseTable>
          </div>
          <div
            v-else
            class="flex min-h-[12rem] flex-col items-center justify-center rounded-xl border border-dashed border-[hsl(var(--border-gray))] bg-[hsl(var(--secondary)/0.08)] px-6 text-center"
          >
            <p class="text-sm font-semibold text-[hsl(var(--foreground))]">No employees available for recovery</p>
            <p class="mt-1 max-w-xl text-sm text-[hsl(var(--muted-foreground))]">
              Try another date or adjust your filters to find employees who can be recovered.
            </p>
          </div>

          <div class="mt-4 flex items-center justify-between gap-4 rounded-xl border border-[hsl(var(--primary)/0.12)] bg-[hsl(var(--secondary)/0.1)] px-4 py-3">
            <p class="text-sm text-[hsl(var(--muted-foreground))]">
              {{ selectedEmployeeIds.length }} employee{{ selectedEmployeeIds.length === 1 ? '' : 's' }}
              selected for recovery.
            </p>

            <div v-if="(selectedEmployeesPage?.last_page ?? 1) > 1" class="flex items-center gap-2">
              <BaseButton
                :disabled="!canGoPrevious"
                variant="ghost"
                @click="changePage((selectedEmployeesPage?.current_page ?? 1) - 1)"
              >
                Previous
              </BaseButton>

              <BaseButton
                v-for="link in paginationPages"
                :key="link.page ?? link.label"
                :variant="link.active ? 'secondary' : 'ghost'"
                @click="changePage(link.page)"
              >
                {{ link.page }}
              </BaseButton>

              <BaseButton
                :disabled="!canGoNext"
                variant="ghost"
                @click="changePage((selectedEmployeesPage?.current_page ?? 1) + 1)"
              >
                Next
              </BaseButton>
            </div>
          </div>
        </section>

        <div class="grid grid-cols-2 gap-4">
          <section
            v-if="onLeaveRows.length"
            class="rounded-2xl border border-[hsl(var(--border-gray))] bg-[hsl(var(--card))] p-4 shadow-sm"
          >
            <div class="mb-3 space-y-1">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-semibold text-[hsl(var(--foreground))]">Skipped: On Leave</h4>
                <span class="rounded-full bg-[hsl(var(--secondary)/0.7)] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--secondary-foreground))]">
                  {{ preview.skipped.counts.onLeave }}
                </span>
              </div>
              <p class="text-sm text-[hsl(var(--muted-foreground))]">
                These employees already have approved leave for the selected date.
              </p>
            </div>

            <div class="outage-recovery-table-shell max-h-[20rem] overflow-auto rounded-xl border border-[hsl(var(--border-gray))]">
              <BaseTable
                :columns="skippedColumns"
                :rows="onLeaveRows"
                empty-text="No employees were skipped for leave."
              />
            </div>
          </section>

          <section
            v-if="existingAttendanceRows.length"
            class="rounded-2xl border border-[hsl(var(--border-gray))] bg-[hsl(var(--card))] p-4 shadow-sm"
          >
            <div class="mb-3 space-y-1">
              <div class="flex items-center gap-2">
                <h4 class="text-sm font-semibold text-[hsl(var(--foreground))]">Skipped: Existing Attendance</h4>
                <span class="rounded-full bg-[hsl(var(--secondary)/0.7)] px-2.5 py-1 text-xs font-semibold text-[hsl(var(--secondary-foreground))]">
                  {{ preview.skipped.counts.existingAttendance }}
                </span>
              </div>
              <p class="text-sm text-[hsl(var(--muted-foreground))]">
                These employees already have attendance for the selected date.
              </p>
            </div>

            <div class="outage-recovery-table-shell max-h-[20rem] overflow-auto rounded-xl border border-[hsl(var(--border-gray))]">
              <BaseTable
                :columns="skippedColumns"
                :rows="existingAttendanceRows"
                empty-text="No employees were skipped for existing attendance."
              />
            </div>
          </section>
        </div>

        <section class="rounded-2xl border border-[hsl(var(--border-gray))] bg-[hsl(var(--card))] p-4 shadow-sm">
          <div class="flex items-center justify-between gap-4">
            <div class="space-y-1">
              <p class="text-sm font-semibold text-[hsl(var(--foreground))]">Ready to apply recovery</p>
              <p class="text-sm text-[hsl(var(--muted-foreground))]">
                Confirm the employee selection and recovery type, then create the attendance records.
              </p>
            </div>

            <BaseButton :disabled="!canApply" :loading="applying" class="min-w-[11rem]" @click="emit('apply')">
              Apply Recovery
            </BaseButton>
          </div>
        </section>
      </template>

      <div
        v-else
        class="flex min-h-[14rem] flex-col items-center justify-center rounded-2xl border border-dashed border-[hsl(var(--border-gray))] bg-[hsl(var(--secondary)/0.12)] px-6 text-center"
      >
        <p class="text-sm font-semibold text-[hsl(var(--foreground))]">Preview employees to start recovery</p>
        <p class="mt-2 max-w-2xl text-sm text-[hsl(var(--muted-foreground))]">
          Choose a date and optional filters, then preview the employees who can be included in the outage recovery run.
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.outage-recovery-checkbox {
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.outage-recovery-table-shell :deep(.base-table-shell) {
  overflow: visible;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

.outage-recovery-table-shell :deep(.base-table th) {
  position: sticky;
  top: 0;
  z-index: 1;
  background: hsl(var(--secondary));
  color: hsl(var(--foreground));
  border-bottom-color: hsl(var(--border-gray));
}

.outage-recovery-table-shell :deep(.base-table td) {
  color: hsl(var(--foreground) / 0.9);
  border-bottom-color: hsl(var(--border-gray));
}

.outage-recovery-table-shell :deep(.base-table tbody tr:nth-child(even)) {
  background: hsl(var(--secondary) / 0.12);
}

.outage-recovery-table-shell :deep(.base-table tbody tr:hover) {
  background: hsl(var(--secondary) / 0.22);
}

.outage-recovery-table-shell-primary :deep(.base-table th) {
  background: hsl(var(--secondary) / 0.9);
}

.outage-recovery-table-shell-primary :deep(.base-table tbody tr.outage-row-selected) {
  background: hsl(var(--primary) / 0.08);
}

.outage-recovery-table-shell-primary :deep(.base-table tbody tr.outage-row-selected:hover) {
  background: hsl(var(--primary) / 0.12);
}

.outage-recovery-table-shell-primary :deep(.base-table tbody tr.outage-row-selected td:first-child) {
  box-shadow: inset 3px 0 0 hsl(var(--primary));
}
</style>
