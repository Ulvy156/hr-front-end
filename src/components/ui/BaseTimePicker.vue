<script setup lang="ts">
import BaseLabel from './BaseLabel.vue'

type TimePickerValue = string | Date | null | undefined

const props = withDefaults(
  defineProps<{
    modelValue?: TimePickerValue
    label?: string
    required?: boolean
    placeholder?: string
    format?: string
    valueFormat?: string
    clearable?: boolean
    disabled?: boolean
    size?: 'small' | 'default' | 'large'
  }>(),
  {
    modelValue: undefined,
    label: undefined,
    required: false,
    placeholder: 'Select time',
    format: 'HH:mm',
    valueFormat: 'HH:mm',
    clearable: true,
    disabled: false,
    size: 'default',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: TimePickerValue]
  change: [value: TimePickerValue]
}>()

const normalizedValue = computed(() => props.modelValue ?? null)

const handleUpdate = (value: TimePickerValue) => {
  emit('update:modelValue', value ?? null)
}

const handleChange = (value: TimePickerValue) => {
  emit('change', value ?? null)
}
</script>

<template>
  <div class="base-time-picker">
    <BaseLabel v-if="label" :required="required">
      {{ label }}
    </BaseLabel>

    <ElTimePicker
      :clearable="clearable"
      :disabled="disabled"
      :format="format"
      :model-value="normalizedValue"
      :placeholder="placeholder"
      :size="size"
      :value-format="valueFormat"
      class="base-time-picker-control"
      @change="handleChange"
      @update:model-value="handleUpdate"
    />
  </div>
</template>

<style scoped>
.base-time-picker {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.base-time-picker-control {
  width: 100%;
}

.base-time-picker:deep(.el-input__wrapper) {
  min-height: 2.75rem;
  border-radius: var(--radius);
  background: hsl(var(--card));
  box-shadow: 0 0 0 1px hsl(var(--border-gray)) inset;
  transition:
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.base-time-picker:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px hsl(var(--border-gray)) inset;
}

.base-time-picker:deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px hsl(var(--ring)) inset,
    0 0 0 3px hsl(var(--ring) / 0.16);
}

.base-time-picker:deep(.el-input__inner) {
  color: hsl(var(--foreground));
}

.base-time-picker:deep(.el-input__inner::placeholder) {
  color: hsl(var(--muted-foreground));
}

.base-time-picker:deep(.el-input.is-disabled .el-input__wrapper) {
  background: hsl(var(--muted));
  box-shadow: 0 0 0 1px hsl(var(--border-gray)) inset;
}

.base-time-picker:deep(.el-input__prefix),
.base-time-picker:deep(.el-input__suffix) {
  color: hsl(var(--muted-foreground));
}
</style>
