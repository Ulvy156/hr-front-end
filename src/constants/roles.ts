export const ROLES = {
  EMPLOYEE: 'employee',
  HR: 'hr',
  ADMIN: 'admin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LIST = Object.values(ROLES) as Role[]

export const MANAGEMENT_ROLES = [ROLES.HR, ROLES.ADMIN] as const

type RoleRecord = {
  name?: string | null
}

type RoleSource = Role[] | Array<RoleRecord | string> | { roles?: Array<RoleRecord | string> } | null | undefined

export const isRole = (value: string): value is Role => {
  return ROLE_LIST.includes(value as Role)
}

export const isManagementRole = (value: Role | null | undefined) => {
  return value ? (MANAGEMENT_ROLES as readonly Role[]).includes(value) : false
}

const extractRoleValues = (source: RoleSource): Array<RoleRecord | string> => {
  if (!source) {
    return []
  }

  if (Array.isArray(source)) {
    return source
  }

  return Array.isArray(source.roles) ? source.roles : []
}

export const getRoleList = (source: RoleSource): Role[] => {
  const normalizedRoles = extractRoleValues(source)
    .map((value) => {
      if (typeof value === 'string') {
        return value
      }

      return typeof value?.name === 'string' ? value.name : null
    })
    .filter((value): value is Role => typeof value === 'string' && isRole(value))

  return Array.from(new Set(normalizedRoles))
}

export const getPrimaryRole = (
  source: RoleSource,
  priority: readonly Role[] = [ROLES.ADMIN, ROLES.HR, ROLES.EMPLOYEE],
): Role | null => {
  const roles = getRoleList(source)

  return priority.find((role) => roles.includes(role)) ?? roles[0] ?? null
}

export const hasRole = (source: RoleSource, role: Role) => {
  return getRoleList(source).includes(role)
}

export const hasAnyRole = (source: RoleSource, allowedRoles: readonly Role[]) => {
  const userRoles = getRoleList(source)

  return allowedRoles.some((role) => userRoles.includes(role))
}

export const isOneOfRoles = (value: Role | null | undefined, allowedRoles: readonly Role[]) => {
  return value ? allowedRoles.includes(value) : false
}
