<script setup lang="ts">
import BaseCard from '@/components/ui/BaseCard.vue'
import EmployeeStatusBadge from '@/features/employees/components/EmployeeStatusBadge.vue'
import type { EmployeePositionHistoryItem } from '@/features/employees/interface/employee.interface'
import { formatEmployeeDate } from '@/features/employees/utils/employee'

defineProps<{
  positions: EmployeePositionHistoryItem[]
}>()
</script>

<template>
  <BaseCard class="border border-slate-200 shadow-sm">
    <div class="space-y-4 p-5">
      <div>
        <h3 class="text-lg font-semibold text-slate-900">Positions</h3>
        <p class="text-sm text-slate-500">
          Review the position history linked to your employee profile.
        </p>
      </div>

      <div v-if="positions.length" class="space-y-4">
        <div
          v-for="position in positions"
          :key="position.id ?? `${position.position_id}-${position.start_date}`"
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div class="mb-4 flex items-center justify-between gap-3">
            <h4 class="text-base font-semibold text-slate-900">
              {{ position.position?.title || `Position #${position.position_id}` }}
            </h4>
            <EmployeeStatusBadge :status="position.is_current ? 'active' : 'inactive'" />
          </div>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div class="space-y-1">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Base Salary</p>
              <p class="text-sm font-medium text-slate-900">{{ position.base_salary || '--' }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Start Date</p>
              <p class="text-sm font-medium text-slate-900">{{ formatEmployeeDate(position.start_date) }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">End Date</p>
              <p class="text-sm font-medium text-slate-900">{{ formatEmployeeDate(position.end_date) }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Current</p>
              <p class="text-sm font-medium text-slate-900">{{ position.is_current ? 'Yes' : 'No' }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
        <h4 class="text-base font-semibold text-slate-900">No positions available</h4>
        <p class="max-w-md text-sm text-slate-500">
          There are no position records linked to this profile yet.
        </p>
      </div>
    </div>
  </BaseCard>
</template>
