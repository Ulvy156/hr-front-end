<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    open: boolean
    closeOnOverlay?: boolean
    closeOnEscape?: boolean
    title?: string
  }>(),
  {
    closeOnOverlay: true,
    closeOnEscape: true,
    title: undefined,
  },
)

const emit = defineEmits<{
  close: []
}>()

const handleClose = () => emit('close')

const onKeydown = (event: KeyboardEvent) => {
  if (props.open && props.closeOnEscape && event.key === 'Escape') {
    handleClose()
  }
}

watch(
  () => props.open,
  (isOpen) => {
    if (typeof document === 'undefined') return
    document.body.style.overflow = isOpen ? 'hidden' : ''
  },
)

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }

  window.removeEventListener('keydown', onKeydown)
})
</script>

<template>
  <Teleport to="body">
    <transition name="modal-fade">
      <div v-if="open" class="base-modal-root">
        <button
          class="base-modal-overlay"
          type="button"
          aria-label="Close modal"
          @click="closeOnOverlay && handleClose()"
        />

        <section
          aria-modal="true"
          class="base-modal-panel"
          role="dialog"
        >
          <header v-if="$slots.header || title" class="base-modal-header">
            <slot name="header">
              <h3 class="base-modal-title">{{ title }}</h3>
            </slot>

            <button class="base-modal-close" type="button" @click="handleClose">✕</button>
          </header>

          <div class="base-modal-body">
            <slot />
          </div>

          <footer v-if="$slots.footer" class="base-modal-footer">
            <slot name="footer" />
          </footer>
        </section>
      </div>
    </transition>
  </Teleport>
</template>

<style scoped>
.base-modal-root {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.base-modal-overlay {
  position: absolute;
  inset: 0;
  border: 0;
  background: hsl(var(--foreground) / 0.32);
  transition: opacity 0.24s ease;
}

.base-modal-panel {
  position: relative;
  width: min(100%, 36rem);
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  box-shadow: var(--shadow-card-hover);
  transform-origin: center;
  transition:
    opacity 0.24s ease,
    transform 0.24s ease;
}

.base-modal-header,
.base-modal-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid hsl(var(--border-gray));
}

.base-modal-footer {
  justify-content: flex-end;
  border-top: 1px solid hsl(var(--border-gray));
  border-bottom: 0;
}

.base-modal-body {
  padding: 1.25rem;
}

.base-modal-title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 700;
}

.base-modal-close {
  border: 0;
  background: transparent;
  color: hsl(var(--muted-foreground));
  cursor: pointer;
  font: inherit;
  font-size: 1.125rem;
}

.base-modal-close:hover {
  color: hsl(var(--foreground));
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.24s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-from .base-modal-overlay,
.modal-fade-leave-to .base-modal-overlay {
  opacity: 0;
}

.modal-fade-enter-from .base-modal-panel,
.modal-fade-leave-to .base-modal-panel {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}
</style>
