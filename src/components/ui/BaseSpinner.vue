<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
    label?: string
  }>(),
  {
    size: 'md',
    label: 'Loading',
  },
)

const sizeClass = computed(() => {
  if (props.size === 'sm') return 'spinner-sm'
  if (props.size === 'lg') return 'spinner-lg'
  return 'spinner-md'
})
</script>

<template>
  <span class="base-spinner" :aria-label="label" role="status">
    <span :class="sizeClass" class="spinner-circle" />
  </span>
</template>

<style scoped>
.base-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.spinner-circle {
  border-radius: 9999px;
  border-style: solid;
  border-color: hsl(var(--border-gray));
  border-top-color: hsl(var(--primary));
  animation: spinner-rotate 0.8s linear infinite;
}

.spinner-sm {
  width: 0.875rem;
  height: 0.875rem;
  border-width: 2px;
}

.spinner-md {
  width: 1rem;
  height: 1rem;
  border-width: 2px;
}

.spinner-lg {
  width: 1.5rem;
  height: 1.5rem;
  border-width: 3px;
}

@keyframes spinner-rotate {
  to {
    transform: rotate(360deg);
  }
}
</style>
