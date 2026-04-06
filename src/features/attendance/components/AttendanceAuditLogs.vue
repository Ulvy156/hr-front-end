<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseTable, { type BaseTableColumn } from '@/components/ui/BaseTable.vue'

import type {
  AttendanceAuditListResponse,
  AttendanceAuditLog,
} from '../interface/attendance.interface'
import AttendanceStatusBadge from './AttendanceStatusBadge.vue'

const props = defineProps<{
  logs: AttendanceAuditListResponse | null
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  retry: []
  rowClick: [record: AttendanceAuditLog]
  pageChange: [page: number]
}>()

const columns: BaseTableColumn[] = [
  { key: 'attendanceDate', label: 'Date' },
  { key: 'employeeName', label: 'Employee' },
  { key: 'department', label: 'Department' },
  { key: 'status', label: 'Status' },
  { key: 'source', label: 'Source' },
  { key: 'editedBy', label: 'Edited By' },
  { key: 'correctedBy', label: 'Corrected By' },
  { key: 'updatedAt', label: 'Updated At' },
]

const rows = computed(() =>
  (props.logs?.data ?? []).map((record) => ({
    id: record.id,
    attendanceDate: record.attendanceDate ?? '--',
    employeeName: record.employee?.name ?? '--',
    department: record.employee?.department ?? '--',
    status: record.status ?? 'none',
    source: record.source ?? '--',
    editedBy: record.audit?.editedBy?.name ?? '--',
    correctedBy: record.audit?.correctedBy?.name ?? '--',
    updatedAt: formatDateTime(record.updatedAt),
    raw: record,
  })),
)

const paginationPages = computed(() =>
  (props.logs?.links ?? []).filter(
    (link): link is NonNullable<typeof props.logs>['links'][number] => link.page !== null,
  ),
)

const canGoPrevious = computed(() => Boolean(props.logs?.prev_page_url))
const canGoNext = computed(() => Boolean(props.logs?.next_page_url))

const changePage = (page: number | null | undefined) => {
  if (!page || page === props.logs?.current_page) {
    return
  }

  emit('pageChange', page)
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '--'

  return new Date(value).toLocaleString()
}
</script>

<template>
  <section class="audit-section">
    <div class="audit-section-header">
      <div>
        <h3 class="audit-section-title">Audit Logs</h3>
        <p class="audit-section-text">
          Review attendance changes and see who updated each record.
        </p>
      </div>

      <BaseButton :loading="loading" variant="ghost" @click="emit('retry')">
        Refresh Logs
      </BaseButton>
    </div>

    <div v-if="loading" class="audit-state">
      <BaseSpinner />
      <p class="audit-state-text">Loading attendance updates...</p>
    </div>

    <div v-else-if="error" class="audit-state audit-state-error">
      <p class="audit-state-text">{{ error }}</p>
      <BaseButton variant="secondary" @click="emit('retry')">Try Again</BaseButton>
    </div>

    <template v-else>
      <BaseTable
        :columns="columns"
        :rows="rows"
        empty-text="No attendance audit logs were returned."
      >
        <template #cell-attendanceDate="{ row }">
          <button
            class="audit-link"
            type="button"
            @click="emit('rowClick', row.raw as AttendanceAuditLog)"
          >
            {{ row.attendanceDate }}
          </button>
        </template>

        <template #cell-status="{ value }">
          <AttendanceStatusBadge :status="String(value)" />
        </template>

        <template #cell-source="{ value }">
          <span class="audit-source">{{ value }}</span>
        </template>
      </BaseTable>

      <div v-if="(logs?.last_page ?? 1) > 1" class="audit-pagination">
        <p class="audit-pagination-text">
          Showing {{ logs?.from ?? 0 }}-{{ logs?.to ?? 0 }} of {{ logs?.total ?? 0 }}
        </p>

        <div class="audit-pagination-actions">
          <BaseButton
            :disabled="!canGoPrevious"
            variant="ghost"
            @click="changePage((logs?.current_page ?? 1) - 1)"
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
            @click="changePage((logs?.current_page ?? 1) + 1)"
          >
            Next
          </BaseButton>
        </div>
      </div>
    </template>
  </section>
</template>

<style scoped>
.audit-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.audit-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.audit-section-title {
  color: hsl(var(--foreground));
}

.audit-section-text,
.audit-state-text,
.audit-pagination-text {
  color: hsl(var(--muted-foreground));
}

.audit-state {
  display: flex;
  min-height: 14rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
}

.audit-state-error {
  gap: 1rem;
}

.audit-link {
  border: 0;
  background: transparent;
  color: hsl(var(--primary));
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  padding: 0;
}

.audit-link:hover {
  text-decoration: underline;
}

.audit-source {
  text-transform: capitalize;
}

.audit-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.audit-pagination-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .audit-section-header {
    flex-direction: column;
  }

  .audit-pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .audit-pagination-actions {
    justify-content: flex-start;
  }
}
</style>
