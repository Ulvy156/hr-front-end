import { ref } from 'vue'
import { defineStore } from 'pinia'

import type { DashboardResponse } from '../interface/dashboard.interface'
import { dashboardService } from '../services/dashboardService'

export const useDashboardStore = defineStore('dashboard', () => {
  const data = ref<DashboardResponse | null>(null)
  const isLoading = ref(false)
  const error = ref('')
  const initialized = ref(false)
  const lastUpdated = ref<string | null>(null)

  const fetchDashboard = async () => {
    isLoading.value = true
    error.value = ''

    try {
      const response = await dashboardService.getDashboard()
      data.value = response
      lastUpdated.value = new Date().toISOString()

      return response
    } catch (err) {
      data.value = null
      error.value = err instanceof Error ? err.message : 'Failed to load dashboard.'
      throw err
    } finally {
      isLoading.value = false
      initialized.value = true
    }
  }

  const clearDashboard = () => {
    data.value = null
    error.value = ''
    isLoading.value = false
    initialized.value = false
    lastUpdated.value = null
  }

  return {
    data,
    isLoading,
    error,
    initialized,
    lastUpdated,
    fetchDashboard,
    clearDashboard,
  }
})
