<script setup lang="ts">
import { formatDate, formatDateTime12h } from '@/utils/time'

import type { LeaveRequest } from '../interface/leave.interface'
import {
  formatLeaveApprovalProgressLabel,
  formatLeaveApprovalStageLabel,
  formatLeaveDays,
  formatLeaveDurationLabel,
  getHalfDaySessionLabel,
} from '../utils/leave'
import LeaveRequestStatusBadge from './LeaveRequestStatusBadge.vue'

defineProps<{
  request: LeaveRequest
}>()
</script>

<template>
  <div class="leave-detail-body">
    <div class="leave-detail-summary">
      <div>
        <p class="leave-detail-eyebrow">Request #{{ request.id }}</p>
        <h2 class="leave-detail-title">{{ request.leave_type?.name ?? request.type }}</h2>
        <p class="leave-detail-text">
          {{ formatDate(request.start_date) }} to {{ formatDate(request.end_date) }}
        </p>
      </div>

      <LeaveRequestStatusBadge :status="request.status" />
    </div>

    <div class="leave-detail-grid">
      <div class="leave-detail-item">
        <span class="leave-detail-label">Employee</span>
        <strong class="leave-detail-value">{{ request.employee?.name ?? '--' }}</strong>
      </div>
      <div class="leave-detail-item">
        <span class="leave-detail-label">Department</span>
        <strong class="leave-detail-value">{{ request.employee?.department ?? '--' }}</strong>
      </div>
      <div class="leave-detail-item">
        <span class="leave-detail-label">Leave Type</span>
        <strong class="leave-detail-value">
          {{ request.leave_type_label ?? request.leave_type?.name ?? request.type }}
        </strong>
      </div>
      <div class="leave-detail-item">
        <span class="leave-detail-label">Requested Days</span>
        <strong class="leave-detail-value">{{ formatLeaveDays(request.requested_days) }}</strong>
      </div>
      <div class="leave-detail-item">
        <span class="leave-detail-label">Total Days</span>
        <strong class="leave-detail-value">
          {{ formatLeaveDays(request.total_days ?? request.requested_days) }}
        </strong>
      </div>
      <div class="leave-detail-item">
        <span class="leave-detail-label">Duration</span>
        <strong class="leave-detail-value">
          {{ formatLeaveDurationLabel(request.duration_type) }}
        </strong>
        <span v-if="request.duration_type === 'half_day'" class="leave-detail-helper">
          Session: {{ getHalfDaySessionLabel(request.half_day_session) }}
        </span>
      </div>
      <div class="leave-detail-item">
        <span class="leave-detail-label">Submitted At</span>
        <strong class="leave-detail-value">
          {{ formatDateTime12h(request.submitted_at ?? request.created_at) }}
        </strong>
      </div>
      <div class="leave-detail-item leave-detail-item-wide">
        <span class="leave-detail-label">Reason</span>
        <strong class="leave-detail-value">{{ request.reason || '--' }}</strong>
      </div>
      <div class="leave-detail-item">
        <span class="leave-detail-label">Cancelable</span>
        <strong class="leave-detail-value">{{ request.cancelable ? 'Yes' : 'No' }}</strong>
      </div>
      <div class="leave-detail-item">
        <span class="leave-detail-label">Approval Stage</span>
        <strong class="leave-detail-value">
          {{ formatLeaveApprovalStageLabel(request.approval_stage) }}
        </strong>
      </div>
      <div class="leave-detail-item">
        <span class="leave-detail-label">Manager Review</span>
        <strong class="leave-detail-value">
          {{ formatLeaveApprovalProgressLabel(request.manager_approval_status) }}
        </strong>
        <span class="leave-detail-helper">
          {{ request.manager_approved_by?.name ?? '--' }} &middot;
          {{ formatDateTime12h(request.manager_approved_at) }}
        </span>
      </div>
      <div class="leave-detail-item">
        <span class="leave-detail-label">HR Review</span>
        <strong class="leave-detail-value">
          {{ formatLeaveApprovalProgressLabel(request.hr_approval_status) }}
        </strong>
        <span class="leave-detail-helper">
          {{ request.hr_approved_by?.name ?? '--' }} &middot;
          {{ formatDateTime12h(request.hr_approved_at) }}
        </span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.leave-detail-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.leave-detail-summary {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid hsl(var(--border-gray));
}

.leave-detail-eyebrow,
.leave-detail-text,
.leave-detail-label,
.leave-detail-helper {
  color: hsl(var(--muted-foreground));
}

.leave-detail-title,
.leave-detail-value {
  color: hsl(var(--foreground));
}

.leave-detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

.leave-detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--secondary) / 0.14);
  padding: 0.95rem 1rem;
}

.leave-detail-item-wide {
  grid-column: span 2;
}

.leave-detail-label {
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.leave-detail-helper {
  font-size: var(--text-xs);
}

@media (max-width: 768px) {
  .leave-detail-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .leave-detail-item-wide {
    grid-column: span 1;
  }
}
</style>
