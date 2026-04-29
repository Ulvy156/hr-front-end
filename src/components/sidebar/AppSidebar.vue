<script setup lang="ts">
import { ChevronLeft, LogOut } from 'lucide-vue-next'
import { storeToRefs } from 'pinia'

import { getPrimaryRole } from '@/constants/roles'
import { usePermission } from '@/features/auth/composable/usePermission'
import { useAuthStore } from '@/features/auth/store/authStore'
import { hasUserEmployeePermission } from '@/features/auth/utils/permissions'
import { canUseEmployeeSelfService } from '@/features/auth/utils/userContext'

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
const { hasAllPermissions, hasAnyPermission, hasPermission } = usePermission()
const { user } = storeToRefs(authStore)

const sectionLabels = {
  main: 'Main',
  management: 'Management',
  account: 'Account',
} as const

const userName = computed(() => {
  return typeof user.value?.name === 'string' && user.value.name ? user.value.name : 'User'
})

const formatRoleName = (roleName: string) => {
  return roleName
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

const userPosition = computed(() => {
  const primaryRole = getPrimaryRole(user.value)

  if (primaryRole) {
    return formatRoleName(primaryRole)
  }

  return ''
})

const userInitials = computed(() => {
  const words = userName.value.trim().split(/\s+/).filter(Boolean).slice(0, 2)

  if (!words.length) {
    return 'U'
  }

  return words.map((word) => word.charAt(0).toUpperCase()).join('')
})

const visibleMenuItems = computed(() =>
  sidebarMenu.filter((item) => {
    if (item.employeePermission && !hasUserEmployeePermission(user.value, item.employeePermission)) {
      return false
    }

    if (item.requiresEmployeeSelfService && !canUseEmployeeSelfService(user.value)) {
      return false
    }

    if (item.permission && !hasPermission(item.permission)) {
      return false
    }

    if (item.allPermissions?.length && !hasAllPermissions(item.allPermissions)) {
      return false
    }

    if (item.anyPermissions?.length && !hasAnyPermission(item.anyPermissions)) {
      return false
    }

    return true
  }),
)

const groupedMenuItems = computed(() => {
  const groups = ['main', 'management', 'account'].map((sectionKey) => ({
    key: sectionKey,
    label: sectionLabels[sectionKey as keyof typeof sectionLabels],
    items: visibleMenuItems.value.filter((item) => item.section === sectionKey),
  }))

  return groups.filter((group) => group.items.length > 0)
})

const isActive = (item: SidebarMenuItem) => {
  if (item.path === '/') {
    return route.path === '/'
  }

  return route.path === item.path || route.path.startsWith(`${item.path}/`)
}

const handleLogout = async () => {
  await authStore.logout()
  await router.push('/login')
}
</script>

<template>
  <aside
    :class="collapsed ? 'w-24' : 'w-72'"
    class="fixed inset-y-0 left-0 z-20 flex overflow-hidden border-r border-[hsl(var(--border-gray))] bg-[hsl(var(--card))] text-[hsl(var(--foreground))] shadow-[var(--shadow-card)] transition-[width] duration-300 ease-out"
  >
    <div class="flex h-full w-full flex-col gap-5 px-4 py-5">
      <div class="flex items-center gap-3">
        <RouterLink
          to="/profile"
          :class="
            collapsed
              ? 'h-12 w-12 justify-center rounded-2xl px-0'
              : 'min-h-17 flex-1 rounded-2xl px-3 py-3'
          "
          :title="collapsed ? `${userName} ${userPosition ? `• ${userPosition}` : ''}` : undefined"
          class="flex min-w-0 items-center gap-3 border border-[hsl(var(--border-gray))] bg-[hsl(var(--secondary)/0.22)] transition hover:border-[hsl(var(--primary)/0.18)] hover:bg-[hsl(var(--secondary)/0.4)]"
        >
          <div
            v-if="!collapsed"
            class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[hsl(var(--primary))] text-sm font-semibold text-[hsl(var(--primary-foreground))]"
          >
            {{ userInitials }}
          </div>

          <div v-if="!collapsed" class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-[hsl(var(--foreground))]">
              {{ userName }}
            </p>
            <p class="truncate text-xs text-[hsl(var(--muted-foreground))]">
              {{ userPosition || 'Account' }}
            </p>
          </div>
        </RouterLink>

        <button
          type="button"
          :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          class="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[hsl(var(--border-gray))] bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))] shadow-sm transition-all duration-200 hover:border-[hsl(var(--primary)/0.18)] hover:bg-[hsl(var(--secondary)/0.55)] hover:text-[hsl(var(--foreground))]"
          @click="$emit('toggle')"
        >
          <ChevronLeft
            :size="20"
            :class="{ 'rotate-180': collapsed }"
            class="transition-transform duration-200"
          />
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-y-auto pr-1">
        <div
          v-for="group in groupedMenuItems"
          :key="group.key"
          :class="
            collapsed
              ? 'mb-4 pt-0 first:mt-0'
              : 'mb-4 border-t border-[hsl(var(--border-gray)/0.7)] pt-4 first:mt-0 first:border-t-0 first:pt-0'
          "
        >
          <p
            v-if="!collapsed"
            class="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--muted-foreground))]"
          >
            {{ group.label }}
          </p>

          <nav class="space-y-1">
            <RouterLink
              v-for="item in group.items"
              :key="item.key"
              :to="item.path"
              :title="collapsed ? item.label : undefined"
              :class="[
                collapsed ? 'justify-center px-0' : 'px-3',
                isActive(item)
                  ? 'text-[var(--nav-active-item)] shadow-sm'
                  : 'text-[hsl(var(--foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]',
              ]"
              class="group relative flex w-full min-h-[3rem] items-center rounded-2xl py-3 transition-all duration-200"
            >
              <span
                :class="
                  isActive(item)
                    ? 'bg-[hsl(var(--primary))] opacity-100'
                    : 'opacity-0 group-hover:opacity-50'
                "
                class="absolute left-0 top-2 bottom-2 w-1 rounded-r-full transition"
              />

              <span
                :class="
                  isActive(item)
                    ? 'bg-[hsl(var(--primary)/0.12)] text-[hsl(var(--primary))]'
                    : 'bg-transparent text-current'
                "
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition"
              >
                <component :is="item.icon" :size="18" class="shrink-0" />
              </span>

              <div v-if="!collapsed" class="ml-3 min-w-0 flex-1">
                <p
                  :class="isActive(item) ? 'font-semibold' : 'font-medium'"
                  class="truncate text-sm"
                >
                  {{ item.label }}
                </p>
              </div>
            </RouterLink>
          </nav>
        </div>
      </div>

      <div class="border-t border-[hsl(var(--border-gray)/0.8)] pt-4">
        <button
          type="button"
          :title="collapsed ? 'Logout' : undefined"
          :class="collapsed ? 'justify-center px-0' : 'px-3 py-3'"
          class="flex w-full items-center rounded-2xl border border-[hsl(var(--border-gray))] text-[hsl(var(--muted-foreground))] transition hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]"
          @click="handleLogout"
        >
          <span
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--secondary)/0.25)]"
          >
            <LogOut :size="18" class="shrink-0" />
          </span>

          <div v-if="!collapsed" class="ml-3 min-w-0 flex-1 text-left">
            <p class="truncate text-sm font-semibold">Logout</p>
            <p class="truncate text-xs text-[hsl(var(--muted-foreground))]">
              Sign out of your account
            </p>
          </div>
        </button>
      </div>
    </div>
  </aside>
</template>
