import { PERMISSIONS, type Permission } from '@/constants/permissions'

import type { AuthUser } from '../interface/auth.interface'
import { canUseEmployeeSelfService } from './userContext'

type PermissionLike = Permission | string
type PermissionSource = Pick<AuthUser, 'permissions' | 'permission_names'> | null | undefined

const extractPermissionName = (permission: unknown) => {
  if (typeof permission === 'string') {
    return permission
  }

  if (permission && typeof permission === 'object' && 'name' in permission) {
    const name = permission.name

    return typeof name === 'string' ? name : ''
  }

  return ''
}

const getGrantedPermissions = (source: PermissionSource) => {
  const permissionNames = new Set<string>()
  const rawSource = (source ?? {}) as {
    permission_names?: string[] | null
    permissions?: unknown[] | null
  }

  for (const permissionName of rawSource.permission_names ?? []) {
    if (typeof permissionName === 'string' && permissionName.trim()) {
      permissionNames.add(permissionName)
    }
  }

  for (const permission of rawSource.permissions ?? []) {
    const permissionName = extractPermissionName(permission)

    if (permissionName) {
      permissionNames.add(permissionName)
    }
  }

  return permissionNames
}

export const createPermissionHelpers = (source: PermissionSource) => {
  const grantedPermissions = getGrantedPermissions(source)

  const can = (permissionName: PermissionLike) => grantedPermissions.has(permissionName)
  const canAny = (permissionNames: PermissionLike[]) => {
    if (!permissionNames.length) {
      return true
    }

    return permissionNames.some((permissionName) => can(permissionName))
  }
  const canAll = (permissionNames: PermissionLike[]) => {
    if (!permissionNames.length) {
      return true
    }

    return permissionNames.every((permissionName) => can(permissionName))
  }

  return {
    can,
    canAny,
    canAll,
    permissionNames: Array.from(grantedPermissions),
  }
}

export const getAuthUserPermissionNames = (user: AuthUser | null | undefined) => {
  return createPermissionHelpers(user).permissionNames
}

export const hasUserPermission = (
  user: AuthUser | null | undefined,
  permissionName: PermissionLike,
) => {
  return createPermissionHelpers(user).can(permissionName)
}

export const hasUserAnyPermission = (
  user: AuthUser | null | undefined,
  permissionNames: PermissionLike[],
) => {
  return createPermissionHelpers(user).canAny(permissionNames)
}

export const hasUserAllPermissions = (
  user: AuthUser | null | undefined,
  permissionNames: PermissionLike[],
) => {
  return createPermissionHelpers(user).canAll(permissionNames)
}

export const hasUserEmployeePermission = (
  user: AuthUser | null | undefined,
  permissionName: PermissionLike,
) => {
  return canUseEmployeeSelfService(user) && hasUserPermission(user, permissionName)
}

export const canAccessMyOvertimeRequests = (user: AuthUser | null | undefined) => {
  return hasUserEmployeePermission(user, PERMISSIONS.OVERTIME_REQUEST_VIEW_SELF)
}

export const canCreateOwnOvertimeRequests = (user: AuthUser | null | undefined) => {
  return hasUserEmployeePermission(user, PERMISSIONS.OVERTIME_REQUEST_CREATE)
}

export const canCancelOwnOvertimeRequests = (user: AuthUser | null | undefined) => {
  return hasUserEmployeePermission(user, PERMISSIONS.OVERTIME_REQUEST_CANCEL)
}

export const canAccessOvertimeApprovals = (user: AuthUser | null | undefined) => {
  return hasUserAnyPermission(user, [
    PERMISSIONS.OVERTIME_APPROVE_MANAGER,
    PERMISSIONS.OVERTIME_REQUEST_VIEW_ASSIGNED,
    PERMISSIONS.OVERTIME_REQUEST_VIEW_ANY,
  ])
}

export const canApproveOvertimeRequests = (user: AuthUser | null | undefined) => {
  return hasUserPermission(user, PERMISSIONS.OVERTIME_APPROVE_MANAGER)
}
