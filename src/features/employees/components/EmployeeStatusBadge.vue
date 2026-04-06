<script setup lang="ts">
import BaseBadge from '@/components/ui/BaseBadge.vue'

const props = defineProps<{
  status: string | null | undefined
}>()

const normalizedStatus = computed(() => props.status ?? 'inactive')

const label = computed(() =>
  (normalizedStatus.value === 'primary' ? 'Primary' : normalizedStatus.value)
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' '),
)

const variant = computed(() => {
  if (normalizedStatus.value === 'primary') return 'primary'
  if (normalizedStatus.value === 'active') return 'success'
  if (normalizedStatus.value === 'inactive') return 'warning'
  if (normalizedStatus.value === 'terminated') return 'danger'
  return 'default'
})
</script>

<template>
  <BaseBadge :variant="variant">
    {{ label }}
  </BaseBadge>
</template>
