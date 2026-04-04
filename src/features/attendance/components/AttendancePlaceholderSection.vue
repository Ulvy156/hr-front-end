<script setup lang="ts">
import BaseCard from '@/components/ui/BaseCard.vue'

defineProps<{
  title: string
  description: string
}>()
</script>

<template>
  <BaseCard class="placeholder-card">
    <div class="placeholder-body">
      <h3 class="placeholder-title">{{ title }}</h3>
      <p class="placeholder-text">{{ description }}</p>
    </div>
  </BaseCard>
</template>

<style scoped>
.placeholder-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1.25rem;
}

.placeholder-title {
  color: hsl(var(--foreground));
}

.placeholder-text {
  color: hsl(var(--muted-foreground));
}
</style>
