<script setup lang="ts">
import { Ban, Plus, RefreshCw } from 'lucide-vue-next'

import type { ActionMenuItem } from '@/components/ui/ActionMenu.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import ConfirmActionModal from '@/components/ui/ConfirmActionModal.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'

import OvertimeRequestFormModal from '../components/OvertimeRequestFormModal.vue'
import OvertimeRequestsTable from '../components/OvertimeRequestsTable.vue'
import { useOvertime } from '../composable/useOvertime'
import type { OvertimeRequest, OvertimeRequestFiltersState } from '../interface/overtime.interface'
import { OVERTIME_REQUEST_STATUS, OVERTIME_TYPE } from '../interface/overtime.interface'
import {
  canCancelOvertimeRequest,
  createDefaultOvertimeFilters,
  formatOvertimeDuration,
  formatOvertimeTypeLabel,
  formatOvertimeStatusLabel,
  getOvertimeRequestErrorMessage,
} from '../utils/overtime'

const {
  canCreateRequests,
  canViewMyRequests,
  canCancelOwnRequests,
  myRequests,
  myFilters,
  isMyRequestsLoading,
  isSubmitting,
  isMutating,
  mutatingRequestId,
  myRequestsError,
  fetchMyRequests,
  submitOvertimeRequest,
  cancelOvertimeRequest,
  resetMyFilters: resetMyFilterState,
} = useOvertime()

const isCreateModalOpen = ref(false)
const pendingCancelRequest = ref<OvertimeRequest | null>(null)

const statusOptions = computed<BaseDropdownOption[]>(() => [
  { label: 'All statuses', value: '' },
  ...Object.values(OVERTIME_REQUEST_STATUS).map((status) => ({
    label: formatOvertimeStatusLabel(status),
    value: status,
  })),
])

const overtimeTypeOptions = computed<BaseDropdownOption[]>(() => [
  { label: 'All overtime types', value: '' },
  ...Object.values(OVERTIME_TYPE).map((type) => ({
    label: formatOvertimeTypeLabel(type),
    value: type,
  })),
])

const loadPage = async () => {
  try {
    await fetchMyRequests()
  } catch {
    return
  }
}

const applyFilters = async (
  filters: OvertimeRequestFiltersState,
  fetcher: () => Promise<unknown>,
) => {
  filters.page = 1
  await fetcher()
}

const handleApplyFilters = async () => {
  await applyFilters(myFilters, fetchMyRequests)
}

const handleResetFilters = async () => {
  resetMyFilterState()
  await fetchMyRequests()
}

const handlePageChange = async (page: number) => {
  myFilters.page = page
  await fetchMyRequests()
}

const handlePerPageChange = async (perPage: number) => {
  myFilters.per_page = perPage
  myFilters.page = 1
  await fetchMyRequests()
}

const openCreateModal = () => {
  isCreateModalOpen.value = true
}

const closeCreateModal = () => {
  if (isSubmitting.value) {
    return
  }

  isCreateModalOpen.value = false
}

const handleCreateRequest = async (payload: {
  overtime_date: string
  start_time: string
  end_time: string
  reason: string
}) => {
  try {
    const response = await submitOvertimeRequest(payload)
    ElMessage.success(response.message)
    closeCreateModal()
    await fetchMyRequests()
  } catch (error) {
    ElMessage.error(
      getOvertimeRequestErrorMessage(
        error,
        'We could not submit your overtime request. Please try again.',
      ),
    )
  }
}

const openCancelConfirmation = (request: OvertimeRequest) => {
  pendingCancelRequest.value = request
}

const closeCancelConfirmation = () => {
  if (isCurrentCancelSubmitting.value) {
    return
  }

  pendingCancelRequest.value = null
}

const handleCancelRequest = async () => {
  if (!pendingCancelRequest.value) {
    return
  }

  try {
    const response = await cancelOvertimeRequest(pendingCancelRequest.value.id)
    ElMessage.success(response.message)
    closeCancelConfirmation()
  } catch (error) {
    ElMessage.error(
      getOvertimeRequestErrorMessage(
        error,
        'We could not cancel this overtime request. Please try again.',
      ),
    )
  }
}

