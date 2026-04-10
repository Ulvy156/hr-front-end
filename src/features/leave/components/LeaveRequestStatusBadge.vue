<script setup lang="ts">
import BaseBadge from '@/components/ui/BaseBadge.vue'

import { formatLeaveStatusLabel, getLeaveStatusVariant } from '../utils/leave'

const props = defineProps<{
  status: string | null | undefined
}>()

const label = computed(() => formatLeaveStatusLabel(props.status))
const variant = computed(() => getLeaveStatusVariant(props.status))
const badgeClass = computed(() => [
  'leave-request-status-badge',
  `leave-request-status-badge-${variant.value}`,
])
</script>

<template>
  <BaseBadge :class="badgeClass" :variant="variant">
    {{ label }}
  </BaseBadge>
</template>

<style scoped>
.leave-request-status-badge {
  min-height: 2rem;
  padding-inline: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.01em;
  box-shadow: inset 0 0 0 1px hsl(var(--border-gray) / 0.4);
}

.leave-request-status-badge-default {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
}

.leave-request-status-badge-success {
  background: hsl(var(--success) / 0.2);
  color: hsl(var(--success));
  box-shadow: inset 0 0 0 1px hsl(var(--success) / 0.2);
}

.leave-request-status-badge-warning {
  background: hsl(var(--warning) / 0.24);
  color: hsl(var(--warning));
  box-shadow: inset 0 0 0 1px hsl(var(--warning) / 0.2);
}

.leave-request-status-badge-danger {
  background: hsl(var(--destructive) / 0.2);
  color: hsl(var(--destructive));
  box-shadow: inset 0 0 0 1px hsl(var(--destructive) / 0.18);
}

.leave-request-status-badge-primary {
  background: hsl(var(--primary) / 0.18);
  color: hsl(var(--primary));
  box-shadow: inset 0 0 0 1px hsl(var(--primary) / 0.16);
}
</style>
