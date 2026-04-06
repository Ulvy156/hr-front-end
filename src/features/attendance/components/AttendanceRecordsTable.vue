<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTable, { type BaseTableColumn } from '@/components/ui/BaseTable.vue'
import { formatTime12h } from '@/utils/time'

import type { AttendanceListResponse, AttendanceRecord } from '../interface/attendance.interface'
import AttendanceStatusBadge from './AttendanceStatusBadge.vue'

const props = defineProps<{
  records: AttendanceListResponse | null
  canModify?: boolean
  showEmployeeColumns?: boolean
  showPagination?: boolean
  title?: string
  description?: string
}>()

const emit = defineEmits<{
  rowClick: [record: AttendanceRecord]
  modifyClick: [record: AttendanceRecord]
  pageChange: [page: number]
}>()

const columns = computed<BaseTableColumn[]>(() => {
  const baseColumns: BaseTableColumn[] = [
    { key: 'attendanceDate', label: 'Date' },
    { key: 'checkInTime', label: 'Check In' },
    { key: 'checkOutTime', label: 'Check Out' },
    { key: 'workedMinutes', label: 'Worked' },
    { key: 'lateMinutes', label: 'Late' },
    { key: 'earlyLeaveMinutes', label: 'Early Leave' },
    { key: 'overtimeMinutes', label: 'Overtime' },
    { key: 'status', label: 'Status' },
    { key: 'correctionStatus', label: 'Correction' },
  ]

  if (props.showEmployeeColumns ?? true) {
    baseColumns.splice(1, 0, { key: 'employeeName', label: 'Employee' })
    baseColumns.splice(2, 0, { key: 'department', label: 'Department' })
  }

  if (props.canModify) {
    baseColumns.push({ key: 'actions', label: 'Actions', align: 'right' })
  }

  return baseColumns
})

const rows = computed(() =>
  (props.records?.data ?? []).map((record) => ({
    id: record.id,
    attendanceDate: record.attendanceDate ?? '--',
    employeeName: record.employee?.name ?? '--',
    department: record.employee?.department ?? '--',
    checkInTime: record.checkInTime ?? '--',
    checkOutTime: record.checkOutTime ?? '--',
    workedMinutes: record.workedMinutes ?? 0,
    lateMinutes: record.lateMinutes ?? 0,
    earlyLeaveMinutes: record.earlyLeaveMinutes ?? 0,
    overtimeMinutes: record.overtimeMinutes ?? 0,
    status: record.status ?? 'none',
    correctionStatus: record.correctionStatus ?? 'none',
    actions: record.id,
    raw: record,
  })),
)

const paginationPages = computed(() =>
  (props.records?.links ?? []).filter(
    (link): link is NonNullable<typeof props.records>['links'][number] =>
      link.page !== null,
  ),
)

const canGoPrevious = computed(() => Boolean(props.records?.prev_page_url))
const canGoNext = computed(() => Boolean(props.records?.next_page_url))

const changePage = (page: number | null | undefined) => {
  if (!page || page === props.records?.current_page) {
    return
  }

  emit('pageChange', page)
}

const formatMinutes = (value: unknown) => {
  const minutes = Number(value ?? 0)

  if (!Number.isFinite(minutes) || minutes < 0) {
    return '--'
  }

  if (minutes < 60) {
    return `${minutes}m`
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}m`
}

</script>

<template>
  <section class="records-section">
    <div class="records-section-header">
      <div>
        <h3 class="records-section-title">{{ title ?? 'Attendance Records' }}</h3>
        <p class="records-section-text">
          {{ description ?? 'View attendance records, open details, and move through each page of results.' }}
        </p>
      </div>

      <BaseButton variant="ghost" disabled>
        Page {{ records?.current_page ?? 1 }} / {{ records?.last_page ?? 1 }}
      </BaseButton>
    </div>

    <BaseTable
      :columns="columns"
      :rows="rows"
      empty-text="No attendance records matched the current filters."
    >
      <template #cell-attendanceDate="{ row }">
        <button
          class="record-link"
          type="button"
          @click="emit('rowClick', row.raw as AttendanceRecord)"
        >
          {{ row.attendanceDate }}
        </button>
      </template>

      <template #cell-checkInTime="{ value }">
        {{ formatTime12h(String(value ?? '--')) }}
      </template>

      <template #cell-checkOutTime="{ value }">
        {{ formatTime12h(String(value ?? '--')) }}
      </template>

      <template #cell-workedMinutes="{ value }">
        {{ formatMinutes(value) }}
      </template>

      <template #cell-lateMinutes="{ value }">
        {{ formatMinutes(value) }}
      </template>

      <template #cell-earlyLeaveMinutes="{ value }">
        {{ formatMinutes(value) }}
      </template>

      <template #cell-overtimeMinutes="{ value }">
        {{ formatMinutes(value) }}
      </template>

      <template #cell-status="{ value }">
        <AttendanceStatusBadge :status="String(value)" />
      </template>

      <template #cell-correctionStatus="{ value }">
        <AttendanceStatusBadge :status="String(value)" />
      </template>

      <template #cell-actions="{ row }">
        <BaseButton variant="ghost" @click="emit('modifyClick', row.raw as AttendanceRecord)">
          Modify
        </BaseButton>
      </template>
    </BaseTable>

    <div
      v-if="(showPagination ?? true) && (records?.last_page ?? 1) > 1"
      class="records-pagination"
    >
      <p class="records-pagination-text">
        Showing {{ records?.from ?? 0 }}-{{ records?.to ?? 0 }} of {{ records?.total ?? 0 }}
      </p>

      <div class="records-pagination-actions">
        <BaseButton
          :disabled="!canGoPrevious"
          variant="ghost"
          @click="changePage((records?.current_page ?? 1) - 1)"
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
          @click="changePage((records?.current_page ?? 1) + 1)"
        >
          Next
        </BaseButton>
      </div>
    </div>
  </section>
</template>

<style scoped>
.records-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.records-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.records-section-title {
  color: hsl(var(--foreground));
}

.records-section-text {
  margin-top: 0.25rem;
  color: hsl(var(--muted-foreground));
}

.records-section :deep(.base-table-shell) {
  box-shadow: none;
  border-color: hsl(var(--border-gray));
}

.records-section :deep(.base-table th),
.records-section :deep(.base-table td) {
  padding: 0.625rem 0.875rem;
}

.records-section :deep(.base-table th) {
  background: hsl(var(--secondary));
  color: hsl(var(--foreground));
  border-bottom-color: hsl(var(--border-gray));
}

.records-section :deep(.base-table td) {
  color: hsl(var(--foreground) / 0.9);
}

.records-section :deep(.base-table tbody tr:nth-child(even)) {
  background: hsl(var(--secondary) / 0.16);
}

.records-section :deep(.base-table tbody tr:hover) {
  background: hsl(var(--secondary) / 0.3);
}

.record-link {
  border: 0;
  background: transparent;
  color: hsl(var(--primary));
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  padding: 0;
}

.record-link:hover {
  text-decoration: underline;
}

.records-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.records-pagination-text {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-sm);
}

.records-pagination-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .records-section-header {
    flex-direction: column;
  }

  .records-pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .records-pagination-actions {
    justify-content: flex-start;
  }
}
</style>
