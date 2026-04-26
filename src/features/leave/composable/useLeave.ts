import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { useAuth } from '@/features/auth/composable/useAuth'
import { usePermission } from '@/features/auth/composable/usePermission'
import { PERMISSIONS } from '@/constants/permissions'

import { useLeaveStore } from '../store/leaveStore'
import {
  canCreateOwnLeaveRequest,
  canViewReviewQueue,
} from '../utils/leave'

export const useLeave = () => {
  const leaveStore = useLeaveStore()
  const { canUseEmployeeSelfService, currentUser, employee } = useAuth()
  const { hasAnyPermission, hasPermission } = usePermission()
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

  const canCreateRequests = computed(() => canCreateOwnLeaveRequest(currentUser.value))
  const canViewSelfLeaveBalances = computed(() =>
    canUseEmployeeSelfService.value &&
    hasPermission(PERMISSIONS.LEAVE_BALANCE_VIEW_SELF),
  )
  const canViewSelfLeaveRequests = computed(() =>
    canUseEmployeeSelfService.value &&
    hasPermission(PERMISSIONS.LEAVE_REQUEST_VIEW_SELF),
  )
  const canReviewRequests = computed(() => canViewReviewQueue(currentUser.value))
  const canViewAssignedReviewQueue = computed(() =>
    hasPermission(PERMISSIONS.LEAVE_REQUEST_VIEW_ASSIGNED),
  )
  const canViewAnyReviewQueue = computed(() =>
    hasPermission(PERMISSIONS.LEAVE_REQUEST_VIEW_ANY),
  )
  const canManagerApproveRequests = computed(() =>
    hasPermission(PERMISSIONS.LEAVE_APPROVE_MANAGER),
  )
  const canHrApproveRequests = computed(() =>
    hasPermission(PERMISSIONS.LEAVE_APPROVE_HR),
  )
  const canViewLeaveWorkspace = computed(() =>
    hasAnyPermission([
      PERMISSIONS.LEAVE_APPROVE_MANAGER,
      PERMISSIONS.LEAVE_APPROVE_HR,
      PERMISSIONS.LEAVE_REQUEST_CREATE,
      PERMISSIONS.LEAVE_REQUEST_VIEW_SELF,
      PERMISSIONS.LEAVE_REQUEST_VIEW_ASSIGNED,
      PERMISSIONS.LEAVE_REQUEST_VIEW_ANY,
      PERMISSIONS.LEAVE_BALANCE_VIEW_SELF,
    ]),
  )

  return {
    currentUser,
    employee,
    canUseEmployeeSelfService,
    canCreateRequests,
    canViewSelfLeaveBalances,
    canViewSelfLeaveRequests,
    canReviewRequests,
    canViewAssignedReviewQueue,
    canViewAnyReviewQueue,
    canManagerApproveRequests,
    canHrApproveRequests,
    canViewLeaveWorkspace,
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
