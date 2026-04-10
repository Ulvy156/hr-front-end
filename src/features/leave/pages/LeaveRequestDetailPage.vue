<script setup lang="ts">
import { ArrowLeft, RefreshCw } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

import LeaveRequestDetailContent from '../components/LeaveRequestDetailContent.vue'
import { useLeave } from '../composable/useLeave'
import { getLeaveRequestErrorMessage } from '../utils/leave'

const route = useRoute()
const router = useRouter()

const { selectedRequest, isDetailLoading, detailError, fetchLeaveRequest, clearSelectedRequest } =
  useLeave()

const requestId = computed(() => {
  const rawId = route.params.id
  const normalizedId = Array.isArray(rawId) ? rawId[0] : rawId
  const parsedId = Number(normalizedId)

  return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null
})

const loadRequest = async () => {
  if (!requestId.value) {
    return
  }

  try {
    await fetchLeaveRequest(requestId.value)
  } catch (err) {
    ElMessage.error(getLeaveRequestErrorMessage(err))
  }
}

const goBack = async () => {
  await router.push({ name: 'leave' })
}

watch(
  requestId,
  async () => {
    clearSelectedRequest()
    await loadRequest()
  },
  {
    immediate: true,
  },
)

onBeforeUnmount(() => {
  clearSelectedRequest()
})
</script>

<template>
  <main class="leave-detail-page">
    <div class="leave-detail-page-header">
      <div class="leave-detail-page-copy">
        <BaseButton variant="ghost" @click="goBack">
          <ArrowLeft :size="16" />
          Back to Leave Requests
        </BaseButton>
        <div class="leave-detail-page-title-block">
          <h1 class="leave-detail-page-title">Leave Request Details</h1>
          <p class="leave-detail-page-subtitle">
            Review the full leave request details, approval progress, and returned balance data.
          </p>
        </div>
      </div>
    </div>

    <BaseCard v-if="!requestId" class="leave-detail-state-card">
      <div class="leave-detail-state">
        <h2 class="leave-detail-state-title">Invalid leave request</h2>
        <p class="leave-detail-state-text">
          The selected leave request ID is invalid or missing from the current route.
        </p>
        <BaseButton variant="ghost" @click="goBack">Back to Leave Requests</BaseButton>
      </div>
    </BaseCard>

    <BaseCard v-else-if="isDetailLoading" class="leave-detail-state-card">
      <div class="leave-detail-state">
        <BaseSpinner />
        <h2 class="leave-detail-state-title">Loading leave request</h2>
        <p class="leave-detail-state-text">
          Fetching the latest leave request details from the API.
        </p>
      </div>
    </BaseCard>

    <BaseCard v-else-if="detailError" class="leave-detail-state-card">
      <div class="leave-detail-state">
        <h2 class="leave-detail-state-title">Unable to load leave request</h2>
        <p class="leave-detail-state-text">{{ detailError }}</p>
        <div class="leave-detail-state-actions">
          <BaseButton variant="ghost" @click="goBack">Back</BaseButton>
          <BaseButton @click="loadRequest">
            <RefreshCw :size="16" />
            Try Again
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <BaseCard v-else-if="selectedRequest" class="leave-detail-page-card">
      <div class="leave-detail-page-body">
        <LeaveRequestDetailContent :request="selectedRequest" />
      </div>
    </BaseCard>

    <BaseCard v-else class="leave-detail-state-card">
      <div class="leave-detail-state">
        <h2 class="leave-detail-state-title">Leave request not found</h2>
        <p class="leave-detail-state-text">
          No leave request details are available for this selection.
        </p>
        <BaseButton variant="ghost" @click="goBack">Back to Leave Requests</BaseButton>
      </div>
    </BaseCard>
  </main>
</template>

<style scoped>
.leave-detail-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.leave-detail-page-header,
.leave-detail-page-copy,
.leave-detail-page-title-block,
.leave-detail-page-body,
.leave-detail-state {
  display: flex;
  flex-direction: column;
}

.leave-detail-page-copy,
.leave-detail-page-title-block,
.leave-detail-state {
  gap: 0.5rem;
}

.leave-detail-page-title,
.leave-detail-state-title {
  color: hsl(var(--foreground));
}

.leave-detail-page-subtitle,
.leave-detail-state-text {
  color: hsl(var(--muted-foreground));
}

.leave-detail-page-card,
.leave-detail-state-card {
  overflow: hidden;
}

.leave-detail-page-body {
  gap: 1rem;
  padding: 1.25rem;
}

.leave-detail-state {
  align-items: center;
  justify-content: center;
  min-height: 16rem;
  padding: 1.5rem;
  text-align: center;
}

.leave-detail-state-actions {
  display: flex;
  gap: 0.75rem;
}

@media (max-width: 640px) {
  .leave-detail-state-actions {
    flex-wrap: wrap;
    justify-content: center;
  }
}
</style>
