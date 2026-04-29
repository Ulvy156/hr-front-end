<script setup lang="ts">
import { computed } from 'vue'
import { Clock3 } from 'lucide-vue-next'

import ActionMenu, { type ActionMenuItem } from '@/components/ui/ActionMenu.vue'
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { formatDateTime12hCompact, formatShortDate, formatTime12h } from '@/utils/time'

import type { OvertimeRequest, OvertimeRequestListResponse } from '../interface/overtime.interface'
import {
  formatOvertimeApprovalStageLabel,
  formatOvertimeDuration,
  formatOvertimeTypeLabel,
  getOvertimeTypeVariant,
} from '../utils/overtime'
import OvertimeRequestStatusBadge from './OvertimeRequestStatusBadge.vue'

const props = withDefaults(
  defineProps<{
    title: string
    description: string
    requests: OvertimeRequestListResponse | null
    loading?: boolean
    emptyText?: string
    showEmployeeColumn?: boolean
    showDepartmentColumn?: boolean
    showApproverColumn?: boolean
    showManagerUpdateColumn?: boolean
    showSubmittedColumn?: boolean
    resolveActions?: (request: OvertimeRequest) => ActionMenuItem[]
  }>(),
  {
    loading: false,
    emptyText: 'No overtime requests matched the current filters.',
    showEmployeeColumn: false,
    showDepartmentColumn: false,
    showApproverColumn: false,
    showManagerUpdateColumn: false,
    showSubmittedColumn: true,
    resolveActions: undefined,
  },
)

const emit = defineEmits<{
  action: [payload: { request: OvertimeRequest; actionKey: string }]
  pageChange: [page: number]
  perPageChange: [perPage: number]
}>()

const handleActionSelect = (request: OvertimeRequest, actionKey: string) => {
  emit('action', {
    request,
    actionKey,
  })
}

const getActionItems = (request: OvertimeRequest) => {
  return props.resolveActions?.(request) ?? []
}

const hasActionItems = (request: OvertimeRequest) => {
  return getActionItems(request).length > 0
}

const tableMinWidth = computed(() => {
  let minWidth = 980

  if (props.showEmployeeColumn) {
    minWidth += 180
  }

  if (props.showDepartmentColumn) {
    minWidth += 140
  }

  if (props.showApproverColumn) {
    minWidth += 180
  }

  if (props.showManagerUpdateColumn) {
    minWidth += 180
  }

  if (props.showSubmittedColumn) {
    minWidth += 140
  }

  return `${minWidth}px`
})

const getEmployeeMetaText = (request: OvertimeRequest) => {
  return request.employee_id ? `Employee ID ${request.employee_id}` : '--'
}

const getDepartmentText = (request: OvertimeRequest) => {
  return request.employee?.department?.trim() || '--'
}

const getApproverText = (request: OvertimeRequest) => {
  if (request.manager_approved_by?.name) {
    return request.manager_approved_by.name
  }

  if (request.rejected_by?.name) {
    return request.rejected_by.name
  }

  if (request.status === 'pending' && request.approval_stage) {
    return 'Pending review'
  }

  return '--'
}

const getApproverMeta = (request: OvertimeRequest) => {
  if (request.rejected_at) {
    return formatDateTime12hCompact(request.rejected_at)
  }

  if (request.manager_approved_at) {
    return formatDateTime12hCompact(request.manager_approved_at)
  }

  if (request.status === 'pending' && request.approval_stage) {
    return formatOvertimeApprovalStageLabel(
      request.approval_stage,
      request.approval_stage_label,
    )
  }

  return ''
}

const getManagerUpdateText = (request: OvertimeRequest) => {
  if (request.rejection_reason?.trim()) {
    return request.rejection_reason
  }

  if (request.manager_approved_by?.name) {
    return `Approved by ${request.manager_approved_by.name}`
  }

  if (request.rejected_by?.name) {
    return `Rejected by ${request.rejected_by.name}`
  }

  return '--'
}

const getManagerUpdateMeta = (request: OvertimeRequest) => {
  if (request.rejected_at) {
    return formatDateTime12hCompact(request.rejected_at)
  }

  if (request.manager_approved_at) {
    return formatDateTime12hCompact(request.manager_approved_at)
  }

  return ''
}
</script>

