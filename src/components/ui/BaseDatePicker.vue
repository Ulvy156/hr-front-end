<script setup lang="ts">
import BaseLabel from './BaseLabel.vue'

export type BaseDatePickerType = 'date' | 'daterange' | 'datetime' | 'month'

export type BaseDatePickerShortcut = {
  text: string
  value: Date | string | [Date, Date] | [string, string] | (() => Date | [Date, Date])
}

type DatePickerValue = string | number | Date | null | undefined | [string, string] | [Date, Date]
type DisabledDateHandler = (date: Date) => boolean

const props = withDefaults(
  defineProps<{
    modelValue?: DatePickerValue
    label?: string
    required?: boolean
    disabledDate?: DisabledDateHandler
    type?: BaseDatePickerType
    placeholder?: string
    startPlaceholder?: string
    endPlaceholder?: string
    format?: string
    valueFormat?: string
    clearable?: boolean
    disabled?: boolean
    size?: 'small' | 'default' | 'large'
    shortcuts?: BaseDatePickerShortcut[]
  }>(),
  {
    modelValue: undefined,
    label: undefined,
    required: false,
    disabledDate: undefined,
    type: 'date',
    placeholder: 'Select date',
    startPlaceholder: 'Start date',
    endPlaceholder: 'End date',
    format: undefined,
    valueFormat: undefined,
    clearable: true,
    disabled: false,
    size: 'default',
    shortcuts: () => [],
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: DatePickerValue]
  change: [value: DatePickerValue]
}>()

const normalizedValue = computed(() => props.modelValue ?? null)

const handleUpdate = (value: DatePickerValue) => {
  const nextValue = value ?? null
  emit('update:modelValue', nextValue)
}

const handleChange = (value: DatePickerValue) => {
  emit('change', value ?? null)
}
</script>

<template>
  <div class="base-date-picker">
    <BaseLabel v-if="label" :required="required">
      {{ label }}
    </BaseLabel>

    <ElDatePicker
      :clearable="clearable"
      :disabled="disabled"
      :disabled-date="disabledDate"
      :end-placeholder="endPlaceholder"
      :format="format"
      :model-value="normalizedValue"
      :placeholder="placeholder"
      :shortcuts="shortcuts"
      :size="size"
      :start-placeholder="startPlaceholder"
      :type="type"
      :value-format="valueFormat"
      class="base-date-picker-control"
      @change="handleChange"
      @update:model-value="handleUpdate"
    />
  </div>
</template>

<style scoped>
.base-date-picker {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.base-date-picker-control {
  width: 100%;
}

.base-date-picker:deep(.el-input__wrapper) {
  min-height: 2.75rem;
  border-radius: var(--radius);
  background: hsl(var(--card));
  box-shadow: 0 0 0 1px hsl(var(--border-gray)) inset;
  transition:
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.base-date-picker:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px hsl(var(--border-gray)) inset;
}

.base-date-picker:deep(.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 1px hsl(var(--ring)) inset,
    0 0 0 3px hsl(var(--ring) / 0.16);
}

.base-date-picker:deep(.el-input__inner) {
  color: hsl(var(--foreground));
}

.base-date-picker:deep(.el-input__inner::placeholder) {
  color: hsl(var(--muted-foreground));
}

.base-date-picker:deep(.el-input.is-disabled .el-input__wrapper) {
  background: hsl(var(--muted));
  box-shadow: 0 0 0 1px hsl(var(--border-gray)) inset;
}

.base-date-picker:deep(.el-range-editor.el-input__wrapper) {
  width: 100%;
  padding-inline: 0.875rem;
}

.base-date-picker:deep(.el-range-input) {
  color: hsl(var(--foreground));
}

.base-date-picker:deep(.el-range-input::placeholder) {
  color: hsl(var(--muted-foreground));
}

.base-date-picker:deep(.el-input__prefix),
.base-date-picker:deep(.el-input__suffix),
.base-date-picker:deep(.el-range__icon),
.base-date-picker:deep(.el-range__close-icon) {
  color: hsl(var(--muted-foreground));
}
</style>
