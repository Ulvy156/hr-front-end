<script setup lang="ts">
import BaseCard from '@/components/ui/BaseCard.vue'

import type { AdminDashboardSummary } from '../interface/dashboard.interface'

defineProps<{
  summary: AdminDashboardSummary
}>()
</script>

<template>
  <BaseCard class="admin-card">
    <div class="admin-card-body">
      <div>
        <p class="admin-label">User Summary</p>
        <p class="admin-value">{{ summary.totalUsers }}</p>
      </div>

      <div class="admin-role-list">
        <div
          v-for="roleItem in summary.usersByRole"
          :key="roleItem.role"
          class="admin-role-item"
        >
          <span>{{ roleItem.role }}</span>
          <strong>{{ roleItem.totalUsers }}</strong>
        </div>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.admin-card {
  min-height: 10rem;
}

.admin-card-body {
  display: flex;
  height: 100%;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.25rem;
}

.admin-label {
  color: hsl(var(--muted-foreground));
}

.admin-value {
  margin-top: 0.25rem;
  font-size: clamp(1.6rem, 2.5vw, 2.1rem);
  font-weight: 800;
  line-height: 1.1;
  color: hsl(var(--foreground));
}

.admin-role-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.admin-role-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  color: hsl(var(--foreground));
}
</style>
