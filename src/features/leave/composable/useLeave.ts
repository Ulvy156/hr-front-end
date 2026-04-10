import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { ROLES, getPrimaryRole, hasRole, type Role } from '@/constants/roles'
import { useAuth } from '@/features/auth/composable/useAuth'

import { useLeaveStore } from '../store/leaveStore'
import {
  canCreateOwnLeaveRequest,
  canViewReviewQueue,
  hasNamedRole,
} from '../utils/leave'

export const useLeave = () => {
  const leaveStore = useLeaveStore()
  const { currentUser, employee } = useAuth()
  const {
    leaveTypes,
    leaveBalances,
    publicHolidays,
    myRequests,
    pendingRequests,
    reviewRequests,
    selectedRequest,
    myFilters,
    reviewFilters,
    isLeaveTypesLoading,
    isLeaveBalancesLoading,
    isPublicHolidaysLoading,
    isMyRequestsLoading,
    isPendingRequestsLoading,
    isReviewRequestsLoading,
    isDetailLoading,
    isSubmitting,
    isCancelling,
    isReviewing,
    leaveTypesError,
    leaveBalancesError,
    publicHolidaysError,
    myRequestsError,
    pendingRequestsError,
    reviewRequestsError,
    detailError,
  } = storeToRefs(leaveStore)

  const role = computed<Role | null>(() => getPrimaryRole(currentUser.value))
  const isEmployeeRole = computed(() => hasRole(currentUser.value, ROLES.EMPLOYEE))
  const isManagerRole = computed(() => hasNamedRole(currentUser.value, ROLES.MANAGER))
  const isHrRole = computed(() => hasRole(currentUser.value, ROLES.HR))
  const isAdminRole = computed(() => hasRole(currentUser.value, ROLES.ADMIN))
  const canCreateRequests = computed(() => canCreateOwnLeaveRequest(currentUser.value))
  const canReviewRequests = computed(() => canViewReviewQueue(currentUser.value))

  return {
    currentUser,
    employee,
    role,
    isEmployeeRole,
    isManagerRole,
    isHrRole,
    isAdminRole,
    canCreateRequests,
    canReviewRequests,
    leaveTypes,
    leaveBalances,
    publicHolidays,
    myRequests,
    pendingRequests,
    reviewRequests,
    selectedRequest,
    myFilters,
    reviewFilters,
    isLeaveTypesLoading,
    isLeaveBalancesLoading,
    isPublicHolidaysLoading,
    isMyRequestsLoading,
    isPendingRequestsLoading,
    isReviewRequestsLoading,
    isDetailLoading,
    isSubmitting,
    isCancelling,
    isReviewing,
    leaveTypesError,
    leaveBalancesError,
    publicHolidaysError,
    myRequestsError,
    pendingRequestsError,
    reviewRequestsError,
    detailError,
    normalizedParams: leaveStore.normalizedParams,
    fetchLeaveTypes: leaveStore.fetchLeaveTypes,
    fetchLeaveBalances: leaveStore.fetchLeaveBalances,
    fetchPublicHolidays: leaveStore.fetchPublicHolidays,
    fetchMyRequests: leaveStore.fetchMyRequests,
    fetchPendingRequests: leaveStore.fetchPendingRequests,
    fetchReviewRequests: leaveStore.fetchReviewRequests,
    fetchLeaveRequest: leaveStore.fetchLeaveRequest,
    submitLeaveRequest: leaveStore.submitLeaveRequest,
    cancelLeaveRequest: leaveStore.cancelLeaveRequest,
    managerReviewLeaveRequest: leaveStore.managerReviewLeaveRequest,
    hrReviewLeaveRequest: leaveStore.hrReviewLeaveRequest,
    resetMyFilters: leaveStore.resetMyFilters,
    resetReviewFilters: leaveStore.resetReviewFilters,
    clearSelectedRequest: leaveStore.clearSelectedRequest,
  }
}
