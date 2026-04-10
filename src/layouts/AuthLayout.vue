<template>
  <main class="auth-layout">
    <div class="auth-layout-shell">
      <div class="auth-layout-container">
        <RouterView />
      </div>
    </div>
  </main>
</template>

<style scoped>
.auth-layout {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: var(--gradient-body);
}

.auth-layout::before,
.auth-layout::after {
  content: '';
  position: absolute;
  border-radius: 9999px;
  pointer-events: none;
  filter: blur(8px);
}

.auth-layout::before {
  top: -9rem;
  left: -7rem;
  width: 20rem;
  height: 20rem;
  background: hsl(var(--primary) / 0.08);
}

.auth-layout::after {
  right: -7rem;
  bottom: -9rem;
  width: 24rem;
  height: 24rem;
  background: hsl(var(--warning) / 0.08);
}

.auth-layout-shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.5rem;
}

.auth-layout-container {
  width: min(100%, 1120px);
}

@media (max-width: 768px) {
  .auth-layout-shell {
    padding: 1rem;
  }
}
</style>
