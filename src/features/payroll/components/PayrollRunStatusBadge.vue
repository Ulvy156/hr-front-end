<script setup lang="ts">
import BaseBadge from '@/components/ui/BaseBadge.vue'

import type { PayrollRunStatus } from '../interface/payroll.interface'
import { formatPayrollStatusLabel, getPayrollStatusVariant } from '../utils/payroll'

defineProps<{
  status: PayrollRunStatus | string | null | undefined
}>()
</script>

<template>
  <BaseBadge :variant="getPayrollStatusVariant(status)">
    {{ formatPayrollStatusLabel(status) }}
  </BaseBadge>
</template>
