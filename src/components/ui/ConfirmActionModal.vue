<script setup lang="ts">
import type { Component } from 'vue'

import BaseButton from './BaseButton.vue'
import BaseModal from './BaseModal.vue'

const props = withDefaults(
  defineProps<{
    open: boolean
    title: string
    message: string
    detail?: string
    statusLabel?: string
    status?: 'primary' | 'success' | 'warning' | 'danger'
    icon?: Component | null
    actionLabel: string
    actionVariant?: 'primary' | 'secondary' | 'danger' | 'ghost'
    closeLabel?: string
    loading?: boolean
  }>(),
  {
    detail: '',
    statusLabel: '',
    status: 'primary',
    icon: null,
    actionVariant: 'primary',
    closeLabel: 'Back',
    loading: false,
  },
)

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const stateClass = computed(() => `confirm-action-modal--${props.status}`)

const handleClose = () => {
  if (props.loading) {
    return
  }

  emit('close')
}

const handleConfirm = () => {
  if (props.loading) {
    return
  }

  emit('confirm')
}
</script>

<template>
  <BaseModal
    :close-on-escape="!loading"
    :close-on-overlay="!loading"
    :model-value="open"
    width="32rem"
    @close="handleClose"
    @update:model-value="(value) => !value && handleClose()"
  >
    <div class="confirm-action-modal" :class="stateClass">
      <div class="confirm-action-modal__hero">
        <div v-if="icon" class="confirm-action-modal__icon-shell" aria-hidden="true">
          <div class="confirm-action-modal__icon">
            <component :is="icon" :size="22" />
          </div>
        </div>

        <div class="confirm-action-modal__copy">
          <p v-if="statusLabel" class="confirm-action-modal__status">
            {{ statusLabel }}
          </p>
          <h2 class="confirm-action-modal__title">{{ title }}</h2>
          <p class="confirm-action-modal__message">{{ message }}</p>
          <p v-if="detail" class="confirm-action-modal__detail">{{ detail }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <BaseButton :disabled="loading" variant="secondary" @click="handleClose">
        {{ closeLabel }}
      </BaseButton>
      <BaseButton
        :disabled="loading"
        :loading="loading"
        :variant="actionVariant"
        @click="handleConfirm"
      >
        {{ actionLabel }}
      </BaseButton>
    </template>
  </BaseModal>
</template>

<style scoped>
.confirm-action-modal {
  --confirm-accent: var(--primary);

  display: flex;
  flex-direction: column;
}

.confirm-action-modal--success {
  --confirm-accent: var(--success);
}

.confirm-action-modal--warning {
  --confirm-accent: var(--warning);
}

.confirm-action-modal--danger {
  --confirm-accent: var(--destructive);
}

.confirm-action-modal__hero {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1.1rem;
  border: 1px solid hsl(var(--confirm-accent) / 0.18);
  border-radius: calc(var(--radius) - 0.1rem);
  background:
    linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.42) 100%),
    hsl(var(--card));
  box-shadow: inset 0 1px 0 hsl(0 0% 100% / 0.45);
}

.confirm-action-modal__icon-shell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3.25rem;
  height: 3.25rem;
  flex-shrink: 0;
  border-radius: 1rem;
  background: hsl(var(--confirm-accent) / 0.12);
  box-shadow: inset 0 0 0 1px hsl(var(--confirm-accent) / 0.12);
}

.confirm-action-modal__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.35rem;
  height: 2.35rem;
  border-radius: 0.85rem;
  color: hsl(var(--confirm-accent));
  background: hsl(var(--card));
  box-shadow: 0 10px 18px hsl(var(--confirm-accent) / 0.12);
}

.confirm-action-modal__copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.confirm-action-modal__status {
  color: hsl(var(--confirm-accent));
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  line-height: 1;
  text-transform: uppercase;
}

.confirm-action-modal__title {
  margin: 0;
  color: hsl(var(--foreground));
  font-size: 1.2rem;
  font-weight: 700;
  line-height: 1.25;
}

.confirm-action-modal__message,
.confirm-action-modal__detail {
  margin: 0;
}

.confirm-action-modal__message {
  color: hsl(var(--foreground));
  font-size: var(--text-md);
}

.confirm-action-modal__detail {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-sm);
}

@media (max-width: 640px) {
  .confirm-action-modal__hero {
    flex-direction: column;
  }
}
</style>
