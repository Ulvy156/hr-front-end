import { createRouter, createWebHistory } from 'vue-router'

import { useAuthStore } from '@/features/auth/store/authStore'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: { name: 'dashboard' },
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/HomeView.vue'),
        },
        {
          path: 'attendance',
          name: 'attendance',
          component: () => import('@/features/attendance/pages/AttendancePage.vue'),
        },
        {
          path: 'about',
          name: 'about',
          component: () => import('../views/AboutView.vue'),
        },
      ],
    },
    {
      path: '/login',
      component: () => import('@/layouts/AuthLayout.vue'),
      meta: { guestOnly: true },
      children: [
        {
          path: '',
          name: 'login',
          component: () => import('@/features/auth/pages/LoginPage.vue'),
        },
      ],
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  const requiresAuth = to.matched.some((record) => record.meta.requiresAuth)
  const guestOnly = to.matched.some((record) => record.meta.guestOnly)

  if (!authStore.initialized) {
    try {
      await authStore.fetchMe()
    } catch {
      authStore.clearAuth()
    }
  }

  if (requiresAuth && !authStore.isAuthenticated) {
    return { path: '/login' }
  }

  if (guestOnly && authStore.isAuthenticated) {
    return { path: '/dashboard' }
  }
})

export default router
