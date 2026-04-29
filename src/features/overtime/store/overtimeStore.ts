import { reactive, ref } from 'vue'
import { defineStore } from 'pinia'

import type {
  OvertimeRequest,
  OvertimeRequestCreatePayload,
  OvertimeRequestFiltersState,
  OvertimeRequestListParams,
  OvertimeRequestListResponse,
  OvertimeRequestRejectPayload,
} from '../interface/overtime.interface'
import { overtimeService } from '../services/overtimeService'
import { createDefaultOvertimeFilters, matchesOvertimeFilters } from '../utils/overtime'

const patchCollectionRequest = (
  collection: OvertimeRequestListResponse | null,
  nextRequest: OvertimeRequest,
) => {
  if (!collection) {
    return collection
  }

  return {
    ...collection,
    data: collection.data.map((request) => (request.id === nextRequest.id ? nextRequest : request)),
  }
}

const removeCollectionRequest = (
  collection: OvertimeRequestListResponse | null,
  overtimeRequestId: number,
) => {
  if (!collection) {
    return collection
  }

  return {
    ...collection,
    data: collection.data.filter((request) => request.id !== overtimeRequestId),
    total: Math.max(collection.total - 1, 0),
    to: collection.to ? Math.max(collection.to - 1, 0) : collection.to,
  }
}

export const useOvertimeStore = defineStore('overtime', () => {
  const myRequests = ref<OvertimeRequestListResponse | null>(null)
  const approvalRequests = ref<OvertimeRequestListResponse | null>(null)
  const selectedRequest = ref<OvertimeRequest | null>(null)
  const myFilters = reactive<OvertimeRequestFiltersState>(createDefaultOvertimeFilters())
  const approvalFilters = reactive<OvertimeRequestFiltersState>(createDefaultOvertimeFilters())
  const isMyRequestsLoading = ref(false)
  const isApprovalRequestsLoading = ref(false)
  const isDetailLoading = ref(false)
  const isSubmitting = ref(false)
  const isMutating = ref(false)
  const mutatingRequestId = ref<number | null>(null)
  const mutationKind = ref<'cancel' | 'approve' | 'reject' | null>(null)
  const myRequestsError = ref('')
  const approvalRequestsError = ref('')
  const detailError = ref('')

  const normalizedParams = (filters: OvertimeRequestFiltersState): OvertimeRequestListParams => ({
    employee_id:
      filters.employee_id.trim() && Number.isFinite(Number(filters.employee_id))
        ? Number(filters.employee_id)
        : undefined,
    status: filters.status || undefined,
    approval_stage: filters.approval_stage || undefined,
    overtime_type: filters.overtime_type || undefined,
    from_date: filters.date_range?.[0] ?? undefined,
    to_date: filters.date_range?.[1] ?? undefined,
    per_page: filters.per_page,
    page: filters.page,
  })

  const fetchMyRequests = async (params?: OvertimeRequestListParams) => {
    isMyRequestsLoading.value = true
    myRequestsError.value = ''

    try {
      const response = await overtimeService.getOvertimeRequests(
        params ?? normalizedParams(myFilters),
      )
      myRequests.value = response

      return response
    } catch (error) {
      myRequests.value = null
      myRequestsError.value =
        error instanceof Error ? error.message : 'Failed to load your overtime requests.'
      throw error
    } finally {
      isMyRequestsLoading.value = false
    }
  }

  const fetchApprovalRequests = async (params?: OvertimeRequestListParams) => {
    isApprovalRequestsLoading.value = true
    approvalRequestsError.value = ''

    try {
      const response = await overtimeService.getOvertimeRequests(
        params ?? normalizedParams(approvalFilters),
      )
      approvalRequests.value = response

      return response
    } catch (error) {
      approvalRequests.value = null
      approvalRequestsError.value =
        error instanceof Error ? error.message : 'Failed to load overtime approvals.'
      throw error
    } finally {
      isApprovalRequestsLoading.value = false
    }
  }

  const fetchOvertimeRequest = async (overtimeRequestId: number) => {
    isDetailLoading.value = true
    detailError.value = ''

    try {
      const response = await overtimeService.getOvertimeRequest(overtimeRequestId)
      selectedRequest.value = response

      return response
    } catch (error) {
      selectedRequest.value = null
      detailError.value =
        error instanceof Error ? error.message : 'Failed to load the overtime request.'
      throw error
    } finally {
      isDetailLoading.value = false
    }
  }

  const syncRequest = (nextRequest: OvertimeRequest) => {
    selectedRequest.value = nextRequest
    myRequests.value = patchCollectionRequest(myRequests.value, nextRequest)

    const nextApprovalRequests = patchCollectionRequest(approvalRequests.value, nextRequest)
    approvalRequests.value = matchesOvertimeFilters(nextRequest, approvalFilters)
      ? nextApprovalRequests
      : removeCollectionRequest(nextApprovalRequests, nextRequest.id)
  }

  const submitOvertimeRequest = async (payload: OvertimeRequestCreatePayload) => {
    isSubmitting.value = true

    try {
      const response = await overtimeService.submitOvertimeRequest(payload)
      selectedRequest.value = response.data

      return response
    } finally {
      isSubmitting.value = false
    }
  }

  const runMutation = async <T>(
    overtimeRequestId: number,
    kind: 'cancel' | 'approve' | 'reject',
    callback: () => Promise<T>,
  ) => {
    isMutating.value = true
    mutatingRequestId.value = overtimeRequestId
    mutationKind.value = kind

    try {
      return await callback()
    } finally {
      isMutating.value = false
      mutatingRequestId.value = null
      mutationKind.value = null
    }
  }

  const cancelOvertimeRequest = async (overtimeRequestId: number) => {
    return runMutation(overtimeRequestId, 'cancel', async () => {
      const response = await overtimeService.cancelOvertimeRequest(overtimeRequestId)
      syncRequest(response.data)

      return response
    })
  }

  const managerApproveOvertimeRequest = async (overtimeRequestId: number) => {
    return runMutation(overtimeRequestId, 'approve', async () => {
      const response = await overtimeService.managerApproveOvertimeRequest(overtimeRequestId)
      syncRequest(response.data)

      return response
    })
  }

  const rejectOvertimeRequest = async (
    overtimeRequestId: number,
    payload: OvertimeRequestRejectPayload,
  ) => {
    return runMutation(overtimeRequestId, 'reject', async () => {
      const response = await overtimeService.rejectOvertimeRequest(overtimeRequestId, payload)
      syncRequest(response.data)

      return response
    })
  }

  const resetMyFilters = () => {
    Object.assign(myFilters, createDefaultOvertimeFilters())
  }

  const resetApprovalFilters = (overrides?: Partial<OvertimeRequestFiltersState>) => {
    Object.assign(
      approvalFilters,
      createDefaultOvertimeFilters({
        ...overrides,
      }),
    )
  }

  const clearSelectedRequest = () => {
    selectedRequest.value = null
    detailError.value = ''
  }

  return {
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
    normalizedParams,
    fetchMyRequests,
    fetchApprovalRequests,
    fetchOvertimeRequest,
    submitOvertimeRequest,
    cancelOvertimeRequest,
    managerApproveOvertimeRequest,
    rejectOvertimeRequest,
    resetMyFilters,
    resetApprovalFilters,
    clearSelectedRequest,
  }
})
