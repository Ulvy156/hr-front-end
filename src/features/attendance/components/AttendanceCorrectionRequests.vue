<script setup lang="ts">
import type { CorrectionRequestListResponse } from '../interface/attendance.interface'

withDefaults(defineProps<{
  requests: CorrectionRequestListResponse | null
  embedded?: boolean
}>(), {
  embedded: false,
})
</script>

<template>
  <section :class="embedded ? 'correction-card correction-card-embedded' : 'correction-card'">
    <div class="correction-body">
      <div>
        <h3 class="correction-title">Correction Requests</h3>
        <p class="correction-text">
          {{ requests?.total ?? 0 }} request{{ (requests?.total ?? 0) === 1 ? '' : 's' }} returned by the correction requests endpoint.
        </p>
      </div>

      <div v-if="(requests?.data?.length ?? 0) > 0" class="correction-list">
        <p class="correction-text">
          Correction requests are available. Connect the detailed request item shape to render a full review table.
        </p>
      </div>

      <div v-else class="correction-empty">
        No pending correction requests were returned for the current filters.
      </div>
    </div>
  </section>
</template>

<style scoped>
.correction-card {
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
}

.correction-card-embedded {
  background: hsl(var(--secondary) / 0.35);
}

.correction-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
}

.correction-title {
  color: hsl(var(--foreground));
}

.correction-text,
.correction-empty {
  color: hsl(var(--muted-foreground));
}
</style>
