<script setup lang="ts">
import axios from 'axios'
import {
  Ban,
  Check,
  Eye,
  Plus,
  RefreshCw,
  ShieldCheck,
  ShieldX,
} from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import { ROLES } from '@/constants/roles'
import type { ActionMenuItem } from '@/components/ui/ActionMenu.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

import LeaveRequestActionModal from '../components/LeaveRequestActionModal.vue'
import LeaveBalanceSummary from '../components/LeaveBalanceSummary.vue'
import LeaveRequestsTable from '../components/LeaveRequestsTable.vue'
import { useLeave } from '../composable/useLeave'
import type {
  LeaveRequest,
  LeaveRequestFiltersState,
  LeaveRequestListSummary,
} from '../interface/leave.interface'
import { LEAVE_REQUEST_STATUS } from '../interface/leave.interface'
import {
  canCancelLeaveRequest,
  canApproveHRStep,
  canApproveManagerStep,
  formatLeaveStatusLabel,
  getLeaveRequestErrorMessage,
  getLeaveReviewDefaultStatus,
  hasAuthPermission,
  hasNamedRole,
} from '../utils/leave'

const router = useRouter()

const {
  currentUser,
  employee,
  canCreateRequests,
  canReviewRequests,
  isAdminRole,
  leaveTypes,
  leaveBalances,
  myRequests,
  pendingRequests,
  reviewRequests,
  myFilters,
  reviewFilters,
  isLeaveBalancesLoading,
  isMyRequestsLoading,
  isReviewRequestsLoading,
  isCancelling,
  isReviewing,
  leaveTypesError,
  leaveBalancesError,
  myRequestsError,
  reviewRequestsError,
  fetchLeaveTypes,
  fetchLeaveBalances,
  fetchMyRequests,
  fetchReviewRequests,
  cancelLeaveRequest,
  managerReviewLeaveRequest,
  hrReviewLeaveRequest,
  resetMyFilters: resetMyFilterState,
  resetReviewFilters: resetReviewFilterState,
} = useLeave()

const pendingAction = ref<{
  request: LeaveRequest
  actionKey:
    | 'cancel'
    | 'manager_approve'
    | 'manager_reject'
    | 'hr_approve'
    | 'hr_reject'
} | null>(null)
const hideHrReviewActions = ref(false)

const leaveTypeOptions = computed<BaseDropdownOption[]>(() => [
  { label: 'All leave types', value: '' },
  ...leaveTypes.value.map((leaveType) => ({
    label: leaveType.name,
    value: leaveType.code,
  })),
])

const statusOptions = computed<BaseDropdownOption[]>(() => [
  { label: 'All statuses', value: '' },
  ...Object.values(LEAVE_REQUEST_STATUS).map((status) => ({
    label: formatLeaveStatusLabel(status),
    value: status,
  })),
])

const myRequestSummary = computed<LeaveRequestListSummary | null>(() => myRequests.value?.summary ?? null)
const reviewRequestSummary = computed<LeaveRequestListSummary | null>(
  () => reviewRequests.value?.summary ?? null,
)
const canCurrentUserHrApprove = computed(() => {
  if (hideHrReviewActions.value) {
    return false
  }

  return hasAuthPermission(currentUser.value, 'leave.approve.hr')
})
const hasPendingLeaveRequest = computed(() => {
  if ((pendingRequests.value?.total ?? 0) > 0) {
    return true
  }

  if ((myRequestSummary.value?.pending_count ?? 0) > 0) {
    return true
  }

  return (myRequests.value?.data ?? []).some((request) => request.status === LEAVE_REQUEST_STATUS.PENDING)
})
const canShowCreateRequestButton = computed(() => {
  return canCreateRequests.value && !hasPendingLeaveRequest.value
})
const reviewSectionDescription = computed(() => {
  if (canCurrentUserHrApprove.value) {
    return 'Review manager-approved leave requests and complete final HR approval.'
  }

  if (currentUser.value?.employee?.id) {
    return 'Review leave requests assigned to you for the first approval step before HR final approval.'
  }

  if (isAdminRole.value) {
    return 'Inspect the shared review queue. Approval actions only appear when you are explicitly assigned or have HR approval permission.'
  }

  return 'View leave requests across the organization using the current filters.'
})

