<script setup lang="ts">
import { Check, RefreshCw, ShieldX } from 'lucide-vue-next'

import type { ActionMenuItem } from '@/components/ui/ActionMenu.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import ConfirmActionModal from '@/components/ui/ConfirmActionModal.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

import OvertimeRejectModal from '../components/OvertimeRejectModal.vue'
import OvertimeRequestsTable from '../components/OvertimeRequestsTable.vue'
import { useOvertime } from '../composable/useOvertime'
import type { OvertimeRequest, OvertimeRequestFiltersState } from '../interface/overtime.interface'
import { OVERTIME_REQUEST_STATUS, OVERTIME_TYPE } from '../interface/overtime.interface'
import {
  formatOvertimeDuration,
  formatOvertimeStatusLabel,
  formatOvertimeTypeLabel,
  getOvertimeRequestErrorMessage,
  isOvertimeRequestPending,
} from '../utils/overtime'

const {
  canViewApprovalQueue,
  canManagerApproveRequests,
  approvalRequests,
  approvalFilters,
  isApprovalRequestsLoading,
  isMutating,
  mutatingRequestId,
  approvalRequestsError,
  fetchApprovalRequests,
  managerApproveOvertimeRequest,
  rejectOvertimeRequest,
  resetApprovalFilters: resetApprovalFilterState,
} = useOvertime()

const pendingApproveRequest = ref<OvertimeRequest | null>(null)
const pendingRejectRequest = ref<OvertimeRequest | null>(null)

const overtimeTypeOptions = computed<BaseDropdownOption[]>(() => [
  { label: 'All overtime types', value: '' },
  ...Object.values(OVERTIME_TYPE).map((type) => ({
    label: formatOvertimeTypeLabel(type),
    value: type,
  })),
])

const statusOptions = computed<BaseDropdownOption[]>(() => [
  { label: 'All statuses', value: '' },
  ...Object.values(OVERTIME_REQUEST_STATUS).map((status) => ({
    label: formatOvertimeStatusLabel(status),
    value: status,
  })),
])

const approvalScopeDescription = computed(
  () =>
    'Review employee overtime requests available to your account, track status updates, and approve or reject pending items when permitted.',
)

