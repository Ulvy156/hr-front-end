<script setup lang="ts">
import BaseBadge from '@/components/ui/BaseBadge.vue'

import type { OvertimeRequestStatus } from '../interface/overtime.interface'
import { formatOvertimeStatusLabel, getOvertimeStatusVariant } from '../utils/overtime'

const props = defineProps<{
  status: OvertimeRequestStatus | string | null | undefined
  statusLabel?: string | null
}>()

const variant = computed(() => getOvertimeStatusVariant(props.status))
const label = computed(() => formatOvertimeStatusLabel(props.status, props.statusLabel))
</script>

<template>
  <BaseBadge :variant="variant">
    {{ label }}
  </BaseBadge>
</template>
