import api from '@/lib/http'

import type {
  LeaveBalanceListResponse,
  LeavePublicHolidayListResponse,
  LeaveRequestCreatePayload,
  LeaveRequestDetailResponse,
  LeaveRequestHrReviewPayload,
  LeaveRequestListParams,
  LeaveRequestListResponse,
  LeaveRequestManagerReviewPayload,
  LeaveRequestMutationResponse,
  LeaveTypeListResponse,
} from '../interface/leave.interface'

export const leaveService = {
  async getLeaveTypes() {
    const { data } = await api.get<LeaveTypeListResponse>('/leave/types')

    return data
  },

  async getPublicHolidays(year?: number) {
    const { data } = await api.get<LeavePublicHolidayListResponse>('/leave/public-holidays', {
      params: typeof year === 'number' ? { year } : undefined,
    })

    return data
  },

  async getMyLeaveBalances() {
    const { data } = await api.get<LeaveBalanceListResponse>('/leave/me/balances')

    return data
  },

  async getMyLeaveRequests(params?: LeaveRequestListParams) {
    const { data } = await api.get<LeaveRequestListResponse>('/leave/me/requests', {
      params,
    })

    return data
  },

  async getReviewLeaveRequests(params?: LeaveRequestListParams) {
    const { data } = await api.get<LeaveRequestListResponse>('/leave/requests', {
      params,
    })

    return data
  },

  async getLeaveRequest(leaveRequestId: number) {
    const { data } = await api.get<LeaveRequestDetailResponse>(`/leave/requests/${leaveRequestId}`)

    return data
  },

  async submitLeaveRequest(payload: LeaveRequestCreatePayload) {
    const { data } = await api.post<LeaveRequestMutationResponse>('/leave/requests', payload)

    return data
  },

  async cancelLeaveRequest(leaveRequestId: number) {
    const { data } = await api.patch<LeaveRequestMutationResponse>(
      `/leave/requests/${leaveRequestId}/cancel`,
    )

    return data
  },

  async managerReviewLeaveRequest(
    leaveRequestId: number,
    payload: LeaveRequestManagerReviewPayload,
  ) {
    const { data } = await api.patch<LeaveRequestMutationResponse>(
      `/leave/requests/${leaveRequestId}/manager-review`,
      payload,
    )

    return data
  },

  async hrReviewLeaveRequest(leaveRequestId: number, payload: LeaveRequestHrReviewPayload) {
    const { data } = await api.patch<LeaveRequestMutationResponse>(
      `/leave/requests/${leaveRequestId}/hr-review`,
      payload,
    )

    return data
  },
}