const loadPage = async () => {
  try {
    await fetchApprovalRequests()
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
  await applyFilters(approvalFilters, fetchApprovalRequests)
}

const handleResetFilters = async () => {
  resetApprovalFilterState()
  await fetchApprovalRequests()
}

const handlePageChange = async (page: number) => {
  approvalFilters.page = page
  await fetchApprovalRequests()
}

const handlePerPageChange = async (perPage: number) => {
  approvalFilters.per_page = perPage
  approvalFilters.page = 1
  await fetchApprovalRequests()
}

const openApproveConfirmation = (request: OvertimeRequest) => {
  pendingApproveRequest.value = request
}

const closeApproveConfirmation = () => {
  if (isCurrentApproveSubmitting.value) {
    return
  }

  pendingApproveRequest.value = null
}

const openRejectModal = (request: OvertimeRequest) => {
  pendingRejectRequest.value = request
}

const closeRejectModal = () => {
  if (isCurrentRejectSubmitting.value) {
    return
  }

  pendingRejectRequest.value = null
}

const handleApproveRequest = async () => {
  if (!pendingApproveRequest.value) {
    return
  }

  try {
    const response = await managerApproveOvertimeRequest(pendingApproveRequest.value.id)
    ElMessage.success(response.message)
    closeApproveConfirmation()
  } catch (error) {
    ElMessage.error(
      getOvertimeRequestErrorMessage(
        error,
        'We could not approve this overtime request. Please try again.',
      ),
    )
  }
}

const handleRejectRequest = async (payload: { id: number; rejection_reason: string }) => {
  try {
    const response = await rejectOvertimeRequest(payload.id, {
      rejection_reason: payload.rejection_reason,
    })
    ElMessage.success(response.message)
    closeRejectModal()
  } catch (error) {
    ElMessage.error(
      getOvertimeRequestErrorMessage(
        error,
        'We could not reject this overtime request. Please try again.',
      ),
    )
  }
}

const resolveActions = (request: OvertimeRequest) => {
  const items: ActionMenuItem[] = []
  const isRequestMutating = isMutating.value && mutatingRequestId.value === request.id

  if (canManagerApproveRequests.value && isOvertimeRequestPending(request) && !isRequestMutating) {
    items.push(
      {
        key: 'approve',
        label: 'Approve',
        icon: Check,
        tone: 'primary',
      },
      {
        key: 'reject',
        label: 'Reject',
        icon: ShieldX,
        tone: 'danger',
      },
    )
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
  if (actionKey === 'approve') {
    openApproveConfirmation(request)
    return
  }

  if (actionKey === 'reject') {
    openRejectModal(request)
  }
}

const isCurrentApproveSubmitting = computed(() => {
  if (!pendingApproveRequest.value) {
    return false
  }

  return isMutating.value && mutatingRequestId.value === pendingApproveRequest.value.id
})

const isCurrentRejectSubmitting = computed(() => {
  if (!pendingRejectRequest.value) {
    return false
  }

  return isMutating.value && mutatingRequestId.value === pendingRejectRequest.value.id
})

const pendingApproveDuration = computed(() => {
  if (!pendingApproveRequest.value) {
    return '--'
  }

  return formatOvertimeDuration(
    pendingApproveRequest.value.hours,
    pendingApproveRequest.value.minutes,
  )
})

const activeRequestCountLabel = computed(() => {
  return approvalRequests.value?.total ? `${approvalRequests.value.total} tracked` : ''
})

onMounted(async () => {
  await loadPage()
})
</script>

<template>
  <main class="overtime-page">
    <BaseCard v-if="!canViewApprovalQueue" class="overtime-state-card">
      <div class="overtime-state">
        <h1 class="overtime-page-title">Employee Overtime Requests</h1>
        <p class="overtime-page-text">
          Employee overtime requests are unavailable for this account.
        </p>
      </div>
    </BaseCard>

    <template v-else>
      <section class="overtime-section">
        <div class="overtime-section-heading">
          <div class="overtime-section-copy">
            <h1 class="overtime-page-title">Employee Overtime Requests</h1>
            <p class="overtime-page-text">{{ approvalScopeDescription }}</p>
          </div>

          <div class="overtime-section-side">
            <p v-if="activeRequestCountLabel" class="overtime-section-pill">
              {{ activeRequestCountLabel }}
            </p>
            <div class="overtime-section-actions">
              <BaseButton
                :loading="isApprovalRequestsLoading"
                variant="secondary"
                @click="loadPage"
              >
                <RefreshCw :size="16" />
                Refresh
              </BaseButton>
            </div>
          </div>
        </div>

        <BaseCard class="overtime-filters-card">
          <div class="overtime-filters-copy">
            <h2 class="overtime-filters-title">Refine employee requests</h2>
            <p class="overtime-page-text">
              Filter by employee ID, status, overtime type, and date range.
            </p>
          </div>

          <div class="overtime-filters-grid overtime-filters-grid-approvals">
            <BaseInput
              v-model="approvalFilters.employee_id"
              label="Employee ID"
              placeholder="Filter by employee ID"
              size="large"
            />
            <BaseDropdown
              v-model="approvalFilters.status"
              :options="statusOptions"
              label="Status"
            />
            <BaseDropdown
              v-model="approvalFilters.overtime_type"
              :options="overtimeTypeOptions"
              label="Overtime Type"
            />
            <BaseDatePicker
              v-model="approvalFilters.date_range"
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

        <BaseCard v-if="approvalRequestsError && !approvalRequests" class="overtime-state-card">
          <div class="overtime-state">
            <h2 class="overtime-state-title">Unable to load employee overtime requests</h2>
            <p class="overtime-page-text">{{ approvalRequestsError }}</p>
            <BaseButton @click="loadPage">Try Again</BaseButton>
          </div>
        </BaseCard>

        <BaseCard
          v-else-if="
            !isApprovalRequestsLoading && approvalRequests && !approvalRequests.data.length
          "
          class="overtime-state-card"
        >
          <div class="overtime-state">
            <h2 class="overtime-state-title">No overtime requests found</h2>
            <p class="overtime-page-text">
              No employee overtime requests matched the current filters.
            </p>
          </div>
        </BaseCard>

        <OvertimeRequestsTable
          v-else
          description="Review employee overtime requests, track status changes, and approve or reject pending items from the action menu when available."
          empty-text="No employee overtime requests matched the current filters."
          :loading="isApprovalRequestsLoading"
          :requests="approvalRequests"
          :resolve-actions="resolveActions"
          :show-approver-column="true"
          :show-department-column="true"
          :show-employee-column="true"
          :show-submitted-column="false"
          title="Overtime Request List"
          @action="handleTableAction"
          @page-change="handlePageChange"
          @per-page-change="handlePerPageChange"
        />
      </section>
    </template>

    <ConfirmActionModal
      action-label="Approve Request"
      action-variant="primary"
      :detail="`Requested duration: ${pendingApproveDuration}. Manager approval is final and approved overtime is included in payroll.`"
      :loading="isCurrentApproveSubmitting"
      :message="`Approve the overtime request for ${pendingApproveRequest?.employee?.name ?? 'this employee'}?`"
      :open="Boolean(pendingApproveRequest)"
      status="success"
      status-label="Manager Approval"
      title="Approve Overtime Request"
      @close="closeApproveConfirmation"
      @confirm="handleApproveRequest"
    />

    <OvertimeRejectModal
      :open="Boolean(pendingRejectRequest)"
      :request="pendingRejectRequest"
      :submitting="isCurrentRejectSubmitting"
      @close="closeRejectModal"
      @submit="handleRejectRequest"
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

.overtime-section-actions {
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.overtime-section-side {
  align-items: center;
  justify-content: flex-end;
  gap: 0.75rem;
  flex-wrap: wrap;
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
  gap: 1rem;
  padding: 1rem 1.25rem 1.1rem;
}

.overtime-filters-grid-approvals {
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

  .overtime-section-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .overtime-section-side {
    width: 100%;
    justify-content: flex-start;
  }

  .overtime-filters-grid-approvals {
    grid-template-columns: 1fr;
  }

  .overtime-filters-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
</style>
