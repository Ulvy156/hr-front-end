import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'

import type {
  LeaveCurrentBalance,
  LeavePublicHoliday,
  LeaveRequest,
  LeaveRequestCreatePayload,
  LeaveRequestFiltersState,
  LeaveRequestHrReviewPayload,
  LeaveRequestListParams,
  LeaveRequestListResponse,
  LeaveRequestManagerReviewPayload,
  LeaveType,
} from '../interface/leave.interface'
import { leaveService } from '../services/leaveService'
import { createDefaultLeaveFilters } from '../utils/leave'

const patchCollectionRequest = (
  collection: LeaveRequestListResponse | null,
  nextRequest: LeaveRequest,
) => {
  if (!collection) {
    return collection
  }

  return {
    ...collection,
    data: collection.data.map((request) => (request.id === nextRequest.id ? nextRequest : request)),
  }
}

export const useLeaveStore = defineStore('leave', () => {
  const leaveTypes = ref<LeaveType[]>([])
  const leaveBalances = ref<LeaveCurrentBalance[]>([])
  const publicHolidays = ref<LeavePublicHoliday[]>([])
  const myRequests = ref<LeaveRequestListResponse | null>(null)
  const pendingRequests = ref<LeaveRequestListResponse | null>(null)
  const reviewRequests = ref<LeaveRequestListResponse | null>(null)
  const selectedRequest = ref<LeaveRequest | null>(null)
  const myFilters = reactive<LeaveRequestFiltersState>(createDefaultLeaveFilters())
  const reviewFilters = reactive<LeaveRequestFiltersState>(
    createDefaultLeaveFilters({
      per_page: 20,
    }),
  )
  const isLeaveTypesLoading = ref(false)
  const isLeaveBalancesLoading = ref(false)
  const isPublicHolidaysLoading = ref(false)
  const isMyRequestsLoading = ref(false)
  const isPendingRequestsLoading = ref(false)
  const isReviewRequestsLoading = ref(false)
  const isDetailLoading = ref(false)
  const isSubmitting = ref(false)
  const isCancelling = ref(false)
  const isReviewing = ref(false)
  const leaveTypesError = ref('')
  const leaveBalancesError = ref('')
  const publicHolidaysError = ref('')
  const myRequestsError = ref('')
  const pendingRequestsError = ref('')
  const reviewRequestsError = ref('')
  const detailError = ref('')

  const normalizedParams = (filters: LeaveRequestFiltersState): LeaveRequestListParams => ({
    employee_id:
      filters.employee_id.trim() && Number.isFinite(Number(filters.employee_id))
        ? Number(filters.employee_id)
        : undefined,
    type: filters.type || undefined,
    status: filters.status || undefined,
    from_date: filters.date_range?.[0] ?? undefined,
    to_date: filters.date_range?.[1] ?? undefined,
    per_page: filters.per_page,
    page: filters.page,
  })

  const fetchLeaveTypes = async () => {
    isLeaveTypesLoading.value = true
    leaveTypesError.value = ''

    try {
      const response = await leaveService.getLeaveTypes()
      leaveTypes.value = response.data

      return response.data
    } catch (err) {
      leaveTypes.value = []
      leaveTypesError.value = err instanceof Error ? err.message : 'Failed to load leave types.'
      throw err
    } finally {
      isLeaveTypesLoading.value = false
    }
  }

  const fetchLeaveBalances = async () => {
    isLeaveBalancesLoading.value = true
    leaveBalancesError.value = ''

    try {
      const response = await leaveService.getMyLeaveBalances()
      leaveBalances.value = response.data

      return response.data
    } catch (err) {
      leaveBalances.value = []
      leaveBalancesError.value = err instanceof Error ? err.message : 'Failed to load leave balances.'
      throw err
    } finally {
      isLeaveBalancesLoading.value = false
    }
  }

  const fetchPublicHolidays = async (year?: number) => {
    isPublicHolidaysLoading.value = true
    publicHolidaysError.value = ''

    try {
      const response = await leaveService.getPublicHolidays(year)
      publicHolidays.value = response.data

      return response.data
    } catch (err) {
      publicHolidays.value = []
      publicHolidaysError.value = err instanceof Error ? err.message : 'Failed to load public holidays.'
      throw err
    } finally {
      isPublicHolidaysLoading.value = false
    }
  }

  const fetchMyRequests = async (params?: LeaveRequestListParams) => {
    isMyRequestsLoading.value = true
    myRequestsError.value = ''

    try {
      const response = await leaveService.getMyLeaveRequests(params ?? normalizedParams(myFilters))
      myRequests.value = response

      return response
    } catch (err) {
      myRequests.value = null
      myRequestsError.value = err instanceof Error ? err.message : 'Failed to load leave history.'
      throw err
    } finally {
      isMyRequestsLoading.value = false
    }
  }

  const fetchPendingRequests = async () => {
    isPendingRequestsLoading.value = true
    pendingRequestsError.value = ''

    try {
      const response = await leaveService.getMyLeaveRequests({
        status: 'pending',
        per_page: 1,
        page: 1,
      })
      pendingRequests.value = response

      return response
    } catch (err) {
      pendingRequests.value = null
      pendingRequestsError.value =
        err instanceof Error ? err.message : 'Failed to verify pending leave requests.'
      throw err
    } finally {
      isPendingRequestsLoading.value = false
    }
  }

  const fetchReviewRequests = async (params?: LeaveRequestListParams) => {
    isReviewRequestsLoading.value = true
    reviewRequestsError.value = ''

    try {
      const response = await leaveService.getReviewLeaveRequests(
        params ?? normalizedParams(reviewFilters),
      )
      reviewRequests.value = response

      return response
    } catch (err) {
      reviewRequests.value = null
      reviewRequestsError.value = err instanceof Error ? err.message : 'Failed to load review queue.'
      throw err
    } finally {
      isReviewRequestsLoading.value = false
    }
  }

  const fetchLeaveRequest = async (leaveRequestId: number) => {
    isDetailLoading.value = true
    detailError.value = ''

    try {
      const response = await leaveService.getLeaveRequest(leaveRequestId)
      selectedRequest.value = response.data

      return response.data
    } catch (err) {
      selectedRequest.value = null
      detailError.value = err instanceof Error ? err.message : 'Failed to load leave request.'
      throw err
    } finally {
      isDetailLoading.value = false
    }
  }

  const syncRequest = (nextRequest: LeaveRequest) => {
    selectedRequest.value = nextRequest
    myRequests.value = patchCollectionRequest(myRequests.value, nextRequest)
    reviewRequests.value = patchCollectionRequest(reviewRequests.value, nextRequest)
  }

  const submitLeaveRequest = async (payload: LeaveRequestCreatePayload) => {
    isSubmitting.value = true

    try {
      const response = await leaveService.submitLeaveRequest(payload)
      selectedRequest.value = response.data

      return response
    } finally {
      isSubmitting.value = false
    }
  }

  const cancelLeaveRequest = async (leaveRequestId: number) => {
    isCancelling.value = true

    try {
      const response = await leaveService.cancelLeaveRequest(leaveRequestId)
      syncRequest(response.data)

      return response
    } finally {
      isCancelling.value = false
    }
  }

  const managerReviewLeaveRequest = async (
    leaveRequestId: number,
    payload: LeaveRequestManagerReviewPayload,
  ) => {
    isReviewing.value = true

    try {
      const response = await leaveService.managerReviewLeaveRequest(leaveRequestId, payload)
      syncRequest(response.data)

      return response
    } finally {
      isReviewing.value = false
    }
  }

  const hrReviewLeaveRequest = async (
    leaveRequestId: number,
    payload: LeaveRequestHrReviewPayload,
  ) => {
    isReviewing.value = true

    try {
      const response = await leaveService.hrReviewLeaveRequest(leaveRequestId, payload)
      syncRequest(response.data)

      return response
    } finally {
      isReviewing.value = false
    }
  }

  const resetMyFilters = () => {
    Object.assign(myFilters, createDefaultLeaveFilters())
  }

  const resetReviewFilters = (overrides?: Partial<LeaveRequestFiltersState>) => {
    Object.assign(
      reviewFilters,
      createDefaultLeaveFilters({
        per_page: 20,
        ...overrides,
      }),
    )
  }

  const clearSelectedRequest = () => {
    selectedRequest.value = null
    detailError.value = ''
  }

  return {
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
    normalizedParams,
    fetchLeaveTypes,
    fetchLeaveBalances,
    fetchPublicHolidays,
    fetchMyRequests,
    fetchPendingRequests,
    fetchReviewRequests,
    fetchLeaveRequest,
    submitLeaveRequest,
    cancelLeaveRequest,
    managerReviewLeaveRequest,
    hrReviewLeaveRequest,
    resetMyFilters,
    resetReviewFilters,
    clearSelectedRequest,
  }
})
