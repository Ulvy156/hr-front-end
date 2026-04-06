<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import BaseCard from '@/components/ui/BaseCard.vue'

type IssueTone = 'warning' | 'danger'

export type DashboardIssueCardItem = {
  key: string
  label: string
  value: string
  helper?: string
  tone: IssueTone
}

defineProps<{
  items: DashboardIssueCardItem[]
  activeKey?: string | null
}>()

const emit = defineEmits<{
  select: [key: string]
}>()
</script>

<template>
  <section class="issue-section">
    <div class="issue-section-header">
      <div>
        <h3 class="issue-title">Attendance Issues</h3>
        <p class="issue-subtitle">Review items that need attention and open the matching records.</p>
      </div>
    </div>

    <div class="issue-grid">
      <button
        v-for="item in items"
        :key="item.key"
        :class="[
          item.tone === 'danger' ? 'issue-card-danger' : 'issue-card-warning',
          activeKey === item.key ? 'issue-card-active' : '',
        ]"
        class="issue-card-button"
        type="button"
        @click="emit('select', item.key)"
      >
        <BaseCard class="issue-card">
          <div class="issue-card-body">
            <div class="issue-card-top">
              <span class="issue-icon">
                <AlertTriangle :size="16" />
              </span>
              <span :class="item.tone === 'danger' ? 'issue-pill-danger' : 'issue-pill-warning'" class="issue-pill">
                {{ item.tone === 'danger' ? 'high' : 'medium' }}
              </span>
            </div>
            <div>
              <p class="issue-label">{{ item.label }}</p>
              <p class="issue-value">{{ item.value }}</p>
              <p v-if="item.helper" class="issue-helper">{{ item.helper }}</p>
            </div>
          </div>
        </BaseCard>
      </button>
    </div>
  </section>
</template>

<style scoped>
.issue-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.issue-title {
  color: hsl(var(--foreground));
}

.issue-subtitle {
  margin-top: 0.25rem;
  color: hsl(var(--muted-foreground));
}

.issue-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(13rem, 1fr));
  gap: 1rem;
}

.issue-card-button {
  padding: 0;
  border: 0;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.issue-card-button:focus-visible {
  outline: 2px solid hsl(var(--ring));
  outline-offset: 4px;
  border-radius: var(--radius);
}

.issue-card {
  min-height: 8.5rem;
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease,
    border-color 0.2s ease;
}

.issue-card-button:hover .issue-card {
  transform: translateY(-2px);
}

.issue-card-active .issue-card {
  border-color: hsl(var(--primary));
  box-shadow: var(--shadow-card-hover);
}

.issue-card-warning .issue-card {
  background: linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--warning) / 0.06) 100%);
}

.issue-card-danger .issue-card {
  background: linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--destructive) / 0.06) 100%);
  border-color: hsl(var(--destructive) / 0.2);
}

.issue-card-body {
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
}

.issue-card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.issue-icon {
  display: inline-flex;
  width: 2rem;
  height: 2rem;
  align-items: center;
  justify-content: center;
  border-radius: 9999px;
  background: hsl(var(--secondary));
  color: hsl(var(--muted-foreground));
}

.issue-card-danger .issue-icon {
  background: hsl(var(--destructive) / 0.14);
  color: hsl(var(--destructive));
}

.issue-card-warning .issue-icon {
  background: hsl(var(--warning) / 0.16);
  color: hsl(var(--warning));
}

.issue-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 1.5rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: capitalize;
}

.issue-pill-warning {
  background: hsl(var(--warning) / 0.16);
  color: hsl(var(--warning));
}

.issue-pill-danger {
  background: hsl(var(--destructive) / 0.14);
  color: hsl(var(--destructive));
}

.issue-label,
.issue-helper {
  color: hsl(var(--muted-foreground));
}

.issue-value {
  margin-top: 0.25rem;
  font-size: clamp(1.55rem, 2.2vw, 2rem);
  font-weight: 800;
  line-height: 1.1;
  color: hsl(var(--foreground));
}

.issue-card-danger .issue-value {
  color: hsl(var(--destructive));
}
</style>
