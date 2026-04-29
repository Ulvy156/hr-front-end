import api from '@/lib/http'

import type {
  OvertimeRequestCreatePayload,
  OvertimeRequestDetailResponse,
  OvertimeRequestListParams,
  OvertimeRequestListResponse,
  OvertimeRequestMutationResponse,
  OvertimeRequestRejectPayload,
} from '../interface/overtime.interface'

export const overtimeService = {
  async getOvertimeRequests(params?: OvertimeRequestListParams) {
    const { data } = await api.get<OvertimeRequestListResponse>('/overtime-requests', {
      params,
    })

    return data
  },

  async getOvertimeRequest(overtimeRequestId: number) {
    const { data } = await api.get<OvertimeRequestDetailResponse>(
      `/overtime-requests/${overtimeRequestId}`,
    )

    return data
  },

  async submitOvertimeRequest(payload: OvertimeRequestCreatePayload) {
    const { data } = await api.post<OvertimeRequestMutationResponse>('/overtime-requests', payload)

    return data
  },

  async managerApproveOvertimeRequest(overtimeRequestId: number) {
    const { data } = await api.post<OvertimeRequestMutationResponse>(
      `/overtime-requests/${overtimeRequestId}/manager-approve`,
    )

    return data
  },

  async rejectOvertimeRequest(overtimeRequestId: number, payload: OvertimeRequestRejectPayload) {
    const { data } = await api.post<OvertimeRequestMutationResponse>(
      `/overtime-requests/${overtimeRequestId}/reject`,
      payload,
    )

    return data
  },

  async cancelOvertimeRequest(overtimeRequestId: number) {
    const { data } = await api.post<OvertimeRequestMutationResponse>(
      `/overtime-requests/${overtimeRequestId}/cancel`,
    )

    return data
  },
}
