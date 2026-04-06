<template>
  <div class="about">
    <div>
      <h1 class="about-title">About</h1>
      <p class="about-subtitle">
        Learn more about this workspace and the tools available to support daily work.
      </p>
    </div>
  </div>
</template>

<style scoped>
.about-title {
  color: hsl(var(--foreground));
}

.about-subtitle {
  margin-top: 0.25rem;
  color: hsl(var(--muted-foreground));
}

@media (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
  }
}
</style>
