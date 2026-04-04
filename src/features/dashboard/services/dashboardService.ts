import api from '@/lib/http'

import type { DashboardResponse } from '../interface/dashboard.interface'

export const dashboardService = {
  async getDashboard() {
    const { data } = await api.get<DashboardResponse>('/dashboard')

    return data
  },
}