const loadPage = async () => {
  const tasks: Array<Promise<unknown>> = [fetchLeaveTypes()]

  if (canCreateRequests.value) {
    tasks.push(fetchLeaveBalances())
    tasks.push(fetchMyRequests())
  }

  if (canReviewRequests.value) {
    tasks.push(fetchReviewRequests())
  }

  try {
    await Promise.all(tasks)
  } catch {
    // Each section handles its own error state.
  }
}

const applyFilters = async (
  filters: Ref<LeaveRequestFiltersState>,
  fetcher: () => Promise<unknown>,
) => {
  filters.value.page = 1
  await fetcher()
}

const handleApplyMyFilters = async () => {
  await applyFilters(myFilters, fetchMyRequests)
}

const handleResetMyFilters = async () => {
  resetMyFilterState()
  await fetchMyRequests()
}

const handleMyPageChange = async (page: number) => {
  myFilters.value.page = page
  await fetchMyRequests()
}

const handleMyPerPageChange = async (perPage: number) => {
  myFilters.value.per_page = perPage
  myFilters.value.page = 1
  await fetchMyRequests()
}

const handleApplyReviewFilters = async () => {
  await applyFilters(reviewFilters, fetchReviewRequests)
}

const handleResetReviewFilters = async () => {
  resetReviewFilterState({
    status: getLeaveReviewDefaultStatus(currentUser.value),
  })
  await fetchReviewRequests()
}

const handleReviewPageChange = async (page: number) => {
  reviewFilters.value.page = page
  await fetchReviewRequests()
}

const handleReviewPerPageChange = async (perPage: number) => {
  reviewFilters.value.per_page = perPage
  reviewFilters.value.page = 1
  await fetchReviewRequests()
}

const goToCreatePage = async () => {
  await router.push({ name: 'leave-request' })
}

const summaryCards = (summary: LeaveRequestListSummary | null) => {
  if (!summary) {
    return []
  }

  return [
    { key: 'total', label: 'Total Requests', value: summary.total_requests },
    { key: 'pending', label: 'Pending', value: summary.pending_count },
    { key: 'approved', label: 'Approved', value: summary.approved_count },
    { key: 'rejected', label: 'Rejected', value: summary.rejected_count },
    { key: 'cancelled', label: 'Cancelled', value: summary.cancelled_count },
  ]
}

const openPendingAction = (
  request: LeaveRequest,
  actionKey:
    | 'cancel'
    | 'manager_approve'
    | 'manager_reject'
    | 'hr_approve'
    | 'hr_reject',
) => {
  pendingAction.value = {
    request,
    actionKey,
  }
}

const closePendingAction = () => {
  pendingAction.value = null
}

const goToDetailPage = async (requestId: number) => {
  await router.push({
    name: 'leave-detail',
    params: {
      id: requestId,
    },
  })
}

const handleCancelRequest = async (request: LeaveRequest) => {
  try {
    const response = await cancelLeaveRequest(request.id)
    ElMessage.success(response.message)
    closePendingAction()
  } catch (err) {
    ElMessage.error(getLeaveRequestErrorMessage(err))
  }
}

const handleManagerReview = async (
  request: LeaveRequest,
  status: typeof LEAVE_REQUEST_STATUS.MANAGER_APPROVED | typeof LEAVE_REQUEST_STATUS.REJECTED,
) => {
  try {
    const response = await managerReviewLeaveRequest(request.id, { status })
    ElMessage.success(response.message)
    closePendingAction()
  } catch (err) {
    ElMessage.error(getLeaveRequestErrorMessage(err))
  }
}

const handleHrReview = async (
  request: LeaveRequest,
  status: typeof LEAVE_REQUEST_STATUS.HR_APPROVED | typeof LEAVE_REQUEST_STATUS.REJECTED,
) => {
  try {
    const response = await hrReviewLeaveRequest(request.id, { status })
    hideHrReviewActions.value = false
    ElMessage.success(response.message)
    closePendingAction()
  } catch (err) {
    if (axios.isAxiosError(err) && err.response?.status === 403) {
      hideHrReviewActions.value = true
    }

    await fetchReviewRequests().catch(() => undefined)
    ElMessage.error(getLeaveRequestErrorMessage(err))
  }
}

