import { storeToRefs } from 'pinia'

import type { Permission } from '@/constants/permissions'

import { useAuthStore } from '../store/authStore'
import {
  hasUserAllPermissions,
  hasUserAnyPermission,
  hasUserPermission,
} from '../utils/permissions'

export const usePermission = () => {
  const authStore = useAuthStore()
  const { permissionNames, user } = storeToRefs(authStore)

  const can = (permissionName: Permission | string) => {
    return hasUserPermission(user.value, permissionName)
  }

  const canAny = (permissions: Array<Permission | string>) => {
    return hasUserAnyPermission(user.value, permissions)
  }

  const canAll = (permissions: Array<Permission | string>) => {
    return hasUserAllPermissions(user.value, permissions)
  }

  return {
    permissions: permissionNames,
    permissionNames,
    can,
    canAny,
    canAll,
    hasPermission: can,
    hasAnyPermission: canAny,
    hasAllPermissions: canAll,
  }
}