<template>
  <BaseCard class="overtime-table-card">
    <div class="overtime-table-header">
      <div class="overtime-table-heading">
        <h3 class="overtime-table-title">{{ title }}</h3>
        <p class="overtime-table-text">{{ description }}</p>
      </div>

      <p v-if="requests?.total" class="overtime-table-total-pill">{{ requests.total }} requests</p>
    </div>

    <div class="overtime-table-scroll">
      <ElTable
        v-loading="loading"
        :class="[
          'overtime-table',
        ]"
        :data="requests?.data ?? []"
        empty-text=" "
        row-key="id"
        :style="{ minWidth: tableMinWidth }"
      >
        <ElTableColumn v-if="showEmployeeColumn" label="Employee" min-width="220">
          <template #default="{ row }">
            <div class="overtime-table-employee">
              <strong class="overtime-table-value">
                {{ row.employee?.name ?? '--' }}
              </strong>
              <span class="overtime-table-text">
                {{ getEmployeeMetaText(row) }}
              </span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn v-if="showDepartmentColumn" label="Department" min-width="180">
          <template #default="{ row }">
            <span class="overtime-table-value">{{ getDepartmentText(row) }}</span>
          </template>
        </ElTableColumn>

        <ElTableColumn label="Date" min-width="150">
          <template #default="{ row }">
            <span class="overtime-table-value">{{ formatShortDate(row.overtime_date) }}</span>
          </template>
        </ElTableColumn>

        <ElTableColumn label="Time" min-width="220">
          <template #default="{ row }">
            <div class="overtime-table-secondary-block">
              <span class="overtime-table-secondary-line">
                <Clock3 :size="14" />
                {{ formatTime12h(row.start_time) }} - {{ formatTime12h(row.end_time) }}
              </span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="Duration" min-width="150">
          <template #default="{ row }">
            <span class="overtime-table-value">
              {{ formatOvertimeDuration(row.hours, row.minutes) }}
            </span>
          </template>
        </ElTableColumn>

        <ElTableColumn label="Type" min-width="150">
          <template #default="{ row }">
            <BaseBadge :variant="getOvertimeTypeVariant(row.overtime_type)">
              {{ formatOvertimeTypeLabel(row.overtime_type, row.overtime_type_label) }}
            </BaseBadge>
          </template>
        </ElTableColumn>

        <ElTableColumn label="Reason" min-width="260">
          <template #default="{ row }">
            <p class="overtime-table-reason">
              {{ row.reason || '--' }}
            </p>
          </template>
        </ElTableColumn>

        <ElTableColumn label="Status" min-width="140">
          <template #default="{ row }">
            <OvertimeRequestStatusBadge :status="row.status" :status-label="row.status_label" />
          </template>
        </ElTableColumn>

        <ElTableColumn v-if="showApproverColumn" label="Manager / Approver" min-width="220">
          <template #default="{ row }">
            <div class="overtime-table-update">
              <strong class="overtime-table-value">
                {{ getApproverText(row) }}
              </strong>
              <span v-if="getApproverMeta(row)" class="overtime-table-text">
                {{ getApproverMeta(row) }}
              </span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn v-if="showManagerUpdateColumn" label="Manager Update" min-width="260">
          <template #default="{ row }">
            <div class="overtime-table-update">
              <strong class="overtime-table-value">
                {{ getManagerUpdateText(row) }}
              </strong>
              <span v-if="getManagerUpdateMeta(row)" class="overtime-table-text">
                {{ getManagerUpdateMeta(row) }}
              </span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn v-if="showSubmittedColumn" label="Submitted" min-width="190">
          <template #default="{ row }">
            <span class="overtime-table-submitted">
              {{ formatDateTime12hCompact(row.submitted_at ?? row.created_at) }}
            </span>
          </template>
        </ElTableColumn>

        <ElTableColumn label="Actions" align="right" fixed="right" min-width="96">
          <template #default="{ row }">
            <div class="overtime-table-actions">
              <ActionMenu
                v-if="hasActionItems(row)"
                :aria-label="`Open actions for overtime request ${row.id}`"
                :items="getActionItems(row)"
                tooltip="More actions"
                @select="(actionKey) => handleActionSelect(row, actionKey)"
              />
            </div>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <div v-if="!loading && !(requests?.data.length ?? 0)" class="overtime-table-empty-state">
      <p class="overtime-table-text">{{ emptyText }}</p>
    </div>

    <div v-if="(requests?.last_page ?? 1) > 1" class="overtime-table-pagination">
      <p class="overtime-table-text">
        Showing {{ requests?.from ?? 0 }}-{{ requests?.to ?? 0 }} of {{ requests?.total ?? 0 }}
      </p>

      <ElPagination
        :current-page="requests?.current_page ?? 1"
        :page-size="requests?.per_page ?? 15"
        :page-sizes="[10, 15, 20, 50, 100]"
        :total="requests?.total ?? 0"
        background
        layout="prev, pager, next, sizes"
        @current-change="(page: number) => emit('pageChange', page)"
        @size-change="(perPage: number) => emit('perPageChange', perPage)"
      />
    </div>
  </BaseCard>
