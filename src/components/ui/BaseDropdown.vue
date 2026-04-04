<script setup lang="ts">
import BaseLabel from './BaseLabel.vue'

export type BaseDropdownOption = {
  label: string
  value: string | number | boolean | Record<string, unknown>
  disabled?: boolean
}

type DropdownValue =
  | Array<string | number | boolean | Record<string, unknown>>
  | string
  | number
  | boolean
  | Record<string, unknown>
  | null
  | undefined

const props = withDefaults(
  defineProps<{
    modelValue?: DropdownValue
    label?: string
    options: BaseDropdownOption[]
    placeholder?: string
    clearable?: boolean
    disabled?: boolean
    size?: 'small' | 'default' | 'large'
    multiple?: boolean
    filterable?: boolean
    loading?: boolean
  }>(),
  {
    modelValue: undefined,
    label: undefined,
    placeholder: 'Select option',
    clearable: true,
    disabled: false,
    size: 'default',
    multiple: false,
    filterable: false,
    loading: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: DropdownValue]
  change: [value: DropdownValue]
}>()

const normalizedValue = computed(() => {
  if (props.multiple) {
    return Array.isArray(props.modelValue) ? props.modelValue : []
  }

  return props.modelValue ?? null
})

const handleUpdate = (value: DropdownValue) => {
  if (props.multiple) {
    emit('update:modelValue', Array.isArray(value) ? value : [])
    return
  }

  emit('update:modelValue', value ?? null)
}

const handleChange = (value: DropdownValue) => {
  if (props.multiple) {
    emit('change', Array.isArray(value) ? value : [])
    return
  }

  emit('change', value ?? null)
}
</script>

<template>
  <div class="base-dropdown">
    <BaseLabel v-if="label">
      {{ label }}
    </BaseLabel>

    <ElSelect
      :clearable="clearable"
      :disabled="disabled"
      :filterable="filterable"
      :loading="loading"
      :model-value="normalizedValue"
      :multiple="multiple"
      :placeholder="placeholder"
      :size="size"
      class="base-dropdown-control"
      @change="handleChange"
      @update:model-value="handleUpdate"
    >
      <ElOption
        v-for="option in options"
        :key="String(option.value)"
        :disabled="option.disabled"
        :label="option.label"
        :value="option.value"
      />
    </ElSelect>
  </div>
</template>

<style scoped>
.base-dropdown {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.base-dropdown-control {
  width: 100%;
}

.base-dropdown:deep(.el-select__wrapper) {
  min-height: 2.75rem;
  border-radius: var(--radius);
  background: hsl(var(--card));
  box-shadow: 0 0 0 1px hsl(var(--border-gray)) inset;
  transition:
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.base-dropdown:deep(.el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px hsl(var(--border-gray)) inset;
}

.base-dropdown:deep(.is-focused .el-select__wrapper),
.base-dropdown:deep(.el-select__wrapper.is-focused) {
  box-shadow:
    0 0 0 1px hsl(var(--ring)) inset,
    0 0 0 3px hsl(var(--ring) / 0.16);
}

.base-dropdown:deep(.el-select__placeholder),
.base-dropdown:deep(.el-select__caret),
.base-dropdown:deep(.el-select__icon) {
  color: hsl(var(--muted-foreground));
}

.base-dropdown:deep(.el-select__selected-item),
.base-dropdown:deep(.el-select__input-text) {
  color: hsl(var(--foreground));
}

.base-dropdown:deep(.el-select.is-disabled .el-select__wrapper) {
  background: hsl(var(--muted));
  box-shadow: 0 0 0 1px hsl(var(--border-gray)) inset;
}
</style>