const resolveActions = (request: OvertimeRequest) => {
  const items: ActionMenuItem[] = []
  const isRequestMutating = isMutating.value && mutatingRequestId.value === request.id

  if (canCancelOwnRequests.value && canCancelOvertimeRequest(request) && !isRequestMutating) {
    items.push({
      key: 'cancel',
      label: 'Cancel',
      icon: Ban,
      tone: 'danger',
    })
  }

  return items
}

const handleTableAction = ({
  request,
  actionKey,
}: {
  request: OvertimeRequest
  actionKey: string
}) => {
  if (actionKey === 'cancel') {
    openCancelConfirmation(request)
  }
}

const isCurrentCancelSubmitting = computed(() => {
  if (!pendingCancelRequest.value) {
    return false
  }

  return isMutating.value && mutatingRequestId.value === pendingCancelRequest.value.id
})

const activeRequestCountLabel = computed(() => {
  return myRequests.value?.total ? `${myRequests.value.total} tracked` : ''
})

const currentPendingDuration = computed(() => {
  if (!pendingCancelRequest.value) {
    return '--'
  }

  return formatOvertimeDuration(
    pendingCancelRequest.value.hours,
    pendingCancelRequest.value.minutes,
  )
})

onMounted(async () => {
  if (!myFilters.status && !myFilters.approval_stage && !myFilters.employee_id) {
    Object.assign(myFilters, createDefaultOvertimeFilters())
  }

  await loadPage()
})
</script>

<template>
  <main class="overtime-page">
    <BaseCard v-if="!canViewMyRequests" class="overtime-state-card">
      <div class="overtime-state">
        <h1 class="overtime-page-title">My Overtime Requests</h1>
        <p class="overtime-page-text">Overtime request history is unavailable for this account.</p>
      </div>
    </BaseCard>

    <template v-else>
      <section class="overtime-section">
        <div class="overtime-section-heading">
          <div class="overtime-section-copy">
            <h1 class="overtime-page-title">My Overtime Requests</h1>
            <p class="overtime-page-text">
              Review your submitted overtime requests, monitor approval status, and cancel pending
              items when allowed.
            </p>
          </div>

          <div class="overtime-section-side">
            <p v-if="activeRequestCountLabel" class="overtime-section-pill">
              {{ activeRequestCountLabel }}
            </p>
            <div class="overtime-section-actions">
              <BaseButton :loading="isMyRequestsLoading" variant="secondary" @click="loadPage">
                <RefreshCw :size="16" />
                Refresh
              </BaseButton>
              <BaseButton v-if="canCreateRequests" @click="openCreateModal">
                <Plus :size="16" />
                New Overtime Request
              </BaseButton>
            </div>
          </div>
        </div>

        <BaseCard class="overtime-filters-card">
          <div class="overtime-filters-copy">
            <h2 class="overtime-filters-title">Refine your requests</h2>
            <p class="overtime-page-text">Filter by status, overtime type, and date range.</p>
          </div>

          <div class="overtime-filters-grid">
            <BaseDropdown v-model="myFilters.status" :options="statusOptions" label="Status" />
            <BaseDropdown
              v-model="myFilters.overtime_type"
              :options="overtimeTypeOptions"
              label="Overtime Type"
            />
            <BaseDatePicker
              v-model="myFilters.date_range"
              end-placeholder="To date"
              label="Date Range"
              start-placeholder="From date"
              type="daterange"
              value-format="YYYY-MM-DD"
            />
          </div>

          <div class="overtime-filters-actions">
            <BaseButton variant="ghost" @click="handleResetFilters">Reset</BaseButton>
            <BaseButton variant="secondary" @click="loadPage">
              <RefreshCw :size="16" />
              Refresh
            </BaseButton>
            <BaseButton @click="handleApplyFilters">Apply Filters</BaseButton>
          </div>
        </BaseCard>

        <BaseCard v-if="myRequestsError && !myRequests" class="overtime-state-card">
          <div class="overtime-state">
            <h2 class="overtime-state-title">Unable to load overtime requests</h2>
            <p class="overtime-page-text">{{ myRequestsError }}</p>
            <BaseButton @click="loadPage">Try Again</BaseButton>
          </div>
        </BaseCard>

        <BaseCard
          v-else-if="!isMyRequestsLoading && myRequests && !myRequests.data.length"
          class="overtime-state-card"
        >
          <div class="overtime-state">
            <h2 class="overtime-state-title">No overtime requests yet</h2>
            <p class="overtime-page-text">
              Your overtime request history is empty for the current filters.
            </p>
            <BaseButton v-if="canCreateRequests" @click="openCreateModal">
              New Overtime Request
            </BaseButton>
          </div>
        </BaseCard>

        <OvertimeRequestsTable
          v-else
          description="Track overtime date, time range, calculated hours, status, and manager updates."
          empty-text="No overtime requests were returned for your current filters."
          :loading="isMyRequestsLoading"
          :requests="myRequests"
          :resolve-actions="resolveActions"
          :show-manager-update-column="true"
          title="My Overtime History"
          @action="handleTableAction"
          @page-change="handlePageChange"
          @per-page-change="handlePerPageChange"
        />
      </section>
    </template>

    <OvertimeRequestFormModal
      :open="isCreateModalOpen"
      :submitting="isSubmitting"
      @close="closeCreateModal"
      @submit="handleCreateRequest"
    />

    <ConfirmActionModal
      action-label="Cancel Request"
      action-variant="danger"
      :detail="`Requested duration: ${currentPendingDuration}. This action is only available while the request is still pending.`"
      :loading="isCurrentCancelSubmitting"
      :message="`Cancel the overtime request for ${pendingCancelRequest?.overtime_date ?? 'this date'}?`"
      :open="Boolean(pendingCancelRequest)"
      status="danger"
      status-label="Cancel Request"
      title="Cancel Overtime Request"
      @close="closeCancelConfirmation"
      @confirm="handleCancelRequest"
    />
  </main>