const resolveSelfActions = (request: LeaveRequest) => {
  const items: ActionMenuItem[] = [
    {
      key: 'view',
      label: 'View',
      icon: Eye,
      tone: 'primary',
    },
  ]

  if (canCancelLeaveRequest(request, employee.value?.id)) {
    items.push({
      key: 'cancel',
      label: 'Cancel',
      icon: Ban,
      tone: 'danger',
      disabled: isCancelling.value,
    })
  }

  return items
}

const resolveReviewActions = (request: LeaveRequest) => {
  const items: ActionMenuItem[] = [
    {
      key: 'view',
      label: 'View',
      icon: Eye,
      tone: 'primary',
    },
  ]

  if (canApproveManagerStep(request, currentUser.value)) {
    items.push(
      {
        key: 'manager_approve',
        label: 'Approve (Manager Step)',
        icon: Check,
        tone: 'primary',
        disabled: isReviewing.value,
      },
      {
        key: 'manager_reject',
        label: 'Reject (Manager Step)',
        icon: ShieldX,
        tone: 'danger',
        disabled: isReviewing.value,
      },
    )
  }

  if (canApproveHRStep(request, currentUser.value) && !hideHrReviewActions.value) {
    items.push(
      {
        key: 'hr_approve',
        label: 'Approve (HR Step)',
        icon: ShieldCheck,
        tone: 'primary',
        disabled: isReviewing.value,
      },
      {
        key: 'hr_reject',
        label: 'Reject (HR Step)',
        icon: ShieldX,
        tone: 'danger',
        disabled: isReviewing.value,
      },
    )
  }

  return items
}

const handleSelfTableAction = async ({
  request,
  actionKey,
}: {
  request: LeaveRequest
  actionKey: string
}) => {
  if (actionKey === 'view') {
    await goToDetailPage(request.id)
    return
  }

  if (actionKey === 'cancel') {
    openPendingAction(request, 'cancel')
  }
}

const handleReviewTableAction = async ({
  request,
  actionKey,
}: {
  request: LeaveRequest
  actionKey: string
}) => {
  if (actionKey === 'view') {
    await goToDetailPage(request.id)
    return
  }

  if (actionKey === 'manager_approve') {
    openPendingAction(request, 'manager_approve')
    return
  }

  if (actionKey === 'manager_reject') {
    openPendingAction(request, 'manager_reject')
    return
  }

  if (actionKey === 'hr_approve') {
    openPendingAction(request, 'hr_approve')
    return
  }

  if (actionKey === 'hr_reject') {
    openPendingAction(request, 'hr_reject')
  }
}

const pendingActionTitle = computed(() => {
  if (!pendingAction.value) {
    return ''
  }

  if (pendingAction.value.actionKey === 'cancel') {
    return 'Cancel Leave Request'
  }

  if (pendingAction.value.actionKey === 'manager_approve') {
    return 'Approve Leave Request (Manager Step)'
  }

  if (pendingAction.value.actionKey === 'manager_reject') {
    return 'Reject Leave Request (Manager Step)'
  }

  if (pendingAction.value.actionKey === 'hr_approve') {
    return 'Approve Leave Request (HR Step)'
  }

  return 'Reject Leave Request (HR Step)'
})

const pendingActionDescription = computed(() => {
  if (!pendingAction.value) {
    return ''
  }

  const request = pendingAction.value.request
  const employeeName = request.employee?.name ?? 'this employee'

  if (pendingAction.value.actionKey === 'cancel') {
    return `Cancel leave request #${request.id} for ${employeeName}? This action is only available while the request is still pending or manager-approved.`
  }

  if (pendingAction.value.actionKey === 'manager_approve') {
    return `Approve leave request #${request.id} for ${employeeName} at the first approval step?`
  }

  if (pendingAction.value.actionKey === 'manager_reject') {
    return `Reject leave request #${request.id} for ${employeeName} at the first approval step?`
  }

  if (pendingAction.value.actionKey === 'hr_approve') {
    return `Finalize HR approval for leave request #${request.id} for ${employeeName}?`
  }

  return `Reject leave request #${request.id} for ${employeeName} at the HR final review step?`
})

