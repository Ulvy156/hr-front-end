import { createRouter, createWebHistory } from 'vue-router'

import {
  ATTENDANCE_ACCESS_PERMISSIONS,
  DASHBOARD_ACCESS_PERMISSIONS,
  EMPLOYEE_ACCESS_PERMISSIONS,
  LEAVE_ACCESS_PERMISSIONS,
  PAYROLL_PAYSLIP_ACCESS_PERMISSIONS,
  PAYROLL_RUN_ACCESS_PERMISSIONS,
  USER_MANAGEMENT_ALL_PERMISSIONS,
} from '@/constants/accessControl'
import { PERMISSIONS } from '@/constants/permissions'
import { sidebarMenu } from '@/components/sidebar/sidebarMenu'
import {
  hasUserAllPermissions,
  hasUserAnyPermission,
  hasUserPermission,
} from '@/features/auth/utils/permissions'
import { useAuthStore } from '@/features/auth/store/authStore'
import { canUseEmployeeSelfService } from '@/features/auth/utils/userContext'

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
          meta: {
            requiresAuth: true,
            anyPermissions: DASHBOARD_ACCESS_PERMISSIONS,
          },
        },
        {
          path: 'attendance',
          name: 'attendance',
          component: () => import('@/features/attendance/pages/AttendancePage.vue'),
          meta: {
            requiresAuth: true,
            anyPermissions: ATTENDANCE_ACCESS_PERMISSIONS,
          },
        },
        {
          path: 'leave',
          name: 'leave',
          component: () => import('@/features/leave/pages/LeaveRequestsPage.vue'),
          meta: {
            requiresAuth: true,
            anyPermissions: LEAVE_ACCESS_PERMISSIONS,
          },
        },
        {
          path: 'leave/request',
          name: 'leave-request',
          component: () => import('@/features/leave/pages/LeaveRequestPage.vue'),
          meta: {
            requiresAuth: true,
            permission: PERMISSIONS.LEAVE_REQUEST_CREATE,
            requiresEmployeeSelfService: true,
            employeeSelfServiceFallback: { name: 'leave' },
          },
        },
        {
          path: 'leave/:id',
          name: 'leave-detail',
          component: () => import('@/features/leave/pages/LeaveRequestDetailPage.vue'),
          meta: {
            requiresAuth: true,
            anyPermissions: [
              PERMISSIONS.LEAVE_APPROVE_MANAGER,
              PERMISSIONS.LEAVE_APPROVE_HR,
              PERMISSIONS.LEAVE_REQUEST_VIEW_SELF,
              PERMISSIONS.LEAVE_REQUEST_VIEW_ASSIGNED,
              PERMISSIONS.LEAVE_REQUEST_VIEW_ANY,
            ],
          },
        },
        {
          path: 'employees',
          name: 'employees',
          component: () => import('@/features/employees/pages/EmployeesListPage.vue'),
          meta: {
            requiresAuth: true,
            anyPermissions: EMPLOYEE_ACCESS_PERMISSIONS,
          },
        },
        {
          path: 'employees/create',
          name: 'employees-create',
          component: () => import('@/features/employees/pages/EmployeeFormPage.vue'),
          meta: {
            requiresAuth: true,
            allPermissions: [
              PERMISSIONS.EMPLOYEE_MANAGE,
              PERMISSIONS.EMPLOYEE_USER_LINK_VIEW,
              PERMISSIONS.POSITION_VIEW,
              PERMISSIONS.LOCATION_VIEW,
            ],
          },
        },
        {
          path: 'employees/:id',
          name: 'employees-detail',
          component: () => import('@/features/employees/pages/EmployeeDetailPage.vue'),
          meta: {
            requiresAuth: true,
            anyPermissions: EMPLOYEE_ACCESS_PERMISSIONS,
          },
        },
        {
          path: 'employees/:id/edit',
          name: 'employees-edit',
          component: () => import('@/features/employees/pages/EmployeeFormPage.vue'),
          meta: {
            requiresAuth: true,
            allPermissions: [
              PERMISSIONS.EMPLOYEE_MANAGE,
              PERMISSIONS.EMPLOYEE_USER_LINK_VIEW,
              PERMISSIONS.POSITION_VIEW,
              PERMISSIONS.LOCATION_VIEW,
            ],
          },
        },
        {
          path: 'attendance/scan',
          name: 'attendance-scan',
          component: () => import('@/features/attendance/pages/AttendanceScanPage.vue'),
          meta: {
            requiresAuth: true,
            permission: PERMISSIONS.ATTENDANCE_RECORD,
            requiresEmployeeSelfService: true,
            employeeSelfServiceFallback: { name: 'attendance' },
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
            permission: PERMISSIONS.AUDIT_LOG_VIEW,
          },
        },
        {
          path: 'payroll/runs',
          name: 'payroll-runs',
          component: () => import('@/features/payroll/pages/PayrollRunsPage.vue'),
          meta: {
            requiresAuth: true,
            anyPermissions: PAYROLL_RUN_ACCESS_PERMISSIONS,
          },
        },
        {
          path: 'payroll/runs/:id',
          name: 'payroll-run-detail',
          component: () => import('@/features/payroll/pages/PayrollRunDetailPage.vue'),
          meta: {
            requiresAuth: true,
            anyPermissions: PAYROLL_RUN_ACCESS_PERMISSIONS,
          },
        },
        {
          path: 'payroll/salaries',
          name: 'payroll-salaries',
          component: () => import('@/features/payroll/pages/PayrollSalariesPage.vue'),
          meta: {
            requiresAuth: true,
            permission: PERMISSIONS.PAYROLL_SALARY_VIEW,
          },
        },
        {
          path: 'payroll/my-payslips',
          name: 'payroll-my-payslips',
          component: () => import('@/features/payroll/pages/PayrollMyPayslipsPage.vue'),
          meta: {
            requiresAuth: true,
            anyPermissions: PAYROLL_PAYSLIP_ACCESS_PERMISSIONS,
            requiresEmployeeSelfService: true,
            employeeSelfServiceFallback: { name: 'dashboard' },
          },
        },
        {
          path: 'users',
          name: 'users',
          component: () => import('@/features/users/pages/UsersPage.vue'),
          meta: {
            requiresAuth: true,
            allPermissions: USER_MANAGEMENT_ALL_PERMISSIONS,
          },
        },
        {
          path: 'users/:id/permissions',
          name: 'user-permissions',
          component: () => import('@/features/users/pages/UserPermissionsPage.vue'),
          meta: {
            requiresAuth: true,
            allPermissions: [
              PERMISSIONS.USER_VIEW,
              PERMISSIONS.ROLE_VIEW,
              PERMISSIONS.PERMISSION_VIEW,
            ],
            anyPermissions: [
              PERMISSIONS.USER_ROLE_ASSIGN,
              PERMISSIONS.USER_PERMISSION_ASSIGN,
            ],
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
  const requiredPermission = to.matched.find((record) => typeof record.meta.permission === 'string')?.meta
    .permission as string | undefined
  const anyPermissions = to.matched.flatMap((record) => {
    const metaPermissions = record.meta.anyPermissions as string[] | undefined

    return Array.isArray(metaPermissions) ? metaPermissions : []
  })
  const allPermissions = to.matched.flatMap((record) => {
    const metaPermissions = record.meta.allPermissions as string[] | undefined

    return Array.isArray(metaPermissions) ? metaPermissions : []
  })
  const requiresEmployeeSelfService = to.matched.some(
    (record) => record.meta.requiresEmployeeSelfService,
  )
  const employeeSelfServiceFallback =
    to.matched.find((record) => record.meta.employeeSelfServiceFallback)?.meta
      .employeeSelfServiceFallback
  const sidebarItem = sidebarMenu.find((item) => item.path === to.path)

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

  if (requiresAuth) {
    const canAccessByPermission =
      (!requiredPermission || hasUserPermission(authStore.user, requiredPermission)) &&
      (!anyPermissions.length || hasUserAnyPermission(authStore.user, anyPermissions)) &&
      (!allPermissions.length || hasUserAllPermissions(authStore.user, allPermissions)) &&
      (!sidebarItem?.permission || hasUserPermission(authStore.user, sidebarItem.permission)) &&
      (!sidebarItem?.anyPermissions?.length || hasUserAnyPermission(authStore.user, sidebarItem.anyPermissions)) &&
      (!sidebarItem?.allPermissions?.length || hasUserAllPermissions(authStore.user, sidebarItem.allPermissions))

    if (!canAccessByPermission) {
      return authStore.isAuthenticated ? { path: '/dashboard' } : { path: '/login' }
    }

    if (requiresEmployeeSelfService && !canUseEmployeeSelfService(authStore.user)) {
      return employeeSelfServiceFallback || { path: '/dashboard' }
    }
  }
})

export default router
