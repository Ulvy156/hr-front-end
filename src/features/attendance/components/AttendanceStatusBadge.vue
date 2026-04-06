<script setup lang="ts">
import BaseBadge from '@/components/ui/BaseBadge.vue'

const props = defineProps<{
  status: string | null | undefined
}>()

const normalizedStatus = computed(() => props.status ?? 'none')

const label = computed(() => {
  return normalizedStatus.value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
})

const variant = computed(() => {
  if (
    ['checked_in', 'checked_out', 'present', 'corrected', 'approved'].includes(
      normalizedStatus.value,
    )
  ) {
    return 'success'
  }

  if (['late'].includes(normalizedStatus.value)) {
    return 'warning'
  }

  if (['absent', 'not_checked_in', 'rejected'].includes(normalizedStatus.value)) {
    return 'danger'
  }

  return 'default'
})
</script>

<template>
  <BaseBadge :variant="variant">
    {{ label }}
  </BaseBadge>
</template>