const pendingActionConfirmLabel = computed(() => {
  if (!pendingAction.value) {
    return ''
  }

  if (pendingAction.value.actionKey === 'cancel') {
    return 'Cancel Request'
  }

  if (
    pendingAction.value.actionKey === 'manager_approve' ||
    pendingAction.value.actionKey === 'hr_approve'
  ) {
    return 'Approve'
  }

  return 'Reject'
})

const pendingActionConfirmVariant = computed<'primary' | 'danger'>(() => {
  if (
    pendingAction.value?.actionKey === 'manager_reject' ||
    pendingAction.value?.actionKey === 'hr_reject' ||
    pendingAction.value?.actionKey === 'cancel'
  ) {
    return 'danger'
  }

  return 'primary'
})

const handleConfirmPendingAction = async () => {
  if (!pendingAction.value) {
    return
  }

  const { actionKey, request } = pendingAction.value

  if (actionKey === 'cancel') {
    await handleCancelRequest(request)
    return
  }

  if (actionKey === 'manager_approve') {
    await handleManagerReview(request, LEAVE_REQUEST_STATUS.MANAGER_APPROVED)
    return
  }

  if (actionKey === 'manager_reject') {
    await handleManagerReview(request, LEAVE_REQUEST_STATUS.REJECTED)
    return
  }

  if (actionKey === 'hr_approve') {
    await handleHrReview(request, LEAVE_REQUEST_STATUS.HR_APPROVED)
    return
  }

  await handleHrReview(request, LEAVE_REQUEST_STATUS.REJECTED)
}

onMounted(async () => {
  if (!reviewFilters.value.status) {
    reviewFilters.value.status = getLeaveReviewDefaultStatus(currentUser.value)
  }

  await loadPage()
})
</script>

