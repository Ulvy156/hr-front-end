<script setup lang="ts">
import {
  ArrowRight,
  Clock3,
  KeyRound,
  ScanLine,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-vue-next'

import BaseCard from '@/components/ui/BaseCard.vue'

import type { DashboardQuickAction } from '../interface/dashboard.interface'

const props = defineProps<{
  actions: DashboardQuickAction[]
  nextAction?: string | null
  primaryActionKey?: string
}>()

const emit = defineEmits<{
  actionClick: [key: string]
}>()

const formatNextAction = (value: string) => {
  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const getActionHelper = (actionKey: string) => {
  if (actionKey === 'scan_attendance' && props.nextAction) {
    return `Next: ${formatNextAction(props.nextAction)}`
  }

  return ''
}

const getActionIcon = (actionKey: string) => {
  switch (actionKey) {
    case 'scan_attendance':
      return ScanLine
    case 'view_attendance_history':
    case 'attendance_history':
    case 'review_attendance':
    case 'correct_attendance':
      return Clock3
    case 'manage_employees':
      return Users
    case 'manage_users':
      return ShieldCheck
    case 'profile':
      return UserRound
    case 'change_password':
      return KeyRound
    default:
      return ScanLine
  }
}
</script>

<template>
  <section class="quick-actions-grid">
    <button
      v-for="action in actions"
      :key="action.key"
      type="button"
      class="quick-action-button"
      @click="emit('actionClick', action.key)"
    >
      <BaseCard
        :class="action.key === primaryActionKey ? 'quick-action-card-primary' : 'quick-action-card'"
      >
        <div class="quick-action-body">
          <span class="quick-action-icon">
            <component :is="getActionIcon(action.key)" :size="18" />
          </span>

          <div class="quick-action-content">
            <p class="quick-action-label">{{ action.label }}</p>
            <p v-if="getActionHelper(action.key)" class="quick-action-helper">
              {{ getActionHelper(action.key) }}
            </p>
          </div>

          <ArrowRight :size="16" class="quick-action-arrow" />
        </div>
      </BaseCard>
    </button>
  </section>
</template>

<style scoped>
.quick-actions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 1rem;
  width: 100%;
  min-width: 0;
}

.quick-action-button {
  display: block;
  width: 100%;
  height: 100%;
  min-width: 0;
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.quick-action-button:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 4px;
  border-radius: var(--radius);
}

.quick-action-card {
  display: block;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease,
    background-color 0.2s ease;
}

.quick-action-card-primary {
  display: block;
  height: 100%;
  min-width: 0;
  overflow: hidden;
  border-color: hsl(var(--primary));
  background: linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--primary) / 0.08) 100%);
  box-shadow: var(--shadow-card-hover);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.quick-action-button:hover .quick-action-card,
.quick-action-button:focus-visible .quick-action-card,
.quick-action-button:focus-visible .quick-action-card-primary,
.quick-action-button:hover .quick-action-card-primary {
  transform: translateY(-2px);
  box-shadow: var(--shadow-card-hover);
}

.quick-action-body {
  display: flex;
  min-height: 5.25rem;
  width: 100%;
  min-width: 0;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.875rem 1rem;
}

.quick-action-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: 9999px;
  background: hsl(var(--secondary));
  color: hsl(var(--primary));
  flex-shrink: 0;
}

.quick-action-content {
  min-width: 0;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.quick-action-arrow {
  color: hsl(var(--muted-foreground));
  flex-shrink: 0;
  align-self: center;
}

.quick-action-label {
  font-size: var(--text-sm);
  font-weight: 700;
  color: hsl(var(--foreground));
  line-height: 1.4;
  overflow-wrap: anywhere;
}

.quick-action-helper {
  font-size: var(--text-xs);
  color: hsl(var(--muted-foreground));
  line-height: 1.4;
  overflow-wrap: anywhere;
}

@media (max-width: 640px) {
  .quick-actions-grid {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
