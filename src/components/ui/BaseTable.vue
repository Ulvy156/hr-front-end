<script setup lang="ts">
export type BaseTableColumn = {
  key: string
  label: string
  align?: 'left' | 'center' | 'right'
}

defineProps<{
  columns: BaseTableColumn[]
  rows: Record<string, unknown>[]
  emptyText?: string
}>()

const alignClass = (align?: BaseTableColumn['align']) => {
  if (align === 'center') return 'align-center'
  if (align === 'right') return 'align-right'
  return 'align-left'
}
</script>

<template>
  <div class="base-table-shell">
    <table class="base-table">
      <thead>
        <tr>
          <th
            v-for="column in columns"
            :key="column.key"
            :class="alignClass(column.align)"
          >
            {{ column.label }}
          </th>
        </tr>
      </thead>
      <tbody v-if="rows.length">
        <tr v-for="(row, rowIndex) in rows" :key="rowIndex">
          <td
            v-for="column in columns"
            :key="column.key"
            :class="alignClass(column.align)"
          >
            <slot :name="`cell-${column.key}`" :row="row" :value="row[column.key]">
              {{ row[column.key] }}
            </slot>
          </td>
        </tr>
      </tbody>
      <tbody v-else>
        <tr>
          <td :colspan="columns.length" class="base-table-empty">
            {{ emptyText ?? 'No data available.' }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.base-table-shell {
  overflow-x: auto;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
  box-shadow: var(--shadow-card);
}

.base-table {
  width: 100%;
  border-collapse: collapse;
  color: hsl(var(--foreground));
}

.base-table th,
.base-table td {
  padding: 0.875rem 1rem;
  border-bottom: 1px solid hsl(var(--border-gray));
}

.base-table th {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
  font-size: var(--text-xs);
  font-weight: 700;
}

.base-table tbody tr:last-child td {
  border-bottom: 0;
}

.base-table tbody tr:hover {
  background: hsl(var(--muted));
}

.align-left {
  text-align: left;
}

.align-center {
  text-align: center;
}

.align-right {
  text-align: right;
}

.base-table-empty {
  color: hsl(var(--muted-foreground));
  text-align: center;
}
</style>
