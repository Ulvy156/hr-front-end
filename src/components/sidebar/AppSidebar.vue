<script setup lang="ts">
import { ChevronLeft, LogOut } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

import { useAuthStore } from '@/features/auth/store/authStore'

import { sidebarMenu, type SidebarMenuItem } from './sidebarMenu'

defineProps<{
  collapsed: boolean
}>()

defineEmits<{
  toggle: []
}>()

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const { user } = storeToRefs(authStore)

const userName = computed(() => {
  return typeof user.value?.name === 'string' && user.value.name
    ? user.value.name
    : 'User'
})

const formatRoleName = (roleName: string) => {
  return roleName
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const userPosition = computed(() => {
  const primaryRole = user.value?.roles?.[0]

  if (primaryRole?.name) {
    return formatRoleName(primaryRole.name)
  }

  return ''
})

const isActive = (item: SidebarMenuItem) => {
  if (item.path === '/') {
    return route.path === '/'
  }

  return route.path === item.path || route.path.startsWith(`${item.path}/`)
}

const handleLogout = async () => {
  authStore.clearAuth()
  await router.push('/login')
}
</script>

<template>
  <aside
    :class="collapsed ? 'w-20' : 'w-72'"
    class="app-sidebar fixed inset-y-0 left-0 z-20 flex transition-[width] duration-300 ease-out"
  >
    <div class="flex h-full w-full flex-col px-4 py-5">
      <div class="mb-8 flex items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <div v-if="!collapsed" class="sidebar-brand-badge flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-sm font-semibold">
            AEU
          </div>
          <div v-if="!collapsed" class="min-w-0">
            <p class="sidebar-heading truncate text-sm font-semibold">{{ userName }}</p>
            <p class="sidebar-muted truncate text-xs">{{ userPosition }}</p>
          </div>
        </div>

        <button
          type="button"
          class="sidebar-toggle flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition"
          @click="$emit('toggle')"
        >
          <ChevronLeft :size="20" :class="{ 'is-collapsed': collapsed }" class="sidebar-toggle-icon" />
        </button>
      </div>

      <nav class="space-y-2">
        <RouterLink
          v-for="item in sidebarMenu"
          :key="item.key"
          :class="isActive(item) ? 'sidebar-link-active' : 'sidebar-link-idle'"
          :to="item.path"
          class="sidebar-link flex items-center rounded-2xl px-4 py-3 transition"
        >
          <component :is="item.icon" :size="20" class="sidebar-icon shrink-0" />
          <span v-if="!collapsed" class="ml-3 truncate text-sm font-medium">
            {{ item.label }}
          </span>
        </RouterLink>
      </nav>

      <button
        type="button"
        class="sidebar-logout mt-auto flex items-center rounded-2xl px-4 py-3 transition"
        @click="handleLogout"
      >
        <LogOut :size="20" class="sidebar-icon shrink-0" />
        <span v-if="!collapsed" class="ml-3 truncate text-sm font-medium">
          Logout
        </span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
.app-sidebar {
  border-right: 1px solid hsl(var(--border-gray));
  background: hsl(var(--card));
  color: hsl(var(--foreground));
  box-shadow: var(--shadow-card);
}

.sidebar-brand-badge {
  background: hsl(var(--primary));
  color: hsl(var(--primary-foreground));
}

.sidebar-heading {
  color: hsl(var(--foreground));
}

.sidebar-muted {
  color: hsl(var(--muted-foreground));
}

.sidebar-toggle {
  border: 1px solid hsl(var(--border-gray));
  background: transparent;
  color: hsl(var(--muted-foreground));
}

.sidebar-toggle:hover {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
}

.sidebar-toggle-icon {
  transition: transform 0.25s ease;
}

.sidebar-toggle-icon.is-collapsed {
  transform: rotate(180deg);
}

.sidebar-link {
  color: hsl(var(--foreground));
}

.sidebar-link-idle:hover {
  background: hsl(var(--muted));
  color: hsl(var(--foreground));
}

.sidebar-link-active {
  background: var(--nav-active);
  color: var(--nav-active-item);
}

.sidebar-logout {
  margin-top: auto;
  border: 1px solid hsl(var(--border-gray));
  color: hsl(var(--foreground));
}

.sidebar-logout:hover {
  background: hsl(var(--muted));
}

.sidebar-icon {
  color: currentColor;
}
</style>
