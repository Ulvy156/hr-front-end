<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger'
  }>(),
  {
    variant: 'default',
  },
)

const badgeClass = computed(() => ['base-badge', `variant-${props.variant}`])
</script>

<template>
  <span :class="badgeClass">
    <slot />
  </span>
</template>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.75rem;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: 600;
}

.variant-default {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
}

.variant-primary {
  background: hsl(var(--primary) / 0.18);
  color: hsl(var(--primary));
}

.variant-success {
  background: hsl(var(--success) / 0.14);
  color: hsl(var(--success));
}

.variant-warning {
  background: hsl(var(--warning) / 0.16);
  color: hsl(var(--warning));
}

.variant-danger {
  background: hsl(var(--destructive) / 0.14);
  color: hsl(var(--destructive));
}
</style>
