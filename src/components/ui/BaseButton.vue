<script setup lang="ts">
import BaseSpinner from './BaseSpinner.vue'

const props = withDefaults(
  defineProps<{
    type?: 'button' | 'submit' | 'reset'
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    disabled?: boolean
    loading?: boolean
    block?: boolean
  }>(),
  {
    type: 'button',
    variant: 'primary',
    disabled: false,
    loading: false,
    block: false,
  },
)

const emit = defineEmits<{
  click: [event: MouseEvent]
}>()

const buttonClass = computed(() => [
  'base-button',
  `variant-${props.variant}`,
  {
    'is-block': props.block,
    'is-loading': props.loading,
  },
])

const isDisabled = computed(() => props.disabled || props.loading)

const handleClick = (event: MouseEvent) => {
  if (isDisabled.value) {
    event.preventDefault()
    return
  }

  emit('click', event)
}
</script>

<template>
  <button :class="buttonClass" :disabled="isDisabled" :type="type" @click="handleClick">
    <BaseSpinner v-if="loading" size="sm" />
    <span class="button-content">
      <slot />
    </span>
  </button>
</template>

<style scoped>
.base-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  min-height: 2.75rem;
  padding: 0.75rem 1rem;
  border: 1px solid transparent;
  border-radius: var(--radius);
  font: inherit;
  font-weight: 600;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    color 0.2s ease,
    opacity 0.2s ease,
    box-shadow 0.2s ease;
  cursor: pointer;
}

.button-content {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.is-block {
  width: 100%;
}

.base-button:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.variant-primary {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  box-shadow: var(--shadow-card);
}

.variant-primary:not(:disabled):hover {
  box-shadow: var(--shadow-card-hover);
}

.variant-secondary {
  background: hsl(var(--secondary));
  color: hsl(var(--secondary-foreground));
  border-color: hsl(var(--border-gray));
}

.variant-secondary:not(:disabled):hover {
  background: hsl(var(--muted));
}

.variant-danger {
  background: hsl(var(--destructive));
  color: hsl(var(--destructive-foreground));
}

.variant-danger:not(:disabled):hover {
  box-shadow: var(--shadow-card-hover);
}

.variant-ghost {
  background: transparent;
  color: hsl(var(--foreground));
  border-color: hsl(var(--border-gray));
}

.variant-ghost:not(:disabled):hover {
  background: hsl(var(--secondary));
}
</style>
