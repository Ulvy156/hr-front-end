<script setup lang="ts">
import BaseTable, { type BaseTableColumn } from '@/components/ui/BaseTable.vue'

import type { AttendanceDepartmentSummaryItem } from '../interface/attendance.interface'

const props = defineProps<{
  rows: AttendanceDepartmentSummaryItem[]
}>()

const columns: BaseTableColumn[] = [
  { key: 'departmentName', label: 'Department' },
  { key: 'totalRecords', label: 'Total Records', align: 'right' },
  { key: 'completedRecords', label: 'Completed', align: 'right' },
  { key: 'lateRecords', label: 'Late', align: 'right' },
  { key: 'correctedRecords', label: 'Corrected', align: 'right' },
  { key: 'absentRecords', label: 'Absent', align: 'right' },
  { key: 'totalWorkedMinutes', label: 'Worked Minutes', align: 'right' },
]

const tableRows = computed(() =>
  props.rows.map((row) => ({
    departmentName: row.departmentName ?? '--',
    totalRecords: row.totalRecords ?? 0,
    completedRecords: row.completedRecords ?? 0,
    lateRecords: row.lateRecords ?? 0,
    correctedRecords: row.correctedRecords ?? 0,
    absentRecords: row.absentRecords ?? 0,
    totalWorkedMinutes: row.totalWorkedMinutes ?? 0,
  })),
)
</script>

<template>
  <section class="department-summary">
    <div>
      <h3 class="department-summary-title">Department Summary</h3>
      <p class="department-summary-text">Department-level attendance totals for the selected month.</p>
    </div>

    <BaseTable
      :columns="columns"
      :rows="tableRows"
      empty-text="No department attendance summary is available for the selected filters."
    />
  </section>
</template>

<style scoped>
.department-summary {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.department-summary-title {
  color: hsl(var(--foreground));
}

.department-summary-text {
  margin-top: 0.25rem;
  color: hsl(var(--muted-foreground));
}
</style>
