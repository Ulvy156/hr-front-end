<script setup lang="ts">
import BaseLabel from './BaseLabel.vue'

export type BaseSelectOption = {
  label: string
  value: string | number
  disabled?: boolean
}

const model = defineModel<string | number | undefined>()

const props = withDefaults(
  defineProps<{
    id?: string
    name?: string
    label?: string
    placeholder?: string
    error?: string
    disabled?: boolean
    required?: boolean
    options: BaseSelectOption[]
  }>(),
  {
    id: undefined,
    name: undefined,
    label: undefined,
    placeholder: 'Select an option',
    error: '',
    disabled: false,
    required: false,
  },
)

const selectClass = computed(() => [
  'base-select-control',
  {
    'has-error': Boolean(props.error),
  },
])
</script>

<template>
  <div class="base-select">
    <BaseLabel v-if="label" :for-id="id" :required="required">
      {{ label }}
    </BaseLabel>

    <div class="select-shell">
      <select
        :id="id"
        v-model="model"
        :class="selectClass"
        :disabled="disabled"
        :name="name"
        :required="required"
      >
        <option :value="undefined" disabled>
          {{ placeholder }}
        </option>
        <option
          v-for="option in options"
          :key="String(option.value)"
          :disabled="option.disabled"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <span class="select-indicator" aria-hidden="true">▾</span>
    </div>

    <p v-if="error" class="base-select-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.base-select {
  display: flex;
  flex-direction: column;
}

.select-shell {
  position: relative;
}

.base-select-control {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.75rem 2.5rem 0.75rem 0.875rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  font: inherit;
  appearance: none;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.base-select-control:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 3px hsl(var(--ring) / 0.16);
}

.base-select-control:disabled {
  cursor: not-allowed;
  background: hsl(var(--muted));
}

.select-indicator {
  position: absolute;
  top: 50%;
  right: 0.875rem;
  transform: translateY(-50%);
  color: hsl(var(--muted-foreground));
  pointer-events: none;
}

.has-error {
  border-color: hsl(var(--destructive));
}

.base-select-error {
  margin-top: 0.375rem;
  color: hsl(var(--destructive));
  font-size: var(--text-xs);
}
</style>
