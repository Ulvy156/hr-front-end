import type { Component } from 'vue'
import type { Role } from '@/constants/roles'
import {
  CalendarCheck,
  CircleDollarSign,
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
  allowedRoles?: Role[]
}

export const sidebarMenu: SidebarMenuItem[] = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    key: 'attendance',
    label: 'Attendance',
    path: '/attendance',
    icon: CalendarCheck,
  },
  {
    key: 'payroll',
    label: 'Payroll',
    path: '/payroll',
    icon: CircleDollarSign,
  },
  {
    key: 'employees',
    label: 'Employees',
    path: '/employees',
    icon: Users,
  },
  {
    key: 'users',
    label: 'Users',
    path: '/users',
    icon: UserCog,
  },
  {
    key: 'profile',
    label: 'Profile',
    path: '/profile',
    icon: User,
  },
]
