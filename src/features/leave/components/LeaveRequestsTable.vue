<script setup lang="ts">
import { CalendarRange, Clock3, Eye } from 'lucide-vue-next'

import ActionMenu, { type ActionMenuItem } from '@/components/ui/ActionMenu.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import { formatDateTime12hCompact, formatReadableDateRange } from '@/utils/time'

import type { LeaveRequest, LeaveRequestListResponse } from '../interface/leave.interface'
import {
  formatLeaveDays,
  formatLeaveDurationLabel,
  getHalfDaySessionLabel,
} from '../utils/leave'
import LeaveRequestStatusBadge from './LeaveRequestStatusBadge.vue'

const props = withDefaults(
  defineProps<{
    title: string
    description: string
    requests: LeaveRequestListResponse | null
    loading?: boolean
    emptyText?: string
    showEmployeeColumn?: boolean
    resolveActions?: (request: LeaveRequest) => ActionMenuItem[]
  }>(),
  {
    loading: false,
    emptyText: 'No leave requests matched the current filters.',
    showEmployeeColumn: false,
    resolveActions: undefined,
  },
)

const emit = defineEmits<{
  action: [payload: { request: LeaveRequest; actionKey: string }]
  pageChange: [page: number]
  perPageChange: [perPage: number]
}>()

const handleActionSelect = (request: LeaveRequest, actionKey: string) => {
  emit('action', {
    request,
    actionKey,
  })
}

const getActionItems = (request: LeaveRequest) => {
  const actions = props.resolveActions?.(request) ?? []

  if (actions.length > 0) {
    return actions
  }

  return [
    {
      key: 'view',
      label: 'View',
      icon: Eye,
      tone: 'primary',
    },
  ] satisfies ActionMenuItem[]
}

const hasActionItems = (request: LeaveRequest) => {
  return getActionItems(request).length > 0
}

const getLeaveTypeTitle = (request: LeaveRequest) => {
  return request.leave_type_label ?? request.leave_type?.name ?? request.type
}

const getDurationSummary = (request: LeaveRequest) => {
  const durationLabel = formatLeaveDurationLabel(request.duration_type)
  const inlineSeparator = '\u2022'
  const shortDurationLabel =
    durationLabel === 'Full Day'
      ? 'Full'
      : durationLabel === 'Half Day'
        ? 'Half'
        : durationLabel

  if (request.duration_type === 'half_day') {
    return `${formatLeaveDays(request.total_days ?? request.requested_days)} (${shortDurationLabel} ${inlineSeparator} ${getHalfDaySessionLabel(request.half_day_session)})`
  }

  return `${formatLeaveDays(request.total_days ?? request.requested_days)} (${shortDurationLabel})`
}
</script>

<template>
  <BaseCard class="leave-table-card">
    <div class="leave-table-header">
      <div class="leave-table-header-copy">
        <div class="leave-table-heading">
          <h3 class="leave-table-title">{{ title }}</h3>
          <p class="leave-table-text">{{ description }}</p>
        </div>
      </div>

      <p v-if="requests?.total" class="leave-table-total-pill">{{ requests.total }} requests</p>
    </div>

    <div class="leave-table-scroll">
      <ElTable
        v-loading="loading"
        :data="requests?.data ?? []"
        :class="['leave-table', { 'leave-table-with-employee': showEmployeeColumn }]"
        empty-text=" "
        row-key="id"
      >
        <ElTableColumn v-if="showEmployeeColumn" label="Employee" min-width="220">
          <template #default="{ row }">
            <div class="leave-table-employee">
              <strong class="leave-table-value">{{ row.employee?.name ?? '--' }}</strong>
              <span class="leave-table-text">{{ row.employee?.department ?? '--' }}</span>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="Leave Request" min-width="320">
          <template #default="{ row }">
            <div class="leave-table-request">
              <strong class="leave-table-value leave-table-request-title">
                {{ getLeaveTypeTitle(row) }}
              </strong>

              <div class="leave-table-secondary-block">
                <span class="leave-table-secondary-line">
                  <CalendarRange :size="14" />
                  {{ formatReadableDateRange(row.start_date, row.end_date) }}
                </span>
                <span class="leave-table-secondary-line">
                  <Clock3 :size="14" />
                  {{ getDurationSummary(row) }}
                </span>
              </div>
            </div>
          </template>
        </ElTableColumn>

        <ElTableColumn label="Status" min-width="150">
          <template #default="{ row }">
            <LeaveRequestStatusBadge :status="row.status" />
          </template>
        </ElTableColumn>

        <ElTableColumn label="Submitted At" min-width="210">
          <template #default="{ row }">
            <span class="leave-table-submitted">
              {{ formatDateTime12hCompact(row.submitted_at ?? row.created_at) }}
            </span>
          </template>
        </ElTableColumn>

        <ElTableColumn label="Actions" align="right" fixed="right" min-width="100">
          <template #default="{ row }">
            <div class="leave-table-actions">
              <ActionMenu
                v-if="hasActionItems(row)"
                :aria-label="`Open actions for leave request ${row.id}`"
                :items="getActionItems(row)"
                tooltip="More actions"
                @select="(actionKey) => handleActionSelect(row, actionKey)"
              />
            </div>
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <div v-if="!loading && !(requests?.data.length ?? 0)" class="leave-table-empty-state">
      <p class="leave-table-text">{{ emptyText }}</p>
    </div>

    <div v-if="(requests?.last_page ?? 1) > 1" class="leave-table-pagination">
      <div class="leave-table-pagination-copy">
        <p class="leave-table-text">
          Showing {{ requests?.from ?? 0 }}-{{ requests?.to ?? 0 }} of {{ requests?.total ?? 0 }}
        </p>
      </div>

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
.leave-table-card {
  overflow: hidden;
  border-color: hsl(var(--border-gray));
  background:
    linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.08) 100%);
}

