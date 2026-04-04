<template>
  <section class="base-card">
    <slot />
  </section>
</template>

<style scoped>
.base-card {
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  box-shadow: var(--shadow-card);
}
</style>
