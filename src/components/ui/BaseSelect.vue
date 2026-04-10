<script setup lang="ts">
import BaseLabel from './BaseLabel.vue'

export type BaseSelectOption = {
  label: string
  value: string | number
  disabled?: boolean
}

defineOptions({
  inheritAttrs: false,
})

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

const attrs = useAttrs()

const normalizedValue = computed(() => model.value ?? null)

const selectClass = computed(() => [
  'base-select-control',
  {
    'has-error': Boolean(props.error),
  },
])

const handleUpdate = (value: string | number | null | undefined) => {
  model.value = value ?? undefined
}
</script>

<template>
  <div class="base-select">
    <BaseLabel v-if="label" :for-id="id" :required="required">
      {{ label }}
    </BaseLabel>

    <div class="select-shell">
      <ElSelect
        :id="id"
        v-bind="attrs"
        :model-value="normalizedValue"
        :class="selectClass"
        :disabled="disabled"
        :name="name"
        :placeholder="placeholder"
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

    <p v-if="error" class="base-select-error">{{ error }}</p>
  </div>
</template>

<style scoped>
.base-select {
  width: 100%;
  display: flex;
  flex-direction: column;
}

.select-shell {
  width: 100%;
}

.base-select-control {
  width: 100%;
}

.base-select:deep(.base-select-control .el-select__wrapper) {
  min-height: 2.75rem;
  padding: 0.375rem 0.875rem;
  border-radius: var(--radius);
  background: hsl(var(--card));
  box-shadow: 0 0 0 1px hsl(var(--border-gray)) inset;
  transition:
    box-shadow 0.2s ease,
    background-color 0.2s ease;
}

.base-select:deep(.base-select-control .el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px hsl(var(--border-gray)) inset;
}

.base-select:deep(.base-select-control.is-focus .el-select__wrapper),
.base-select:deep(.base-select-control .el-select__wrapper.is-focused) {
  box-shadow:
    0 0 0 1px hsl(var(--ring)) inset,
    0 0 0 3px hsl(var(--ring) / 0.16);
}

.base-select:deep(.base-select-control .el-select__placeholder),
.base-select:deep(.base-select-control .el-select__caret),
.base-select:deep(.base-select-control .el-select__icon) {
  color: hsl(var(--muted-foreground));
}

.base-select:deep(.base-select-control .el-select__selected-item),
.base-select:deep(.base-select-control .el-select__input-text) {
  color: hsl(var(--foreground));
}

.base-select:deep(.base-select-control.is-disabled .el-select__wrapper) {
  background: hsl(var(--muted));
  box-shadow: 0 0 0 1px hsl(var(--border-gray)) inset;
}

.base-select:deep(.base-select-control.has-error .el-select__wrapper) {
  box-shadow: 0 0 0 1px hsl(var(--destructive)) inset;
}

.base-select-error {
  margin-top: 0.375rem;
  color: hsl(var(--destructive));
  font-size: var(--text-xs);
}
</style>
