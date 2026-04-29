import type { Component } from 'vue'
import {
  ATTENDANCE_ACCESS_PERMISSIONS,
  DASHBOARD_ACCESS_PERMISSIONS,
  EMPLOYEE_ACCESS_PERMISSIONS,
  LEAVE_ACCESS_PERMISSIONS,
  OVERTIME_APPROVAL_ACCESS_PERMISSIONS,
  PAYROLL_RUN_ACCESS_PERMISSIONS,
  USER_MANAGEMENT_ALL_PERMISSIONS,
} from '@/constants/accessControl'
import { PERMISSIONS, type Permission } from '@/constants/permissions'
import {
  Banknote,
  CalendarCheck,
  CalendarClock,
  CircleUserRound,
  ClipboardCheck,
  FileText,
  History,
  LayoutDashboard,
  User,
  UserCog,
  Users,
  Wallet,
} from 'lucide-vue-next'

export type SidebarMenuItem = {
  key: string
  label: string
  path: string
  icon: Component
  section: 'main' | 'management' | 'account'
  permission?: Permission
  employeePermission?: Permission
  anyPermissions?: Permission[]
  allPermissions?: Permission[]
  requiresEmployeeSelfService?: boolean
}

export const sidebarMenu: SidebarMenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    section: 'main',
    anyPermissions: DASHBOARD_ACCESS_PERMISSIONS,
  },
  {
    key: 'attendance',
    label: 'Attendance',
    path: '/attendance',
    icon: CalendarCheck,
    section: 'main',
    anyPermissions: ATTENDANCE_ACCESS_PERMISSIONS,
  },
  {
    key: 'leave',
    label: 'Leave',
    path: '/leave',
    icon: CalendarClock,
    section: 'main',
    anyPermissions: LEAVE_ACCESS_PERMISSIONS,
  },
  {
    key: 'overtime-approvals',
    label: 'Employee Overtime Requests',
    path: '/attendance/overtime-approvals',
    icon: ClipboardCheck,
    section: 'management',
    anyPermissions: OVERTIME_APPROVAL_ACCESS_PERMISSIONS,
  },
  {
    key: 'employees',
    label: 'Employees',
    path: '/employees',
    icon: Users,
    section: 'management',
    anyPermissions: EMPLOYEE_ACCESS_PERMISSIONS,
  },
  {
    key: 'users',
    label: 'Users',
    path: '/users',
    icon: UserCog,
    section: 'management',
    allPermissions: USER_MANAGEMENT_ALL_PERMISSIONS,
  },
  {
    key: 'payroll-runs',
    label: 'Payroll Runs',
    path: '/payroll/runs',
    icon: Wallet,
    section: 'management',
    anyPermissions: PAYROLL_RUN_ACCESS_PERMISSIONS,
  },
  {
    key: 'payroll-salaries',
    label: 'Salary Setup',
    path: '/payroll/salaries',
    icon: Banknote,
    section: 'management',
    permission: PERMISSIONS.PAYROLL_SALARY_VIEW,
  },
  {
    key: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: User,
    section: 'account',
  },
  {
    key: 'payroll-my-payslips',
    label: 'My Payslips',
    path: '/payroll/my-payslips',
    icon: FileText,
    section: 'account',
    employeePermission: PERMISSIONS.PAYROLL_PAYSLIP_VIEW_OWN,
  },
  {
    key: 'overtime-my-requests',
    label: 'My Overtime Requests',
    path: '/attendance/overtime-requests',
    icon: CircleUserRound,
    section: 'account',
    employeePermission: PERMISSIONS.OVERTIME_REQUEST_VIEW_SELF,
  },
  {
    key: 'audit',
    label: 'Audit Logs',
    path: '/audit',
    icon: History,
    section: 'management',
    permission: PERMISSIONS.AUDIT_LOG_VIEW,
  },
]
