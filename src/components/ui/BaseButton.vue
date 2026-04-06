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
    'is-disabled': isDisabled.value,
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
    box-shadow 0.2s ease,
    transform 0.16s ease;
  cursor: pointer;
  box-shadow: 0 1px 2px hsl(var(--foreground) / 0.04);
}

.base-button:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px hsl(var(--ring) / 0.18),
    0 4px 14px hsl(var(--foreground) / 0.08);
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
  pointer-events: none;
  cursor: not-allowed;
  opacity: 0.56;
  box-shadow: none;
  transform: none;
}

.variant-primary {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
  box-shadow: 0 10px 18px hsl(var(--primary) / 0.18);
}

.variant-primary:not(:disabled):hover {
  background: hsl(160 84% 34%);
  box-shadow: 0 14px 28px hsl(var(--primary) / 0.24);
  transform: translateY(-1px);
}

.variant-primary:not(:disabled):active {
  background: hsl(160 84% 31%);
  transform: scale(0.98);
}

.variant-secondary {
  background: hsl(var(--secondary));
  color: hsl(var(--foreground));
  border-color: hsl(var(--border-gray));
  box-shadow: 0 2px 8px hsl(var(--foreground) / 0.04);
}

.variant-secondary:not(:disabled):hover {
  background: hsl(var(--muted));
  border-color: hsl(var(--muted-foreground) / 0.28);
  box-shadow: 0 8px 18px hsl(var(--foreground) / 0.08);
  transform: translateY(-1px);
}

.variant-secondary:not(:disabled):active {
  background: hsl(220 14% 92%);
  transform: scale(0.985);
}

.variant-danger {
  background: hsl(var(--destructive));
  color: hsl(var(--destructive-foreground));
  box-shadow: 0 10px 18px hsl(var(--destructive) / 0.18);
}

.variant-danger:not(:disabled):hover {
  background: hsl(0 84% 54%);
  box-shadow: 0 14px 28px hsl(var(--destructive) / 0.24);
  transform: translateY(-1px);
}

.variant-danger:not(:disabled):active {
  background: hsl(0 84% 50%);
  transform: scale(0.98);
}

.variant-ghost {
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  border-color: hsl(var(--border-gray));
}

.variant-ghost:not(:disabled):hover {
  background: hsl(var(--secondary));
  border-color: hsl(var(--muted-foreground) / 0.24);
  box-shadow: 0 8px 18px hsl(var(--foreground) / 0.06);
  transform: translateY(-1px);
}

.variant-ghost:not(:disabled):active {
  background: hsl(220 14% 92%);
  transform: scale(0.985);
}

.variant-primary:disabled,
.variant-danger:disabled {
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
}

.variant-secondary:disabled,
.variant-ghost:disabled {
  background: hsl(var(--muted));
  color: hsl(var(--muted-foreground));
  border-color: hsl(var(--border-gray));
}
</style>
