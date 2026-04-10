<script setup lang="ts">
import type { InputInstance } from 'element-plus'

import BaseLabel from './BaseLabel.vue'

const model = defineModel<string>({ default: '' })
const inputElement = ref<InputInstance | null>(null)

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
    autofocus?: boolean
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
    autofocus: false,
  },
)

const slots = useSlots()

const inputClass = computed(() => [
  'base-input-control',
  {
    'has-error': Boolean(props.error),
    'has-suffix': Boolean(slots.suffix),
  },
])

onMounted(() => {
  if (props.autofocus) {
    inputElement.value?.focus()
  }
})
</script>

<template>
  <div class="base-input">
    <BaseLabel v-if="label" :for-id="id" :required="required">
      {{ label }}
    </BaseLabel>

    <div class="base-input-field">
      <ElInput
        :id="id"
        ref="inputElement"
        v-model="model"
        :autocomplete="autocomplete"
        :autofocus="autofocus"
        :class="inputClass"
        :disabled="disabled"
        :name="name"
        :placeholder="placeholder"
        :required="required"
        :type="type"
        :validate-event="false"
      >
        <template v-if="$slots.suffix" #suffix>
          <div class="base-input-suffix">
            <slot name="suffix" />
          </div>
        </template>
      </ElInput>
    </div>

    <p v-if="error" class="base-input-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.base-input {
  display: flex;
  flex-direction: column;
}

.base-input-field {
  position: relative;
}

.base-input-control {
  width: 100%;
}

.base-input-control:deep(.el-input__wrapper) {
  /* min-height: 3rem; */
  padding: 0.85rem 1rem;
  border-radius: var(--radius);
  background: hsl(var(--card));
  box-shadow: 0 0 0 1px hsl(var(--border-gray)) inset;
  transition:
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.base-input-control:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px hsl(var(--border-gray)) inset;
}

.base-input-control:deep(.el-input__inner) {
  color: hsl(var(--foreground));
  font: inherit;
}

.base-input-control:deep(.el-input__inner::placeholder) {
  color: hsl(var(--muted-foreground));
}

.base-input-control:deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px hsl(var(--ring)) inset,
    0 0 0 3px hsl(var(--ring) / 0.16);
}

.base-input:deep(.el-input.is-disabled .el-input__wrapper) {
  background: hsl(var(--muted));
  box-shadow: 0 0 0 1px hsl(var(--border-gray)) inset;
}

.base-input-control:deep(.el-input__suffix) {
  color: hsl(var(--muted-foreground));
}

.has-suffix:deep(.el-input__wrapper) {
  padding-right: 0.75rem;
}

.has-error:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px hsl(var(--destructive)) inset;
}

.has-error:deep(.el-input__wrapper:hover),
.has-error:deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px hsl(var(--destructive)) inset,
    0 0 0 3px hsl(var(--destructive) / 0.12);
}

.base-input-suffix {
  display: inline-flex;
  align-items: center;
}

.base-input-error {
  margin-top: 0.375rem;
  color: hsl(var(--destructive));
  font-size: var(--text-xs);
}
</style>
