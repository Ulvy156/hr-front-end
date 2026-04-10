import { createRouter, createWebHistory } from 'vue-router'

import { ROLES, hasAnyRole, type Role } from '@/constants/roles'
import { sidebarMenu } from '@/components/sidebar/sidebarMenu'
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
          path: 'leave',
          name: 'leave',
          component: () => import('@/features/leave/pages/LeaveRequestsPage.vue'),
          meta: {
            requiresAuth: true,
            allowedRoles: [ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.HR, ROLES.ADMIN],
          },
        },
        {
          path: 'leave/request',
          name: 'leave-request',
          component: () => import('@/features/leave/pages/LeaveRequestPage.vue'),
          meta: {
            requiresAuth: true,
            allowedRoles: [ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.HR, ROLES.ADMIN],
          },
        },
        {
          path: 'leave/:id',
          name: 'leave-detail',
          component: () => import('@/features/leave/pages/LeaveRequestDetailPage.vue'),
          meta: {
            requiresAuth: true,
            allowedRoles: [ROLES.EMPLOYEE, ROLES.MANAGER, ROLES.HR, ROLES.ADMIN],
          },
        },
        {
          path: 'employees',
          name: 'employees',
          component: () => import('@/features/employees/pages/EmployeesListPage.vue'),
          meta: {
            requiresAuth: true,
            allowedRoles: [ROLES.ADMIN, ROLES.HR],
          },
        },
        {
          path: 'employees/create',
          name: 'employees-create',
          component: () => import('@/features/employees/pages/EmployeeFormPage.vue'),
          meta: {
            requiresAuth: true,
            allowedRoles: [ROLES.HR],
          },
        },
        {
          path: 'employees/:id',
          name: 'employees-detail',
          component: () => import('@/features/employees/pages/EmployeeDetailPage.vue'),
          meta: {
            requiresAuth: true,
            allowedRoles: [ROLES.ADMIN, ROLES.HR],
          },
        },
        {
          path: 'employees/:id/edit',
          name: 'employees-edit',
          component: () => import('@/features/employees/pages/EmployeeFormPage.vue'),
          meta: {
            requiresAuth: true,
            allowedRoles: [ROLES.HR],
          },
        },
        {
          path: 'attendance/scan',
          name: 'attendance-scan',
          component: () => import('@/features/attendance/pages/AttendanceScanPage.vue'),
          meta: {
            requiresAuth: true,
            allowedRoles: [ROLES.EMPLOYEE, ROLES.HR],
          },
        },
        {
          path: 'about',
          name: 'about',
          component: () => import('../views/AboutView.vue'),
        },
        {
          path: 'audit',
          name: 'audit',
          component: () => import('@/features/audit/pages/AuditLogsPage.vue'),
          meta: {
            requiresAuth: true,
            allowedRoles: [ROLES.ADMIN],
          },
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/features/users/pages/UsersPage.vue'),
          meta: {
            requiresAuth: true,
            allowedRoles: [ROLES.ADMIN],
          },
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/features/profile/pages/ProfilePage.vue'),
          meta: {
            requiresAuth: true,
          },
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
  const metaAllowedRoles = to.matched.flatMap((record) => {
    const allowedRoles = record.meta.allowedRoles as Role[] | undefined

    return Array.isArray(allowedRoles) ? allowedRoles : []
  })
  const sidebarAllowedRoles =
    sidebarMenu.find((item) => item.path === to.path)?.allowedRoles ?? []
  const allowedRoles = metaAllowedRoles.length ? metaAllowedRoles : sidebarAllowedRoles

  if (!authStore.initialized) {
    try {
      await authStore.fetchMe()
    } catch {
      authStore.clearAuth()
    }
  }

  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      path: '/login',
      query: {
        redirect: to.fullPath,
      },
    }
  }

  if (guestOnly && authStore.isAuthenticated) {
    return { path: '/dashboard' }
  }

  if (requiresAuth && allowedRoles.length) {
    if (!hasAnyRole(authStore.user, allowedRoles)) {
      return authStore.isAuthenticated ? { path: '/dashboard' } : { path: '/login' }
    }
  }
})

export default router
