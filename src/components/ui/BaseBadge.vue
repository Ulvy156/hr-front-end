<script setup lang="ts">
import { ElTag } from 'element-plus'

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
  <ElTag :class="badgeClass" disable-transitions round>
    <slot />
  </ElTag>
</template>

<style scoped>
.base-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.75rem;
  padding: 0.25rem 0.625rem;
  border: none;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: 600;
  line-height: 1.2;
  --el-tag-border-color: transparent;
}

.variant-default {
  --el-tag-bg-color: hsl(var(--secondary));
  --el-tag-text-color: hsl(var(--secondary-foreground));
}

.variant-primary {
  --el-tag-bg-color: hsl(var(--primary) / 0.18);
  --el-tag-text-color: hsl(var(--primary));
}

.variant-success {
  --el-tag-bg-color: hsl(var(--success) / 0.14);
  --el-tag-text-color: hsl(var(--success));
}

.variant-warning {
  --el-tag-bg-color: hsl(var(--warning) / 0.16);
  --el-tag-text-color: hsl(var(--warning));
}

.variant-danger {
  --el-tag-bg-color: hsl(var(--destructive) / 0.14);
  --el-tag-text-color: hsl(var(--destructive));
}
</style>
