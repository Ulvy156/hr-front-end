<script setup lang="ts">
import AppSidebar from '@/components/sidebar/AppSidebar.vue'

const sidebarCollapsed = ref(false)

const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
</script>

<template>
  <div class="app-layout min-h-screen">
    <AppSidebar :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />

    <main
      :class="sidebarCollapsed ? 'pl-20' : 'pl-72'"
      class="app-layout-main min-h-screen transition-[padding-left] duration-300 ease-out"
    >
      <div class="min-h-screen p-4 md:p-6">
        <div class="app-layout-panel min-h-[calc(100vh-2rem)] rounded-[28px] p-5 md:min-h-[calc(100vh-3rem)] md:p-8">
          <RouterView />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app-layout {
  background: var(--gradient-body);
}

.app-layout-panel {
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  box-shadow: var(--shadow-card);
  border: 1px solid hsl(var(--border-gray));
}
</style>
