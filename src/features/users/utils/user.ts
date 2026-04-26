import axios from 'axios'

import type {
  UserAccount,
  UserFiltersState,
  UserPermission,
} from '../interface/user.interface'

type UserRequestErrorPayload = {
  message?: string
  errors?: Record<string, string[]>
}

export const createDefaultUserFilters = (): UserFiltersState => ({
  search: '',
  role_id: '',
  employee_status: '',
  employee_id: '',
  per_page: 10,
})

export const formatUserDate = (value: string | null | undefined) => {
  if (!value) return '--'

  const parsed = new Date(value)

  if (Number.isNaN(parsed.getTime())) {
    return value
  }

  return parsed.toLocaleString()
}

export const formatUserLabel = (value: string | null | undefined) => {
  if (!value) return '--'

  return value
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

type UserIdentityLike = {
  name?: string | null
  employee?: {
    full_name?: string | null
    first_name?: string | null
    last_name?: string | null
  } | null
}

export const getUserDisplayName = (
  user: UserIdentityLike | null | undefined,
  fallback = '--',
) => {
  const employeeFullName = user?.employee?.full_name?.trim()

  if (employeeFullName) {
    return employeeFullName
  }

  const employeeName = [user?.employee?.first_name, user?.employee?.last_name]
    .filter((value): value is string => typeof value === 'string' && value.trim() !== '')
    .join(' ')

  if (employeeName) {
    return employeeName
  }

  const userName = user?.name?.trim()

  return userName || fallback
}

export const USER_MANAGEMENT_LABELS = {
  access: 'Access',
  accessOptions: 'Access Options',
  extraAccess: 'Extra Access',
  totalAccess: 'Total Access',
  userType: 'User Type',
  userTypes: 'User Types',
} as const

const PERMISSION_GROUP_ORDER = [
  'dashboard',
  'user',
  'role',
  'employee',
  'attendance',
  'leave',
  'audit-log',
  'location',
  'position',
] as const

const FRIENDLY_PERMISSION_GROUP_LABELS: Record<string, string> = {
  'audit-log': 'Audit Logs',
  attendance: 'Attendance',
  dashboard: 'Dashboard',
  employee: 'Employees',
  leave: 'Leave',
  location: 'Locations',
  permission: USER_MANAGEMENT_LABELS.access,
  position: 'Positions',
  role: USER_MANAGEMENT_LABELS.userTypes,
  user: 'Users',
}

const formatPermissionToken = (value: string) => {
  return value
    .split('-')
    .filter(Boolean)
    .map((word) => {
      if (word === 'permission' || word === 'permissions') {
        return USER_MANAGEMENT_LABELS.access
      }

      if (word === 'role' || word === 'roles') {
        return USER_MANAGEMENT_LABELS.userType
      }

      if (word.length <= 3) {
        return word.toUpperCase()
      }

      return word.charAt(0).toUpperCase() + word.slice(1)
    })
    .join(' ')
}

export const formatPermissionGroupLabel = (group: string) => {
  if (!group) return 'General'

  if (group in FRIENDLY_PERMISSION_GROUP_LABELS) {
    return FRIENDLY_PERMISSION_GROUP_LABELS[group]
  }

  return formatPermissionToken(group)
}

const extractPermissionName = (permission: UserPermission | string) => {
  if (typeof permission === 'string') {
    return permission
  }

  return permission.name
}

const extractPermissionDescription = (permission: UserPermission | string) => {
  if (typeof permission === 'string') {
    return null
  }

  return typeof permission.description === 'string' && permission.description.trim()
    ? permission.description
    : null
}

export const createPermissionDescriptionMap = (
  permissions: Array<UserPermission | string> | null | undefined,
) => {
  return (permissions ?? []).reduce<Map<string, string>>((descriptions, permission) => {
    const permissionName = extractPermissionName(permission).trim()
    const permissionDescription = extractPermissionDescription(permission)

    if (permissionName && permissionDescription) {
      descriptions.set(permissionName, permissionDescription)
    }

    return descriptions
  }, new Map())
}

export const formatPermissionLabel = (
  permission: UserPermission | string | null | undefined,
  permissionDescriptions?: ReadonlyMap<string, string>,
) => {
  if (!permission) return '--'

  const permissionName = extractPermissionName(permission).trim()
  const permissionDescription = extractPermissionDescription(permission)

  if (permissionDescription) {
    return permissionDescription
  }

  if (permissionName && permissionDescriptions?.has(permissionName)) {
    return permissionDescriptions.get(permissionName) ?? permissionName
  }

  return permissionName || '--'
}

export const formatPermissionReference = (
  permission: UserPermission | string | null | undefined,
  permissionDescriptions?: ReadonlyMap<string, string>,
) => {
  if (!permission) return null

  const permissionName = extractPermissionName(permission).trim()
  const permissionLabel = formatPermissionLabel(permission, permissionDescriptions)

  if (!permissionName || permissionLabel === permissionName) {
    return null
  }

  return permissionName
}

export const normalizeUserPermissionNames = (user: Pick<UserAccount, 'permissions'> | null | undefined) => {
  const permissionNames = new Set<string>()

  for (const permission of user?.permissions ?? []) {
    const permissionName = extractPermissionName(permission)

    if (permissionName.trim()) {
      permissionNames.add(permissionName)
    }
  }

  return Array.from(permissionNames).sort((left, right) => left.localeCompare(right))
}

export type GroupedPermissionOption = {
  group: string
  groupLabel: string
  permissions: Array<{
    id: string
    name: string
    label: string
    reference: string | null
  }>
}

const buildGroupedPermissionOptions = (
  permissions: Array<UserPermission | string>,
  permissionDescriptions?: ReadonlyMap<string, string>,
) => {
  const permissionGroups = permissions.reduce<Map<string, Array<UserPermission | string>>>(
    (groups, permission) => {
      const permissionName = extractPermissionName(permission).trim()

      if (!permissionName) {
        return groups
      }

      const [group = 'general'] = permissionName.split('.')
      const currentGroup = groups.get(group) ?? []

      currentGroup.push(permission)
      groups.set(group, currentGroup)

      return groups
    },
    new Map(),
  )

  const sortedGroups = Array.from(permissionGroups.entries()).sort(([left], [right]) => {
    const leftOrder = PERMISSION_GROUP_ORDER.indexOf(left as (typeof PERMISSION_GROUP_ORDER)[number])
    const rightOrder = PERMISSION_GROUP_ORDER.indexOf(right as (typeof PERMISSION_GROUP_ORDER)[number])

    if (leftOrder !== -1 || rightOrder !== -1) {
      if (leftOrder === -1) return 1
      if (rightOrder === -1) return -1

      return leftOrder - rightOrder
    }

    return left.localeCompare(right)
  })

  return sortedGroups.map(([group, groupedPermissionNames]) => ({
    group,
    groupLabel: formatPermissionGroupLabel(group),
    permissions: [...groupedPermissionNames]
      .sort((left, right) => extractPermissionName(left).localeCompare(extractPermissionName(right)))
      .map((permission) => {
        const permissionName = extractPermissionName(permission)

        return {
          id: `permission-${permissionName}`,
          name: permissionName,
          label: formatPermissionLabel(permission, permissionDescriptions),
          reference: formatPermissionReference(permission, permissionDescriptions),
        }
      }),
  }))
}

export const groupPermissionsByDomain = (permissions: UserPermission[]) => {
  return buildGroupedPermissionOptions(permissions)
}

export const groupPermissionNamesByDomain = (
  permissionNames: string[],
  permissionDescriptions?: ReadonlyMap<string, string>,
) => {
  return buildGroupedPermissionOptions(permissionNames, permissionDescriptions)
}

export const normalizeUserAccessNames = (names: string[] | null | undefined) => {
  return Array.from(
    new Set(
      (names ?? []).filter((name): name is string => typeof name === 'string' && name.trim() !== ''),
    ),
  ).sort((left, right) => left.localeCompare(right))
}

export const getUserRequestErrorMessage = (
  error: unknown,
  fallback = 'User request failed. Please try again.',
) => {
  if (axios.isAxiosError<UserRequestErrorPayload>(error)) {
    const payload = error.response?.data
    const firstValidationMessage = payload?.errors
      ? Object.values(payload.errors).flat()[0]
      : null

    return firstValidationMessage ?? payload?.message ?? fallback
  }

  return fallback
}

export const getUserSuccessMessage = (response: unknown, fallback: string) => {
  if (
    response &&
    typeof response === 'object' &&
    'message' in response &&
    typeof response.message === 'string' &&
    response.message.trim()
  ) {
    return response.message
  }

  return fallback
}