.leave-table-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.2rem 1.25rem 0;
}

.leave-table-header-copy,
.leave-table-heading,
.leave-table-pagination-copy,
.leave-table-employee,
.leave-table-request,
.leave-table-secondary-block {
  display: flex;
  flex-direction: column;
}

.leave-table-header-copy,
.leave-table-heading,
.leave-table-pagination-copy {
  gap: 0.25rem;
}

.leave-table-total-pill {
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

.leave-table-title,
.leave-table-value {
  color: hsl(var(--foreground));
}

.leave-table-title {
  font-size: 1.02rem;
  font-weight: 700;
}

.leave-table-text {
  color: hsl(var(--muted-foreground));
  line-height: 1.45;
}

.leave-table-scroll {
  overflow-x: auto;
  padding: 0.95rem 1.25rem 0;
}

.leave-table {
  width: 100%;
  min-width: 780px;
}

.leave-table-with-employee {
  min-width: 980px;
}

.leave-table-employee,
.leave-table-request {
  gap: 0.35rem;
}

.leave-table-request-title {
  line-height: 1.35;
}

.leave-table-secondary-block {
  gap: 0.2rem;
}

.leave-table-secondary-line {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  color: hsl(var(--muted-foreground));
  font-size: var(--text-sm);
  line-height: 1.4;
}

.leave-table-submitted {
  color: hsl(var(--foreground));
  font-size: var(--text-sm);
  font-weight: 500;
  white-space: nowrap;
}

.leave-table-actions {
  display: flex;
  justify-content: flex-end;
}

.leave-table-empty-state {
  padding: 1.15rem 1.25rem 1.25rem;
  text-align: center;
}

.leave-table-pagination {
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

.leave-table-card :deep(.el-table) {
  --el-table-row-hover-bg-color: hsl(var(--secondary) / 0.28);
  --el-table-header-bg-color: transparent;
  --el-table-tr-bg-color: transparent;
  --el-table-border-color: hsl(var(--border-gray));
  --el-table-text-color: hsl(var(--foreground));
}

.leave-table-card :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.leave-table-card :deep(.el-table__header-wrapper th.el-table__cell) {
  padding-block: 0.72rem;
  background: transparent;
  color: hsl(var(--muted-foreground));
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.leave-table-card :deep(.el-table__body td.el-table__cell) {
  padding-block: 0.82rem;
  background: transparent;
}

.leave-table-card :deep(.el-table__body tr.el-table__row:nth-child(even) > td.el-table__cell) {
  background: hsl(var(--secondary) / 0.08);
}

.leave-table-card :deep(.el-table__body tr.el-table__row:hover > td.el-table__cell) {
  background: hsl(var(--secondary) / 0.2);
}

.leave-table-card :deep(.el-table__body td.el-table-fixed-column--right) {
  background: inherit;
}

.leave-table-card :deep(.el-table__fixed-right::before),
.leave-table-card :deep(.el-table__fixed::before) {
  display: none;
}

.leave-table-card :deep(.el-table__body tr.el-table__row:hover .action-menu-trigger) {
  border-color: hsl(var(--primary) / 0.24);
  box-shadow: 0 8px 18px hsl(var(--foreground) / 0.08);
}

@media (max-width: 640px) {
  .leave-table-header,
  .leave-table-pagination {
    flex-direction: column;
    align-items: flex-start;
  }

  .leave-table-scroll {
    padding-top: 0.75rem;
  }

  .leave-table-card :deep(.el-table__body td.el-table__cell),
  .leave-table-card :deep(.el-table__header-wrapper th.el-table__cell) {
    padding-inline: 0.75rem;
  }
}
</style>
