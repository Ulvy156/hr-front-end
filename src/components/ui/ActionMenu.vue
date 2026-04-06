<script setup lang="ts">
import type { Component } from 'vue'

import { MoreVertical } from 'lucide-vue-next'

export type ActionMenuItem = {
  key: string
  label: string
  icon?: Component
  tone?: 'primary' | 'warning' | 'danger'
  disabled?: boolean
}

const props = defineProps<{
  items: ActionMenuItem[]
  ariaLabel?: string
}>()

const emit = defineEmits<{
  select: [key: string]
}>()

const handleCommand = (command: string | number | object) => {
  if (typeof command === 'string') {
    emit('select', command)
  }
}
</script>

<template>
  <ElDropdown
    placement="bottom-end"
    trigger="click"
    @command="handleCommand"
  >
    <button
      :aria-label="ariaLabel || 'Open actions menu'"
      class="action-menu-trigger"
      type="button"
    >
      <MoreVertical :size="16" />
    </button>

    <template #dropdown>
      <ElDropdownMenu class="action-menu-dropdown">
        <ElDropdownItem
          v-for="item in props.items"
          :key="item.key"
          :command="item.key"
          :disabled="item.disabled"
          :class="[
            'action-menu-item',
            item.tone ? `action-menu-item-${item.tone}` : 'action-menu-item-default',
          ]"
        >
          <component :is="item.icon" v-if="item.icon" :size="16" />
          {{ item.label }}
        </ElDropdownItem>
      </ElDropdownMenu>
    </template>
  </ElDropdown>
</template>

<style scoped>
.action-menu-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.5rem;
  height: 2.5rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 999px;
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease,
    transform 0.16s ease;
}

.action-menu-trigger:hover {
  background: hsl(var(--secondary));
  border-color: hsl(var(--muted-foreground) / 0.24);
  box-shadow: 0 8px 18px hsl(var(--foreground) / 0.06);
  transform: translateY(-1px);
}

.action-menu-trigger:active {
  background: hsl(220 14% 92%);
  transform: scale(0.985);
}

.action-menu-trigger:focus-visible {
  outline: none;
  box-shadow:
    0 0 0 3px hsl(var(--ring) / 0.18),
    0 4px 14px hsl(var(--foreground) / 0.08);
}

:global(.el-dropdown-menu__item.action-menu-item) {
  display: grid;
  grid-template-columns: 1rem minmax(0, 1fr);
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-weight: 600;
}

:global(.el-dropdown-menu.action-menu-dropdown) {
  display: grid;
  grid-template-columns: 1fr;
}

:global(.el-dropdown-menu__item.action-menu-item-default) {
  color: var(--el-color-primary);
}

:global(.el-dropdown-menu__item.action-menu-item-default:not(.is-disabled):focus) {
  background: color-mix(in srgb, var(--el-color-primary) 10%, white);
  color: var(--el-color-primary-dark-2);
}

:global(.el-dropdown-menu__item.action-menu-item-primary) {
  color: var(--el-color-primary);
}

:global(.el-dropdown-menu__item.action-menu-item-primary:not(.is-disabled):focus) {
  background: color-mix(in srgb, var(--el-color-primary) 10%, white);
  color: var(--el-color-primary-dark-2);
}

:global(.el-dropdown-menu__item.action-menu-item-warning) {
  color: var(--el-color-warning);
}

:global(.el-dropdown-menu__item.action-menu-item-warning:not(.is-disabled):focus) {
  background: color-mix(in srgb, var(--el-color-warning) 12%, white);
  color: var(--el-color-warning-dark-2);
}

:global(.el-dropdown-menu__item.action-menu-item-danger) {
  color: hsl(var(--destructive));
}

:global(.el-dropdown-menu__item.action-menu-item-danger:not(.is-disabled):focus) {
  background: hsl(var(--destructive) / 0.08);
  color: hsl(var(--destructive));
}

:global(.el-dropdown-menu__item.action-menu-item.is-disabled) {
  cursor: not-allowed;
  opacity: 0.56;
}
</style>