<template>
  <main class="leave-page">
    <div class="leave-header">
      <div>
        <h1 class="leave-title">Leave Requests</h1>
        <p class="leave-subtitle">
          Submit leave requests, review approval progress, and monitor leave balances using the current API contract.
        </p>
      </div>

      <div class="leave-header-actions">
        <BaseButton variant="secondary" @click="loadPage">
          <RefreshCw :size="16" />
          Refresh
        </BaseButton>
        <BaseButton v-if="canShowCreateRequestButton" @click="goToCreatePage">
          <Plus :size="16" />
          New Leave Request
        </BaseButton>
      </div>
    </div>

    <BaseCard v-if="!canCreateRequests && !canReviewRequests" class="leave-state-card">
      <div class="leave-state-body">
        <h3 class="leave-state-title">Leave access is unavailable</h3>
        <p class="leave-state-text">
          This account does not have a leave self-service profile or a review role in the current auth state.
        </p>
      </div>
    </BaseCard>

    <template v-else>
      <section v-if="canCreateRequests" class="leave-section">
        <div class="leave-section-copy">
          <h2 class="leave-section-title">My Leave Requests</h2>
          <p class="leave-section-text">
            Submit a request and review your own leave history, current status, and leave balances.
          </p>
        </div>

        <BaseCard v-if="isLeaveBalancesLoading && !leaveBalances.length" class="leave-inline-state-card">
          <div class="leave-inline-state">
            <h3 class="leave-state-title">Loading leave balances</h3>
            <p class="leave-state-text">
              Fetching your current leave balances from the API.
            </p>
          </div>
        </BaseCard>

        <BaseCard v-else-if="leaveBalancesError" class="leave-inline-state-card">
          <div class="leave-inline-state">
            <h3 class="leave-state-title">Unable to load leave balances</h3>
            <p class="leave-state-text">{{ leaveBalancesError }}</p>
            <BaseButton @click="fetchLeaveBalances">Try Again</BaseButton>
          </div>
        </BaseCard>

        <BaseCard v-else-if="!leaveBalances.length" class="leave-inline-state-card">
          <div class="leave-inline-state">
            <h3 class="leave-state-title">No leave balances available</h3>
            <p class="leave-state-text">
              No leave balance records were returned by the current API response.
            </p>
          </div>
        </BaseCard>

        <LeaveBalanceSummary
          v-else
          :balances="leaveBalances"
          title="Current Leave Balances"
          description="Your leave balances for each leave type returned by the API."
        />

        <div v-if="summaryCards(myRequestSummary).length" class="leave-summary-grid">
          <BaseCard
            v-for="card in summaryCards(myRequestSummary)"
            :key="card.key"
            class="leave-summary-stat-card"
          >
            <span class="leave-summary-stat-label">{{ card.label }}</span>
            <strong class="leave-summary-stat-value">{{ card.value }}</strong>
          </BaseCard>
        </div>

        <BaseCard v-if="leaveTypesError && !leaveTypes.length" class="leave-inline-state-card">
          <div class="leave-inline-state">
            <h3 class="leave-state-title">Unable to load leave types</h3>
            <p class="leave-state-text">{{ leaveTypesError }}</p>
            <BaseButton @click="fetchLeaveTypes">Try Again</BaseButton>
          </div>
        </BaseCard>

        <BaseCard class="leave-filters-card">
          <div class="leave-filters-grid leave-filters-grid-self">
            <BaseDropdown
              v-model="myFilters.type"
              :options="leaveTypeOptions"
              filterable
              label="Leave Type"
            />
            <BaseDropdown
              v-model="myFilters.status"
              :options="statusOptions"
              label="Status"
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

          <div class="leave-filters-actions">
            <BaseButton variant="ghost" @click="handleResetMyFilters">Reset</BaseButton>
            <BaseButton variant="secondary" @click="fetchMyRequests">
              <RefreshCw :size="16" />
              Refresh
            </BaseButton>
            <BaseButton @click="handleApplyMyFilters">Apply Filters</BaseButton>
          </div>
        </BaseCard>

        <BaseCard v-if="myRequestsError && !myRequests" class="leave-inline-state-card">
          <div class="leave-inline-state">
            <h3 class="leave-state-title">Unable to load leave history</h3>
            <p class="leave-state-text">{{ myRequestsError }}</p>
            <BaseButton @click="fetchMyRequests">Try Again</BaseButton>
          </div>
        </BaseCard>

        <BaseCard
          v-else-if="!isMyRequestsLoading && myRequests && !myRequests.data.length"
          class="leave-inline-state-card"
        >
          <div class="leave-inline-state">
            <h3 class="leave-state-title">No leave requests yet</h3>
            <p class="leave-state-text">
              Your leave history is empty for the current filters. Submit a new request to start the approval flow.
            </p>
            <BaseButton v-if="canShowCreateRequestButton" @click="goToCreatePage">
              New Leave Request
            </BaseButton>
          </div>
        </BaseCard>

        <LeaveRequestsTable
          v-else
          :loading="isMyRequestsLoading"
          :requests="myRequests"
          :resolve-actions="resolveSelfActions"
          description="Track your submitted leave requests and cancel eligible requests before final approval."
          empty-text="No leave requests were returned for your current filters."
          title="My Leave History"
          @action="handleSelfTableAction"
          @page-change="handleMyPageChange"
          @per-page-change="handleMyPerPageChange"
        />
      </section>

      <section v-if="canReviewRequests" class="leave-section">
        <div class="leave-section-copy">
          <h2 class="leave-section-title">Review Queue</h2>
          <p class="leave-section-text">{{ reviewSectionDescription }}</p>
        </div>

        <div v-if="summaryCards(reviewRequestSummary).length" class="leave-summary-grid">
          <BaseCard
            v-for="card in summaryCards(reviewRequestSummary)"
            :key="`review-${card.key}`"
            class="leave-summary-stat-card"
          >
            <span class="leave-summary-stat-label">{{ card.label }}</span>
            <strong class="leave-summary-stat-value">{{ card.value }}</strong>
          </BaseCard>
        </div>

        <BaseCard class="leave-filters-card">
          <div class="leave-filters-grid">
            <BaseInput
              v-model="reviewFilters.employee_id"
              label="Employee ID"
              placeholder="Filter by employee ID"
            />
            <BaseDropdown
              v-model="reviewFilters.type"
              :options="leaveTypeOptions"
              filterable
              label="Leave Type"
            />
            <BaseDropdown
              v-model="reviewFilters.status"
              :options="statusOptions"
              label="Status"
            />
            <BaseDatePicker
              v-model="reviewFilters.date_range"
              end-placeholder="To date"
              label="Date Range"
              start-placeholder="From date"
              type="daterange"
              value-format="YYYY-MM-DD"
            />
          </div>

          <div class="leave-filters-actions">
            <BaseButton variant="ghost" @click="handleResetReviewFilters">Reset</BaseButton>
            <BaseButton variant="secondary" @click="fetchReviewRequests">
              <RefreshCw :size="16" />
              Refresh
            </BaseButton>
            <BaseButton @click="handleApplyReviewFilters">Apply Filters</BaseButton>
          </div>
        </BaseCard>

        <BaseCard v-if="reviewRequestsError && !reviewRequests" class="leave-inline-state-card">
          <div class="leave-inline-state">
            <h3 class="leave-state-title">Unable to load review queue</h3>
            <p class="leave-state-text">{{ reviewRequestsError }}</p>
            <BaseButton @click="fetchReviewRequests">Try Again</BaseButton>
          </div>
        </BaseCard>

        <LeaveRequestsTable
          v-else
          :loading="isReviewRequestsLoading"
          :requests="reviewRequests"
          :resolve-actions="resolveReviewActions"
          description="Use the shared leave request list to review assigned first-step approvals and HR final approvals."
          empty-text="No reviewable leave requests matched the current filters."
          :show-employee-column="true"
          title="Leave Review List"
          @action="handleReviewTableAction"
          @page-change="handleReviewPageChange"
          @per-page-change="handleReviewPerPageChange"
        />

        <BaseCard
          v-if="isAdminRole && !hasNamedRole(currentUser, ROLES.MANAGER) && !hasNamedRole(currentUser, ROLES.HR)"
          class="leave-inline-state-card"
        >
          <div class="leave-inline-state">
            <h3 class="leave-state-title">Admin oversight mode</h3>
            <p class="leave-state-text">
              Admin can inspect the review queue here, but approval actions only appear for the assigned first approver or users with leave.approve.hr.
            </p>
          </div>
        </BaseCard>
      </section>
    </template>

    <LeaveRequestActionModal
      :confirm-label="pendingActionConfirmLabel"
      :confirm-variant="pendingActionConfirmVariant"
      :description="pendingActionDescription"
      :loading="isCancelling || isReviewing"
      :open="Boolean(pendingAction)"
      :title="pendingActionTitle"
      @close="closePendingAction"
      @confirm="handleConfirmPendingAction"
    />
  </main>
