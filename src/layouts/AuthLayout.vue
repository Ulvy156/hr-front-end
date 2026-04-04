<template>
  <main class="auth-layout min-h-screen">
    <div class="flex min-h-screen items-center justify-center px-4 py-10">
      <RouterView />
    </div>
  </main>
</template>

<style scoped>
.auth-layout {
  background: var(--gradient-body);
}
</style>