</template>

<style scoped>
.overtime-page,
.overtime-section,
.overtime-section-copy,
.overtime-filters-copy,
.overtime-state {
  display: flex;
  flex-direction: column;
}

.overtime-page,
.overtime-section {
  gap: 1.2rem;
}

.overtime-section-copy,
.overtime-filters-copy {
  gap: 0.3rem;
}

.overtime-section-heading,
.overtime-section-side,
.overtime-section-actions {
  display: flex;
}

.overtime-section-heading {
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.overtime-section-side,
.overtime-section-actions {
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.overtime-section-side {
  justify-content: flex-end;
}

.overtime-section-actions {
  justify-content: flex-end;
}

.overtime-page-title,
.overtime-filters-title,
.overtime-state-title {
  color: hsl(var(--foreground));
}

.overtime-page-title {
  font-size: clamp(1.9rem, 2.2vw, 2.35rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.overtime-page-text {
  color: hsl(var(--muted-foreground));
  line-height: 1.55;
}

.overtime-section-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.45rem 0.8rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 999px;
  background: hsl(var(--secondary) / 0.24);
  color: hsl(var(--foreground));
  font-size: var(--text-xs);
  font-weight: 700;
}

.overtime-filters-card,
.overtime-state-card {
  overflow: hidden;
}

.overtime-filters-copy {
  padding: 1.15rem 1.25rem 0;
}

.overtime-filters-title {
  font-size: 1rem;
  font-weight: 700;
}

.overtime-filters-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  padding: 1rem 1.25rem 1.1rem;
}

.overtime-filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0 1.25rem 1.15rem;
}

.overtime-state {
  align-items: center;
  justify-content: center;
  min-height: 13rem;
  gap: 0.75rem;
  padding: 1.5rem;
  text-align: center;
  background: linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.1) 100%);
}

@media (max-width: 768px) {
  .overtime-section-heading {
    flex-direction: column;
    align-items: flex-start;
  }

  .overtime-section-side,
  .overtime-section-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .overtime-filters-grid {
    grid-template-columns: 1fr;
  }

  .overtime-filters-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
</style>