</template>

<style scoped>
.leave-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.leave-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.leave-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.leave-title,
.leave-section-title,
.leave-state-title {
  color: hsl(var(--foreground));
}

.leave-subtitle,
.leave-section-text,
.leave-state-text {
  color: hsl(var(--muted-foreground));
}

.leave-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.leave-section-copy {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.leave-filters-card {
  overflow: hidden;
}

.leave-filters-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  padding: 1.25rem;
}

.leave-filters-grid-self {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.leave-filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0 1.25rem 1.25rem;
}

.leave-state-card,
.leave-inline-state-card {
  overflow: hidden;
}

.leave-summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.75rem;
}

.leave-summary-stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem;
}

.leave-summary-stat-label {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-xs);
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.leave-summary-stat-value {
  color: hsl(var(--foreground));
  font-size: 1.5rem;
  line-height: 1;
}

.leave-state-body,
.leave-inline-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 14rem;
  padding: 1.5rem;
  text-align: center;
}

.leave-inline-state {
  min-height: 12rem;
}

@media (max-width: 768px) {
  .leave-header {
    flex-direction: column;
  }

  .leave-header-actions {
    width: 100%;
    flex-wrap: wrap;
  }

  .leave-filters-grid,
  .leave-filters-grid-self {
    grid-template-columns: 1fr;
  }

  .leave-summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .leave-filters-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
</style>
