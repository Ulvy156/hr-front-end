<script setup lang="ts">
import BaseLabel from './BaseLabel.vue'

const model = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    id?: string
    name?: string
    type?: string
    label?: string
    placeholder?: string
    error?: string
    disabled?: boolean
    required?: boolean
    autocomplete?: string
  }>(),
  {
    id: undefined,
    name: undefined,
    type: 'text',
    label: undefined,
    placeholder: undefined,
    error: '',
    disabled: false,
    required: false,
    autocomplete: undefined,
  },
)

const inputClass = computed(() => [
  'base-input-control',
  {
    'has-error': Boolean(props.error),
  },
])
</script>

<template>
  <div class="base-input">
    <BaseLabel v-if="label" :for-id="id" :required="required">
      {{ label }}
    </BaseLabel>

    <input
      :id="id"
      v-model="model"
      :autocomplete="autocomplete"
      :class="inputClass"
      :disabled="disabled"
      :name="name"
      :placeholder="placeholder"
      :required="required"
      :type="type"
    />

    <p v-if="error" class="base-input-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.base-input {
  display: flex;
  flex-direction: column;
}

.base-input-control {
  width: 100%;
  min-height: 2.75rem;
  padding: 0.75rem 0.875rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  font: inherit;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.base-input-control::placeholder {
  color: hsl(var(--muted-foreground));
}

.base-input-control:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 3px hsl(var(--ring) / 0.16);
}

.base-input-control:disabled {
  cursor: not-allowed;
  background: hsl(var(--muted));
}

.has-error {
  border-color: hsl(var(--destructive));
}

.base-input-error {
  margin-top: 0.375rem;
  color: hsl(var(--destructive));
  font-size: var(--text-xs);
}
</style>
