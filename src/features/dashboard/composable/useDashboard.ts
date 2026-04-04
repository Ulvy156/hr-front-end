import { computed } from 'vue'
import { storeToRefs } from 'pinia'

import { useDashboardStore } from '../store/dashboardStore'

export const useDashboard = () => {
  const dashboardStore = useDashboardStore()
  const { data, error, initialized, isLoading, lastUpdated } = storeToRefs(dashboardStore)

  const role = computed(() => data.value?.role ?? null)

  return {
    dashboard: data,
    role,
    error,
    initialized,
    isLoading,
    lastUpdated,
    fetchDashboard: dashboardStore.fetchDashboard,
    clearDashboard: dashboardStore.clearDashboard,
  }
}
