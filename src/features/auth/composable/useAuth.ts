import { storeToRefs } from 'pinia'

import { useAuthStore } from '../store/authStore'

export const useAuth = () => {
  const authStore = useAuthStore()
  const { initialized, isAuthenticated, isLoading, user } = storeToRefs(authStore)

  return {
    user,
    currentUser: user,
    isAuthenticated,
    isLoading,
    initialized,
    fetchMe: authStore.fetchMe,
    setUser: authStore.setUser,
    clearAuth: authStore.clearAuth,
  }
}
