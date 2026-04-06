<script setup lang="ts">
const props = defineProps<{
  event: string | null | undefined
}>()

const normalizedEvent = computed(() => props.event?.trim().toLowerCase() ?? '')

const badgeClass = computed(() => {
  if (['check_in', 'create', 'created'].includes(normalizedEvent.value)) {
    return 'tone-green'
  }

  if (['check_out'].includes(normalizedEvent.value)) {
    return 'tone-blue'
  }

  if (['update', 'updated'].includes(normalizedEvent.value)) {
    return 'tone-yellow'
  }

  if (['delete', 'deleted'].includes(normalizedEvent.value)) {
    return 'tone-red'
  }

  return 'tone-gray'
})

const label = computed(() => {
  if (!normalizedEvent.value) return '--'

  return normalizedEvent.value
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
})
</script>

<template>
  <span class="audit-event-badge" :class="badgeClass">
    {{ label }}
  </span>
</template>

<style scoped>
.audit-event-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 5.5rem;
  padding: 0.35rem 0.65rem;
  border-radius: 999px;
  font-size: var(--text-xs);
  font-weight: 700;
  line-height: 1;
  text-transform: none;
}

.tone-green {
  background: rgb(220 252 231);
  color: rgb(21 128 61);
}

.tone-blue {
  background: rgb(219 234 254);
  color: rgb(29 78 216);
}

.tone-yellow {
  background: rgb(254 249 195);
  color: rgb(161 98 7);
}

.tone-red {
  background: rgb(254 226 226);
  color: rgb(185 28 28);
}

.tone-gray {
  background: rgb(243 244 246);
  color: rgb(75 85 99);
}
</style>
