<script setup lang="ts">
import BaseLabel from './BaseLabel.vue'

export type BaseRadioOption = {
  label: string
  value: string | number
  description?: string
  disabled?: boolean
}

const model = defineModel<string | number | undefined>()

const props = withDefaults(
  defineProps<{
    id?: string
    name?: string
    label?: string
    error?: string
    required?: boolean
    disabled?: boolean
    options: BaseRadioOption[]
    orientation?: 'row' | 'column'
    density?: 'default' | 'compact'
  }>(),
  {
    id: undefined,
    name: undefined,
    label: undefined,
    error: '',
    required: false,
    disabled: false,
    orientation: 'row',
    density: 'default',
  },
)

const fallbackGroupName = `radio-group-${Math.random().toString(36).slice(2)}`

const groupName = computed(() => props.name || props.id || fallbackGroupName)

const groupClass = computed(() => [
  'base-radio-group-options',
  `is-${props.orientation}`,
  `density-${props.density}`,
])
</script>

<template>
  <div class="base-radio-group">
    <BaseLabel v-if="label" :for-id="id" :required="required">
      {{ label }}
    </BaseLabel>

    <div :class="groupClass" role="radiogroup" :aria-invalid="Boolean(error)">
      <label
        v-for="option in options"
        :key="String(option.value)"
        class="base-radio-option"
        :class="{
          'is-selected': model === option.value,
          'is-disabled': disabled || option.disabled,
        }"
      >
        <input
          :id="id ? `${id}-${String(option.value)}` : undefined"
          v-model="model"
          class="base-radio-input"
          :disabled="disabled || option.disabled"
          :name="groupName"
          type="radio"
          :value="option.value"
        />
        <span class="base-radio-indicator" aria-hidden="true">
          <span class="base-radio-dot" />
        </span>
        <span class="base-radio-copy">
          <span class="base-radio-label">{{ option.label }}</span>
          <span v-if="option.description" class="base-radio-description">
            {{ option.description }}
          </span>
        </span>
      </label>
    </div>

    <p v-if="error" class="base-radio-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.base-radio-group {
  display: flex;
  flex-direction: column;
}

.base-radio-group-options {
  display: grid;
  gap: 0.75rem;
}

.is-row {
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
}

.is-column {
  grid-template-columns: minmax(0, 1fr);
}

.base-radio-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  min-height: 2.75rem;
  padding: 0.75rem 0.875rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
  cursor: pointer;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.density-compact {
  gap: 0.5rem;
}

.density-compact .base-radio-option {
  gap: 0.625rem;
  min-height: 2.35rem;
  padding: 0.625rem 0.75rem;
}

.density-compact .base-radio-label {
  font-size: var(--text-xs);
}

.density-compact .base-radio-description {
  font-size: 11px;
}

.base-radio-option:hover {
  border-color: hsl(var(--ring) / 0.55);
}

.base-radio-option:has(.base-radio-input:focus-visible) {
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 3px hsl(var(--ring) / 0.16);
}

.base-radio-option.is-selected {
  border-color: hsl(var(--ring));
  background: hsl(var(--secondary) / 0.24);
}

.base-radio-option.is-disabled {
  cursor: not-allowed;
  background: hsl(var(--muted));
  opacity: 0.72;
}

.base-radio-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.base-radio-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
  margin-top: 0.125rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 9999px;
  background: hsl(var(--card));
  flex-shrink: 0;
}

.base-radio-dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: transparent;
  transition: background-color 0.2s ease;
}

.base-radio-option.is-selected .base-radio-indicator {
  border-color: hsl(var(--ring));
}

.base-radio-option.is-selected .base-radio-dot {
  background: hsl(var(--ring));
}

.base-radio-copy {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
}

.base-radio-label {
  color: hsl(var(--foreground));
  font-size: var(--text-sm);
  font-weight: 600;
}

.base-radio-description {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-xs);
}

.base-radio-error {
  margin-top: 0.375rem;
  color: hsl(var(--destructive));
  font-size: var(--text-xs);
}
</style>
