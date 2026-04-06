<script setup lang="ts">
import { ROLES, isOneOfRoles, type Role } from '@/constants/roles'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import { formatTime12h } from '@/utils/time'

import type {
  EmployeeDashboardRecord,
  WorkforceDashboardRecord,
} from '../interface/dashboard.interface'

const props = defineProps<{
  role: Role
  records: EmployeeDashboardRecord[] | WorkforceDashboardRecord[]
}>()

const emit = defineEmits<{
  viewAll: []
  rowClick: [record: EmployeeDashboardRecord | WorkforceDashboardRecord]
}>()

const visibleRecords = computed(() => props.records.slice(0, 5))

const formatStatus = (status: string) => {
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const statusClass = (status: string) => {
  if (status === 'checked_in' || status === 'present') return 'status-success'
  if (status === 'checked_out') return 'status-primary'
  if (status === 'late') return 'status-warning'
  return 'status-danger'
}

const hasEmployeeColumn = computed(() => !isOneOfRoles(props.role, [ROLES.EMPLOYEE]))

const getEmployeeName = (record: EmployeeDashboardRecord | WorkforceDashboardRecord) => {
  if ('employee' in record) {
    return record.employee?.name ?? '--'
  }

  return '--'
}

const getEmployeeDepartment = (record: EmployeeDashboardRecord | WorkforceDashboardRecord) => {
  if ('employee' in record) {
    return record.employee?.department ?? '--'
  }

  return '--'
}
</script>

<template>
  <BaseCard class="records-card">
    <div class="records-header">
      <div>
        <h3 class="records-title">Recent Records</h3>
        <p class="records-subtitle">View recent attendance activity and open details when needed.</p>
      </div>
      <BaseButton variant="ghost" @click="emit('viewAll')">View All</BaseButton>
    </div>

    <div v-if="visibleRecords.length" class="records-table-shell">
      <table class="records-table">
        <thead>
          <tr>
            <th>Date</th>
            <th v-if="hasEmployeeColumn">Employee</th>
            <th v-if="hasEmployeeColumn">Department</th>
            <th>Check In</th>
            <th>Check Out</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="record in visibleRecords"
            :key="`${record.date}-${record.checkInTime}-${record.status}`"
            class="records-row"
            @click="emit('rowClick', record)"
          >
            <td>{{ record.date }}</td>
            <td v-if="hasEmployeeColumn">{{ getEmployeeName(record) }}</td>
            <td v-if="hasEmployeeColumn">{{ getEmployeeDepartment(record) }}</td>
            <td>{{ formatTime12h(record.checkInTime) }}</td>
            <td>{{ formatTime12h(record.checkOutTime) }}</td>
            <td>
              <span :class="statusClass(record.status)" class="status-badge">
                {{ formatStatus(record.status) }}
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-else class="records-empty">
      <p class="records-empty-title">No recent attendance records</p>
      <p class="records-empty-text">
        Recent attendance activity will appear here when it is available.
      </p>
    </div>
  </BaseCard>
</template>

<style scoped>
.records-card {
  overflow: hidden;
}

.records-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem 1.25rem 0;
}

.records-title {
  color: hsl(var(--foreground));
}

.records-subtitle {
  margin-top: 0.25rem;
  color: hsl(var(--muted-foreground));
}

.records-table-shell {
  overflow-x: auto;
  padding: 1rem 1.25rem 1.25rem;
}

.records-table {
  width: 100%;
  border-collapse: collapse;
}

.records-table th,
.records-table td {
  padding: 0.875rem 0.75rem;
  border-bottom: 1px solid hsl(var(--border-gray));
  text-align: left;
  color: hsl(var(--foreground));
}

.records-table th {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-xs);
  font-weight: 700;
}

.records-table tbody tr:last-child td {
  border-bottom: 0;
}

.records-row {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.records-row:hover {
  background: hsl(var(--secondary));
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.75rem;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: 600;
}

.status-success {
  background: hsl(var(--success) / 0.14);
  color: hsl(var(--success));
}

.status-primary {
  background: hsl(var(--primary) / 0.14);
  color: hsl(var(--primary));
}

.status-warning {
  background: hsl(var(--warning) / 0.16);
  color: hsl(var(--warning));
}

.status-danger {
  background: hsl(var(--destructive) / 0.14);
  color: hsl(var(--destructive));
}

.records-empty {
  padding: 1.5rem 1.25rem;
  color: hsl(var(--muted-foreground));
}

.records-empty-title {
  color: hsl(var(--foreground));
  font-weight: 700;
}

.records-empty-text {
  margin-top: 0.25rem;
}

@media (max-width: 768px) {
  .records-header {
    flex-direction: column;
  }
}
</style>
