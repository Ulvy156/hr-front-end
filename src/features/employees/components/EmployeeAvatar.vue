<script setup lang="ts">
import { getEmployeeInitials } from '../utils/employee'

const props = withDefaults(
  defineProps<{
    name: string
    photoUrl?: string | null
    size?: 'sm' | 'md' | 'lg'
  }>(),
  {
    photoUrl: null,
    size: 'md',
  },
)

const sizeClass = computed(() => `size-${props.size}`)
</script>

<template>
  <div :class="['employee-avatar', sizeClass]">
    <img v-if="photoUrl" :alt="name" :src="photoUrl" class="employee-avatar-image" />
    <span v-else class="employee-avatar-fallback">
      {{ getEmployeeInitials(name) }}
    </span>
  </div>
</template>

<style scoped>
.employee-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 1.25rem;
  background: linear-gradient(135deg, hsl(var(--primary) / 0.14), hsl(var(--secondary)));
  color: hsl(var(--primary));
  font-weight: 800;
  box-shadow: inset 0 0 0 1px hsl(var(--border-gray));
}

.size-sm {
  width: 3rem;
  height: 3rem;
  border-radius: 1rem;
  font-size: 0.9rem;
}

.size-md {
  width: 4.5rem;
  height: 4.5rem;
  font-size: 1.25rem;
}

.size-lg {
  width: 6rem;
  height: 6rem;
  font-size: 1.55rem;
}

.employee-avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.employee-avatar-fallback {
  line-height: 1;
}
</style>
