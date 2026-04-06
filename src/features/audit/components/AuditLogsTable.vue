<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseTable, { type BaseTableColumn } from '@/components/ui/BaseTable.vue'

import type { AuditLog, AuditLogListResponse } from '../interface/audit.interface'
import AuditLogEventBadge from './AuditLogEventBadge.vue'

const props = defineProps<{
  logs: AuditLogListResponse | null
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  retry: []
  viewDetails: [log: AuditLog]
  pageChange: [page: number]
}>()

const columns: BaseTableColumn[] = [
  { key: 'createdAt', label: 'Date / Time' },
  { key: 'logName', label: 'Log Name' },
  { key: 'event', label: 'Event' },
  { key: 'description', label: 'Description' },
  { key: 'user', label: 'User' },
  { key: 'subject', label: 'Subject' },
  { key: 'subjectType', label: 'Subject Type' },
  { key: 'actions', label: 'Actions', align: 'right' },
]

const rows = computed(() =>
  (props.logs?.data ?? []).map((log) => ({
    id: log.id,
    createdAt: formatDateTime(log.createdAt),
    logName: log.logName || '--',
    event: log.event || '--',
    description: log.description || '--',
    user: log.causer?.name ?? log.causer?.email ?? '--',
    subject: log.subject?.label ?? '--',
    subjectType: formatTypeLabel(log.subject?.type),
    actions: log.id,
    raw: log,
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

function formatTypeLabel(value: string | null | undefined) {
  if (!value) return '--'

  const segments = value.split('\\')

  return segments[segments.length - 1] || value
}
</script>

<template>
  <section class="audit-table-section">
    <div class="audit-table-header">
      <div>
        <h2 class="audit-table-title">Activity History</h2>
        <p class="audit-table-text">
          Follow each audit entry, open full details, and move through the result pages.
        </p>
      </div>

      <BaseButton :loading="loading" variant="ghost" @click="emit('retry')">
        Refresh
      </BaseButton>
    </div>

    <div v-if="loading" class="audit-table-state">
      <BaseSpinner />
      <p class="audit-table-text">Loading audit logs...</p>
    </div>

    <div v-else-if="error" class="audit-table-state audit-table-state-error">
      <p class="audit-table-text">{{ error }}</p>
      <BaseButton variant="secondary" @click="emit('retry')">Try Again</BaseButton>
    </div>

    <template v-else>
      <BaseTable
        :columns="columns"
        :rows="rows"
        empty-text="No audit logs matched the current filters."
      >
        <template #cell-createdAt="{ row }">
          <button
            class="audit-row-link"
            type="button"
            @click="emit('viewDetails', row.raw as AuditLog)"
          >
            {{ row.createdAt }}
          </button>
        </template>

        <template #cell-event="{ value }">
          <AuditLogEventBadge :event="String(value)" />
        </template>

        <template #cell-description="{ value }">
          <span class="audit-truncated-cell" :title="String(value)">
            {{ value }}
          </span>
        </template>

        <template #cell-user="{ value }">
          <span class="audit-truncated-cell" :title="String(value)">
            {{ value }}
          </span>
        </template>

        <template #cell-subject="{ value }">
          <span class="audit-truncated-cell" :title="String(value)">
            {{ value }}
          </span>
        </template>

        <template #cell-subjectType="{ value }">
          <span class="audit-truncated-cell" :title="String(value)">
            {{ value }}
          </span>
        </template>

        <template #cell-actions="{ row }">
          <BaseButton variant="ghost" @click="emit('viewDetails', row.raw as AuditLog)">
            View Details
          </BaseButton>
        </template>
      </BaseTable>

      <div v-if="(logs?.last_page ?? 1) > 1" class="audit-pagination">
        <p class="audit-table-text">
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
.audit-table-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.audit-table-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.audit-table-title {
  color: hsl(var(--foreground));
}

.audit-table-text {
  color: hsl(var(--muted-foreground));
}

.audit-table-state {
  display: flex;
  min-height: 16rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
}

.audit-table-state-error {
  gap: 1rem;
}

.audit-row-link {
  border: 0;
  background: transparent;
  color: hsl(var(--primary));
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  padding: 0;
}

.audit-row-link:hover {
  text-decoration: underline;
}

.audit-truncated-cell {
  display: inline-block;
  max-width: 16rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: bottom;
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
  .audit-table-header,
  .audit-pagination {
    flex-direction: column;
    align-items: stretch;
  }

  .audit-pagination-actions {
    justify-content: flex-start;
  }

  .audit-truncated-cell {
    max-width: 11rem;
  }
}
</style>
