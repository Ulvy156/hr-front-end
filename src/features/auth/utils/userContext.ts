import { getPrimaryRole } from '@/constants/roles'

import type { AuthUser } from '../interface/auth.interface'

export const hasEmployeeContext = (user: AuthUser | null | undefined) => {
  return Boolean(user?.employee?.id)
}

export const getAuthUserPrimaryRole = (user: AuthUser | null | undefined) => {
  return getPrimaryRole(user)
}

export const canUseEmployeeSelfService = (user: AuthUser | null | undefined) => {
  return hasEmployeeContext(user)
}
