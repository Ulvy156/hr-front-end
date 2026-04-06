<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseTable, { type BaseTableColumn } from '@/components/ui/BaseTable.vue'
import { formatDateTime12h, formatTime12h } from '@/utils/time'

import type {
  CorrectionRequest,
  CorrectionRequestListResponse,
} from '../interface/attendance.interface'
import AttendanceStatusBadge from './AttendanceStatusBadge.vue'

const props = withDefaults(defineProps<{
  requests: CorrectionRequestListResponse | null
  embedded?: boolean
}>(), {
  embedded: false,
})

const emit = defineEmits<{
  pageChange: [page: number]
  reviewClick: [request: CorrectionRequest]
}>()

const columns = computed<BaseTableColumn[]>(() => [
  { key: 'attendanceDate', label: 'Attendance Date' },
  { key: 'employeeName', label: 'Employee' },
  { key: 'requestedCheckInTime', label: 'Requested Check In' },
  { key: 'requestedCheckOutTime', label: 'Requested Check Out' },
  { key: 'reason', label: 'Reason' },
  { key: 'status', label: 'Status' },
  { key: 'createdAt', label: 'Requested At' },
  { key: 'actions', label: 'Actions', align: 'right' },
])

const rows = computed(() =>
  (props.requests?.data ?? []).map((request) => ({
    attendanceDate: request.attendanceDate ?? request.attendance?.attendanceDate ?? '--',
    employeeName: request.employee?.name ?? request.attendance?.employee?.name ?? '--',
    requestedCheckInTime: formatDateTime(request.requestedCheckInTime, true),
    requestedCheckOutTime: formatDateTime(request.requestedCheckOutTime, true),
    reason: request.reason ?? '--',
    status: request.status ?? 'none',
    createdAt: formatDateTime(request.createdAt),
    actions: request.id,
    raw: request,
  })),
)

const paginationPages = computed(() =>
  (props.requests?.links ?? []).filter(
    (link): link is NonNullable<typeof props.requests>['links'][number] => link.page !== null,
  ),
)

const canGoPrevious = computed(() => Boolean(props.requests?.prev_page_url))
const canGoNext = computed(() => Boolean(props.requests?.next_page_url))

const changePage = (page: number | null | undefined) => {
  if (!page || page === props.requests?.current_page) {
    return
  }

  emit('pageChange', page)
}

function formatDateTime(value: string | null | undefined, timeOnly = false) {
  if (!value) return '--'

  if (timeOnly) {
    return formatTime12h(value)
  }

  return formatDateTime12h(value)
}
</script>

<template>
  <section :class="embedded ? 'correction-card correction-card-embedded' : 'correction-card'">
    <div class="correction-body">
      <div>
        <h3 class="correction-title">Correction Requests</h3>
        <p class="correction-text">
          Review pending correction and missing attendance requests from employees.
        </p>
      </div>

      <BaseTable
        :columns="columns"
        :rows="rows"
        empty-text="No pending correction requests were returned for the current filters."
      >
        <template #cell-status="{ value }">
          <AttendanceStatusBadge :status="String(value)" />
        </template>

        <template #cell-reason="{ value }">
          <span class="correction-reason" :title="String(value)">
            {{ value }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <BaseButton variant="ghost" @click="emit('reviewClick', row.raw as CorrectionRequest)">
            Review
          </BaseButton>
        </template>
      </BaseTable>

      <div v-if="(requests?.last_page ?? 1) > 1" class="correction-pagination">
        <p class="correction-text">
          Showing {{ requests?.from ?? 0 }}-{{ requests?.to ?? 0 }} of {{ requests?.total ?? 0 }}
        </p>

        <div class="correction-pagination-actions">
          <BaseButton
            :disabled="!canGoPrevious"
            variant="ghost"
            @click="changePage((requests?.current_page ?? 1) - 1)"
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
            @click="changePage((requests?.current_page ?? 1) + 1)"
          >
            Next
          </BaseButton>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.correction-card {
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
}

.correction-card-embedded {
  border: 0;
  border-radius: 0;
  background: transparent;
}

.correction-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1.25rem;
}

.correction-card-embedded .correction-body {
  padding: 0;
}

.correction-title {
  color: hsl(var(--foreground));
}

.correction-text,
.correction-empty {
  color: hsl(var(--muted-foreground));
}

.correction-reason {
  display: inline-block;
  max-width: 18rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
}

.correction-body :deep(.base-table-shell) {
  box-shadow: none;
  border-color: hsl(var(--border-gray));
}

.correction-body :deep(.base-table th),
.correction-body :deep(.base-table td) {
  padding: 0.625rem 0.875rem;
}

.correction-body :deep(.base-table th) {
  background: hsl(var(--secondary));
  color: hsl(var(--foreground));
  border-bottom-color: hsl(var(--border-gray));
}

.correction-body :deep(.base-table td) {
  color: hsl(var(--foreground) / 0.9);
}

.correction-body :deep(.base-table tbody tr:nth-child(even)) {
  background: hsl(var(--secondary) / 0.16);
}

.correction-body :deep(.base-table tbody tr:hover) {
  background: hsl(var(--secondary) / 0.3);
}

.correction-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.correction-pagination-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .correction-pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .correction-pagination-actions {
    justify-content: flex-start;
  }
}
</style>
