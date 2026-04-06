<script setup lang="ts">
import BaseCard from '@/components/ui/BaseCard.vue'
import EmployeeStatusBadge from '@/features/employees/components/EmployeeStatusBadge.vue'
import type { EmployeeAddress } from '@/features/employees/interface/employee.interface'

defineProps<{
  addresses: EmployeeAddress[]
}>()
</script>

<template>
  <div class="space-y-4">
    <BaseCard class="border border-slate-200 shadow-sm">
      <div class="space-y-4 p-5">
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Addresses</h3>
          <p class="text-sm text-slate-500">
            Review the structured addresses linked to your employee profile.
          </p>
        </div>

        <div v-if="addresses.length" class="space-y-4">
          <div
            v-for="address in addresses"
            :key="address.id ?? `${address.address_type}-${address.address_line}`"
            class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            <div class="mb-4 flex items-center justify-between gap-3">
              <EmployeeStatusBadge :status="address.address_type" />
              <span v-if="address.is_primary" class="inline-flex rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
                Primary
              </span>
            </div>

            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <div class="space-y-1">
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Province</p>
                <p class="text-sm font-medium text-slate-900">{{ address.province?.name_en || '--' }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">District</p>
                <p class="text-sm font-medium text-slate-900">{{ address.district?.name_en || '--' }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Commune</p>
                <p class="text-sm font-medium text-slate-900">{{ address.commune?.name_en || '--' }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Village</p>
                <p class="text-sm font-medium text-slate-900">{{ address.village?.name_en || '--' }}</p>
              </div>
              <div class="space-y-1 md:col-span-2 xl:col-span-2">
                <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Address Line</p>
                <p class="text-sm font-medium text-slate-900">{{ address.address_line || '--' }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
          <h4 class="text-base font-semibold text-slate-900">No addresses available</h4>
          <p class="max-w-md text-sm text-slate-500">
            There are no address records linked to this profile yet.
          </p>
        </div>
      </div>
    </BaseCard>
  </div>
</template>
