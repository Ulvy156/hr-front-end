<script setup lang="ts">
import BaseLabel from './BaseLabel.vue'

const model = defineModel<string>({ default: '' })

const props = withDefaults(
  defineProps<{
    id?: string
    name?: string
    label?: string
    placeholder?: string
    error?: string
    disabled?: boolean
    required?: boolean
    rows?: number
  }>(),
  {
    id: undefined,
    name: undefined,
    label: undefined,
    placeholder: undefined,
    error: '',
    disabled: false,
    required: false,
    rows: 4,
  },
)

const textareaClass = computed(() => [
  'base-textarea-control',
  {
    'has-error': Boolean(props.error),
  },
])
</script>

<template>
  <div class="base-textarea">
    <BaseLabel v-if="label" :for-id="id" :required="required">
      {{ label }}
    </BaseLabel>

    <textarea
      :id="id"
      v-model="model"
      :class="textareaClass"
      :disabled="disabled"
      :name="name"
      :placeholder="placeholder"
      :required="required"
      :rows="rows"
    />

    <p v-if="error" class="base-textarea-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.base-textarea {
  display: flex;
  flex-direction: column;
}

.base-textarea-control {
  width: 100%;
  min-height: 6.5rem;
  padding: 0.75rem 0.875rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  font: inherit;
  resize: vertical;
  transition:
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.base-textarea-control::placeholder {
  color: hsl(var(--muted-foreground));
}

.base-textarea-control:focus {
  outline: none;
  border-color: hsl(var(--ring));
  box-shadow: 0 0 0 3px hsl(var(--ring) / 0.16);
}

.base-textarea-control:disabled {
  cursor: not-allowed;
  background: hsl(var(--muted));
}

.has-error {
  border-color: hsl(var(--destructive));
}

.base-textarea-error {
  margin-top: 0.375rem;
  color: hsl(var(--destructive));
  font-size: var(--text-xs);
}
</style>
