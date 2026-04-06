import type { Component } from 'vue'
import { ROLES, type Role } from '@/constants/roles'
import {
  CalendarCheck,
  CircleDollarSign,
  History,
  LayoutDashboard,
  User,
  UserCog,
  Users,
} from 'lucide-vue-next'

export type SidebarMenuItem = {
  key: string
  label: string
  path: string
  icon: Component
  section: 'main' | 'management' | 'account'
  allowedRoles?: Role[]
}

export const sidebarMenu: SidebarMenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    section: 'main',
  },
  {
    key: 'attendance',
    label: 'Attendance',
    path: '/attendance',
    icon: CalendarCheck,
    section: 'main',
  },
  {
    key: 'payroll',
    label: 'Payroll',
    path: '/payroll',
    icon: CircleDollarSign,
    section: 'management',
  },
  {
    key: 'employees',
    label: 'Employees',
    path: '/employees',
    icon: Users,
    section: 'management',
    allowedRoles: [ROLES.ADMIN, ROLES.HR],
  },
  {
    key: 'users',
    label: 'Users',
    path: '/users',
    icon: UserCog,
    section: 'management',
    allowedRoles: [ROLES.ADMIN],
  },
  {
    key: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: User,
    section: 'account',
  },
  {
    key: 'audit',
    label: 'Audit Logs',
    path: '/audit',
    icon: History,
    section: 'management',
    allowedRoles: [ROLES.ADMIN],
  },
]
