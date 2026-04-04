<script setup lang="ts">
import type { Component } from 'vue'

import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseCard from '@/components/ui/BaseCard.vue'

type SummaryBadgeVariant = 'default' | 'success' | 'warning' | 'danger'
type SummaryCardTone = 'primary' | 'secondary'

export type DashboardSummaryCardItem = {
  key: string
  label: string
  value: string
  helper?: string
  badge?: SummaryBadgeVariant
  icon?: Component
}

const props = withDefaults(
  defineProps<{
    items: DashboardSummaryCardItem[]
    tone?: SummaryCardTone
  }>(),
  {
    tone: 'primary',
  },
)
</script>

<template>
  <section :class="props.tone === 'primary' ? 'summary-grid-primary' : 'summary-grid-secondary'">
    <BaseCard
      v-for="item in items"
      :key="item.key"
      :class="props.tone === 'primary' ? 'summary-card-primary' : 'summary-card-secondary'"
    >
      <div class="summary-card-body">
        <div class="summary-card-header">
          <p class="summary-label">{{ item.label }}</p>
          <div class="summary-card-meta">
            <BaseBadge v-if="item.badge" :variant="item.badge">
              {{ item.value }}
            </BaseBadge>
            <span v-if="item.icon" class="summary-icon-shell">
              <component :is="item.icon" :size="16" class="summary-icon" />
            </span>
          </div>
        </div>

        <p :class="props.tone === 'primary' ? 'summary-value summary-value-primary' : 'summary-value summary-value-secondary'">
          {{ item.value }}
        </p>
        <p v-if="item.helper" class="summary-helper">{{ item.helper }}</p>
      </div>
    </BaseCard>
  </section>
</template>

<style scoped>
.summary-grid-primary,
.summary-grid-secondary {
  display: grid;
  gap: 1rem;
}

.summary-grid-primary {
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
}

.summary-grid-secondary {
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
}

.summary-card-primary {
  min-height: 10.5rem;
  background: linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.28) 100%);
  box-shadow: var(--shadow-card-hover);
}

.summary-card-secondary {
  min-height: 7.75rem;
}

.summary-card-body {
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  padding: 1.25rem;
}

.summary-card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.summary-card-meta {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-label {
  color: hsl(var(--muted-foreground));
  font-weight: 600;
}

.summary-icon-shell {
  display: inline-flex;
  width: 2rem;
  height: 2rem;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: hsl(var(--secondary));
}

.summary-icon {
  color: hsl(var(--muted-foreground));
}

.summary-value {
  font-weight: 800;
  line-height: 1.1;
  color: hsl(var(--foreground));
  letter-spacing: -0.02em;
}

.summary-value-primary {
  font-size: clamp(1.9rem, 3vw, 2.5rem);
}

.summary-value-secondary {
  font-size: clamp(1.4rem, 2vw, 1.8rem);
}

.summary-helper {
  color: hsl(var(--muted-foreground));
}
</style>
