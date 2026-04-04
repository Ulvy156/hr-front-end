<script setup lang="ts">
withDefaults(
  defineProps<{
    forId?: string
    required?: boolean
  }>(),
  {
    forId: undefined,
    required: false,
  },
)
</script>

<template>
  <label :for="forId" class="base-label">
    <slot />
    <span v-if="required" class="label-required" aria-hidden="true">*</span>
  </label>
</template>

<style scoped>
.base-label {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  margin-bottom: 0.375rem;
  color: hsl(var(--foreground));
  font-size: var(--text-xs);
  font-weight: 600;
}

.label-required {
  color: hsl(var(--destructive));
}
</style>
