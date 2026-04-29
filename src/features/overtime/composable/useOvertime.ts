import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { useAuth } from '@/features/auth/composable/useAuth'
import {
  canAccessMyOvertimeRequests,
  canAccessOvertimeApprovals,
  canApproveOvertimeRequests,
  canCancelOwnOvertimeRequests,
  canCreateOwnOvertimeRequests,
} from '@/features/auth/utils/permissions'

import { useOvertimeStore } from '../store/overtimeStore'

export const useOvertime = () => {
  const overtimeStore = useOvertimeStore()
  const { currentUser, employee } = useAuth()
  const {
    myRequests,
    approvalRequests,
    selectedRequest,
    isMyRequestsLoading,
    isApprovalRequestsLoading,
    isDetailLoading,
    isSubmitting,
    isMutating,
    mutatingRequestId,
    mutationKind,
    myRequestsError,
    approvalRequestsError,
    detailError,
  } = storeToRefs(overtimeStore)
  const { myFilters, approvalFilters } = overtimeStore

  const canCreateRequests = computed(() => canCreateOwnOvertimeRequests(currentUser.value))
  const canViewMyRequests = computed(() => canAccessMyOvertimeRequests(currentUser.value))
  const canCancelOwnRequests = computed(() => canCancelOwnOvertimeRequests(currentUser.value))
  const canViewApprovalQueue = computed(() => canAccessOvertimeApprovals(currentUser.value))
  const canManagerApproveRequests = computed(() => canApproveOvertimeRequests(currentUser.value))

  return {
    currentUser,
    employee,
    canCreateRequests,
    canViewMyRequests,
    canCancelOwnRequests,
    canViewApprovalQueue,
    canManagerApproveRequests,
    myRequests,
    approvalRequests,
    selectedRequest,
    myFilters,
    approvalFilters,
    isMyRequestsLoading,
    isApprovalRequestsLoading,
    isDetailLoading,
    isSubmitting,
    isMutating,
    mutatingRequestId,
    mutationKind,
    myRequestsError,
    approvalRequestsError,
    detailError,
    normalizedParams: overtimeStore.normalizedParams,
    fetchMyRequests: overtimeStore.fetchMyRequests,
    fetchApprovalRequests: overtimeStore.fetchApprovalRequests,
    fetchOvertimeRequest: overtimeStore.fetchOvertimeRequest,
    submitOvertimeRequest: overtimeStore.submitOvertimeRequest,
    cancelOvertimeRequest: overtimeStore.cancelOvertimeRequest,
    managerApproveOvertimeRequest: overtimeStore.managerApproveOvertimeRequest,
    rejectOvertimeRequest: overtimeStore.rejectOvertimeRequest,
    resetMyFilters: overtimeStore.resetMyFilters,
    resetApprovalFilters: overtimeStore.resetApprovalFilters,
    clearSelectedRequest: overtimeStore.clearSelectedRequest,
  }
}
