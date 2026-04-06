<script setup lang="ts">
import type { DialogBeforeCloseFn } from 'element-plus'

defineOptions({
  inheritAttrs: false,
})

const props = withDefaults(
  defineProps<{
    open?: boolean
    modelValue?: boolean
    closeOnOverlay?: boolean
    closeOnEscape?: boolean
    title?: string
  }>(),
  {
    open: undefined,
    modelValue: undefined,
    closeOnOverlay: true,
    closeOnEscape: true,
    title: undefined,
  },
)

const emit = defineEmits<{
  close: []
  'update:modelValue': [value: boolean]
}>()

const attrs = useAttrs()

const resolvedOpen = computed(() => props.modelValue ?? props.open ?? false)
const showHeader = computed(() => Boolean(props.title || useSlots().header))
const isCloseRequested = ref(false)

const requestClose = () => {
  if (isCloseRequested.value) {
    return
  }

  isCloseRequested.value = true
  emit('update:modelValue', false)
  emit('close')

  nextTick(() => {
    isCloseRequested.value = false
  })
}

const handleBeforeClose: DialogBeforeCloseFn = () => {
  requestClose()
}

const handleUpdateModelValue = (value: boolean) => {
  if (value) {
    emit('update:modelValue', true)
    return
  }

  requestClose()
}
</script>

<template>
  <ElDialog
    v-bind="attrs"
    :append-to-body="true"
    :before-close="handleBeforeClose"
    :body-class="'base-modal-body'"
    :close-on-click-modal="closeOnOverlay"
    :close-on-press-escape="closeOnEscape"
    :footer-class="'base-modal-footer'"
    :header-class="'base-modal-header'"
    :modal-class="'base-modal-root'"
    :model-value="resolvedOpen"
    :show-close="showHeader"
    :title="!$slots.header ? title : ''"
    align-center
    class="base-modal-panel"
    destroy-on-close
    @update:model-value="handleUpdateModelValue"
  >
    <template v-if="$slots.header" #header>
      <slot name="header" />
    </template>

    <slot />

    <template v-if="$slots.footer" #footer>
      <slot name="footer" />
    </template>
  </ElDialog>
</template>

<style scoped>
:deep(.base-modal-root) {
  background: hsl(var(--foreground) / 0.32);
}

:deep(.base-modal-panel.el-dialog) {
  width: min(100%, 36rem);
  max-width: calc(100vw - 3rem);
  margin: 0;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  box-shadow: var(--shadow-card-hover);
  overflow: hidden;
}

:deep(.base-modal-header),
:deep(.base-modal-footer) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid hsl(var(--border-gray));
}

:deep(.base-modal-footer) {
  justify-content: flex-end;
  border-top: 1px solid hsl(var(--border-gray));
  border-bottom: 0;
}

:deep(.base-modal-body) {
  padding: 1.25rem;
}

:deep(.base-modal-header .el-dialog__title),
.base-modal-title {
  margin: 0;
  color: hsl(var(--foreground));
  font-size: var(--text-lg);
  font-weight: 700;
  line-height: 1.4;
}

:deep(.base-modal-panel .el-dialog__headerbtn) {
  top: 1rem;
  right: 1rem;
}

:deep(.base-modal-panel .el-dialog__close) {
  color: hsl(var(--muted-foreground));
  font-size: 1.125rem;
}

:deep(.base-modal-panel .el-dialog__headerbtn:hover .el-dialog__close) {
  color: hsl(var(--foreground));
}

@media (max-width: 768px) {
  :deep(.base-modal-panel.el-dialog) {
    max-width: calc(100vw - 1.5rem);
  }

  :deep(.base-modal-header),
  :deep(.base-modal-footer),
  :deep(.base-modal-body) {
    padding-inline: 1rem;
  }
}
</style>