</template>

<style scoped>
.overtime-table-card {
  overflow: hidden;
  border-color: hsl(var(--border-gray));
  background: linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.08) 100%);
}

.overtime-table-header,
.overtime-table-heading,
.overtime-table-employee,
.overtime-table-secondary-block,
.overtime-table-update {
  display: flex;
  flex-direction: column;
}

.overtime-table-header {
  flex-direction: row;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.2rem 1.25rem 0;
}

.overtime-table-heading {
  gap: 0.25rem;
}

.overtime-table-total-pill {
  display: inline-flex;
  align-items: center;
  padding: 0.45rem 0.78rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 999px;
  background: hsl(var(--secondary) / 0.24);
  color: hsl(var(--foreground));
  font-size: var(--text-xs);
  font-weight: 700;
  flex-shrink: 0;
}

.overtime-table-title,
.overtime-table-value {
  color: hsl(var(--foreground));
}

.overtime-table-title {
  font-size: 1.02rem;
  font-weight: 700;
}

.overtime-table-text {
  color: hsl(var(--muted-foreground));
  line-height: 1.45;
}

.overtime-table-scroll {
  overflow-x: auto;
  padding: 0.95rem 1.25rem 0;
}

.overtime-table {
  width: 100%;
}

.overtime-table-employee,
.overtime-table-secondary-block,
.overtime-table-update {
  gap: 0.35rem;
}

.overtime-table-secondary-line {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: hsl(var(--muted-foreground));
  font-size: var(--text-sm);
  line-height: 1.4;
}

.overtime-table-reason {
  color: hsl(var(--foreground));
  font-size: var(--text-sm);
  line-height: 1.5;
  white-space: normal;
  word-break: break-word;
}

.overtime-table-submitted {
  color: hsl(var(--foreground));
  font-size: var(--text-sm);
  font-weight: 500;
  white-space: nowrap;
}

.overtime-table-actions {
  display: flex;
  justify-content: flex-end;
}

.overtime-table-empty-state {
  padding: 1.15rem 1.25rem 1.25rem;
  text-align: center;
}

.overtime-table-pagination {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin: 1rem 1.25rem 1.25rem;
  padding: 0.95rem 1rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: calc(var(--radius) - 0.15rem);
  background: hsl(var(--secondary) / 0.18);
}

.overtime-table-card :deep(.el-table) {
  --el-table-row-hover-bg-color: hsl(var(--secondary) / 0.28);
  --el-table-header-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-border-color: hsl(var(--border-gray));
  --el-table-text-color: hsl(var(--foreground));
}

.overtime-table-card :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.overtime-table-card :deep(.el-table__header-wrapper th.el-table__cell) {
  padding-block: 0.72rem;
  background: transparent;
  color: hsl(var(--muted-foreground));
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.overtime-table-card :deep(.el-table__body td.el-table__cell) {
  padding-block: 0.82rem;
  background: transparent;
  vertical-align: top;
}

.overtime-table-card :deep(.el-table__body tr.el-table__row:nth-child(even) > td.el-table__cell) {
  background: hsl(var(--secondary) / 0.08);
}

.overtime-table-card :deep(.el-table__body tr.el-table__row:hover > td.el-table__cell) {
  background: hsl(var(--secondary) / 0.2);
}

.overtime-table-card :deep(.el-table__body td.el-table-fixed-column--right) {
  background: inherit;
}

.overtime-table-card :deep(.el-table__fixed-right::before),
.overtime-table-card :deep(.el-table__fixed::before) {
  display: none;
}

.overtime-table-card :deep(.el-table__body tr.el-table__row:hover .action-menu-trigger) {
  border-color: hsl(var(--primary) / 0.24);
  box-shadow: 0 8px 18px hsl(var(--foreground) / 0.08);
}

@media (max-width: 768px) {
  .overtime-table-header,
  .overtime-table-pagination {
    flex-direction: column;
    align-items: flex-start;
  }

  .overtime-table-card :deep(.el-table__body td.el-table__cell),
  .overtime-table-card :deep(.el-table__header-wrapper th.el-table__cell) {
    padding-inline: 0.75rem;
  }
}
</style>
