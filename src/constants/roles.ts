export const ROLES = {
  EMPLOYEE: 'employee',
  HR: 'hr',
  ADMIN: 'admin',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LIST = Object.values(ROLES) as Role[]

export const MANAGEMENT_ROLES = [ROLES.HR, ROLES.ADMIN] as const

export const isRole = (value: string): value is Role => {
  return ROLE_LIST.includes(value as Role)
}

export const isManagementRole = (value: Role | null | undefined) => {
  return value === ROLES.HR || value === ROLES.ADMIN
}
