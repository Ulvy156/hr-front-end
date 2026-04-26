<script setup lang="ts">
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
} from '../utils/leave'

const router = useRouter()

const {
  currentUser,
  employee,
  canViewSelfLeaveBalances,
  canViewSelfLeaveRequests,
  canCreateRequests,
  canReviewRequests,
  canManagerApproveRequests,
  canHrApproveRequests,
  canViewAnyReviewQueue,
  canViewAssignedReviewQueue,
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
  fetchPendingRequests,
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
const canCurrentUserHrApprove = computed(() => canHrApproveRequests.value)
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
const canShowSelfServiceSection = computed(() => {
  return canViewSelfLeaveRequests.value || canViewSelfLeaveBalances.value || canCreateRequests.value
})
const reviewSectionDescription = computed(() => {
  if (canCurrentUserHrApprove.value) {
    return 'Review manager-approved leave requests and complete final HR approval.'
  }

  if (canViewAnyReviewQueue.value) {
    return 'Review leave requests across the organization using the permissions assigned to your account.'
  }

  if (canViewAssignedReviewQueue.value || canManagerApproveRequests.value) {
    return 'Review leave requests assigned to you for the first approval step before HR final approval.'
  }

  return 'View leave requests across the organization using the current filters.'
})

const loadPage = async () => {
  const tasks: Array<Promise<unknown>> = [fetchLeaveTypes()]

  if (canViewSelfLeaveBalances.value) {
    tasks.push(fetchLeaveBalances())
  }

  if (canViewSelfLeaveRequests.value || canCreateRequests.value) {
    tasks.push(fetchMyRequests())
  }

  if (canCreateRequests.value) {
    tasks.push(fetchPendingRequests())
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
    {
      key: 'total',
      label: 'Total Requests',
      value: summary.total_requests,
      helper: 'Across the current view',
    },
    {
      key: 'pending',
      label: 'Pending',
      value: summary.pending_count,
      helper: 'Awaiting action',
    },
    {
      key: 'approved',
      label: 'Approved',
      value: summary.approved_count,
      helper: 'Completed requests',
    },
    {
      key: 'rejected',
      label: 'Rejected',
      value: summary.rejected_count,
      helper: 'Closed without approval',
    },
    {
      key: 'cancelled',
      label: 'Cancelled',
      value: summary.cancelled_count,
      helper: 'Withdrawn requests',
    },
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
    ElMessage.success(response.message)
    closePendingAction()
  } catch (err) {
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

  if (canApproveHRStep(request, currentUser.value)) {
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
    <BaseCard v-if="!canShowSelfServiceSection && !canReviewRequests" class="leave-state-card">
      <div class="leave-state-body">
        <h1 class="leave-title">Leave Requests</h1>
        <p class="leave-state-text">
          Leave access is unavailable for this account. This user does not currently have permission to create requests or review the leave queue.
        </p>
      </div>
    </BaseCard>

    <template v-else>
      <section v-if="canShowSelfServiceSection" class="leave-section leave-section-primary">
        <div class="leave-section-heading">
          <div class="leave-section-copy">
            <h2 class="leave-section-title">My Leave Requests</h2>
            <p class="leave-section-text">
              Submit a request and review your leave history and balances.
            </p>
          </div>
          <div class="leave-section-side">
            <p v-if="myRequestSummary" class="leave-section-pill">
              {{ myRequestSummary.total_requests }} tracked
            </p>
            <div class="leave-section-actions">
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
        </div>

        <BaseCard v-if="canViewSelfLeaveBalances && isLeaveBalancesLoading && !leaveBalances.length" class="leave-inline-state-card">
          <div class="leave-inline-state">
            <h3 class="leave-state-title">Loading leave balances</h3>
            <p class="leave-state-text">
              Fetching your current leave balances from the API.
            </p>
          </div>
        </BaseCard>

        <BaseCard v-else-if="canViewSelfLeaveBalances && leaveBalancesError" class="leave-inline-state-card">
          <div class="leave-inline-state">
            <h3 class="leave-state-title">Unable to load leave balances</h3>
            <p class="leave-state-text">{{ leaveBalancesError }}</p>
            <BaseButton @click="fetchLeaveBalances">Try Again</BaseButton>
          </div>
        </BaseCard>

        <BaseCard v-else-if="canViewSelfLeaveBalances && !leaveBalances.length" class="leave-inline-state-card">
          <div class="leave-inline-state">
            <h3 class="leave-state-title">No leave balances available</h3>
            <p class="leave-state-text">
              No leave balance records were returned by the current API response.
            </p>
          </div>
        </BaseCard>

        <LeaveBalanceSummary
          v-else-if="canViewSelfLeaveBalances"
          :balances="leaveBalances"
          title="Leave Balances"
          description="Current balances from your employee profile."
        />

        <div v-if="summaryCards(myRequestSummary).length" class="leave-summary-grid">
          <BaseCard
            v-for="card in summaryCards(myRequestSummary)"
            :key="card.key"
            :class="['leave-summary-stat-card', `leave-summary-stat-card-${card.key}`]"
          >
            <div class="leave-summary-stat-head">
              <span class="leave-summary-stat-label">{{ card.label }}</span>
              <span class="leave-summary-stat-dot" />
            </div>
            <strong class="leave-summary-stat-value">{{ card.value }}</strong>
            <p class="leave-summary-stat-helper">{{ card.helper }}</p>
          </BaseCard>
        </div>

        <BaseCard v-if="leaveTypesError && !leaveTypes.length" class="leave-inline-state-card">
          <div class="leave-inline-state">
            <h3 class="leave-state-title">Unable to load leave types</h3>
            <p class="leave-state-text">{{ leaveTypesError }}</p>
            <BaseButton @click="fetchLeaveTypes">Try Again</BaseButton>
          </div>
        </BaseCard>

        <BaseCard v-if="canViewSelfLeaveRequests || canCreateRequests" class="leave-filters-card">
          <div class="leave-filters-copy">
            <h3 class="leave-filters-title">Refine your history</h3>
            <p class="leave-filters-text">
              Filter by type, status, and date range.
            </p>
          </div>

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

        <BaseCard v-if="(canViewSelfLeaveRequests || canCreateRequests) && myRequestsError && !myRequests" class="leave-inline-state-card">
          <div class="leave-inline-state">
            <h3 class="leave-state-title">Unable to load leave history</h3>
            <p class="leave-state-text">{{ myRequestsError }}</p>
            <BaseButton @click="fetchMyRequests">Try Again</BaseButton>
          </div>
        </BaseCard>

        <BaseCard
          v-else-if="(canViewSelfLeaveRequests || canCreateRequests) && !isMyRequestsLoading && myRequests && !myRequests.data.length"
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
          v-else-if="canViewSelfLeaveRequests || canCreateRequests"
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

      <section v-if="canReviewRequests" class="leave-section leave-section-review">
        <div class="leave-section-heading">
          <div class="leave-section-copy">
            <h2 class="leave-section-title">Review Queue</h2>
            <p class="leave-section-text">{{ reviewSectionDescription }}</p>
          </div>
          <div class="leave-section-side">
            <p v-if="reviewRequestSummary" class="leave-section-pill">
              {{ reviewRequestSummary.total_requests }} in queue
            </p>
            <div v-if="!canShowSelfServiceSection" class="leave-section-actions">
              <BaseButton variant="secondary" @click="loadPage">
                <RefreshCw :size="16" />
                Refresh
              </BaseButton>
            </div>
          </div>
        </div>

        <div v-if="summaryCards(reviewRequestSummary).length" class="leave-summary-grid">
          <BaseCard
            v-for="card in summaryCards(reviewRequestSummary)"
            :key="`review-${card.key}`"
            :class="['leave-summary-stat-card', `leave-summary-stat-card-${card.key}`]"
          >
            <div class="leave-summary-stat-head">
              <span class="leave-summary-stat-label">{{ card.label }}</span>
              <span class="leave-summary-stat-dot" />
            </div>
            <strong class="leave-summary-stat-value">{{ card.value }}</strong>
            <p class="leave-summary-stat-helper">{{ card.helper }}</p>
          </BaseCard>
        </div>

        <BaseCard class="leave-filters-card">
          <div class="leave-filters-copy">
            <h3 class="leave-filters-title">Refine the queue</h3>
            <p class="leave-filters-text">
              Filter by employee, leave type, status, and date range.
            </p>
          </div>

          <div class="leave-filters-grid">
            <BaseInput
              v-model="reviewFilters.employee_id"
              label="Employee ID"
              placeholder="Filter by employee ID"
              size="large"
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
          v-if="canViewAnyReviewQueue && !canCurrentUserHrApprove"
          class="leave-inline-state-card"
        >
          <div class="leave-inline-state">
            <h3 class="leave-state-title">Review oversight mode</h3>
            <p class="leave-state-text">
              You can inspect the shared review queue here, but approval actions only appear for the assigned first approver or users with leave.approve.hr.
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
  gap: 1.2rem;
}

.leave-filters-card,
.leave-state-card,
.leave-inline-state-card {
  overflow: hidden;
}

.leave-section-copy,
.leave-filters-copy {
  display: flex;
  flex-direction: column;
}

.leave-section-copy,
.leave-filters-copy {
  gap: 0.3rem;
}

.leave-summary-stat-label {
  color: hsl(var(--primary));
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.leave-section-side,
.leave-section-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.leave-section-side {
  justify-content: flex-end;
}

.leave-section-actions {
  justify-content: flex-end;
}

.leave-title {
  font-size: clamp(2rem, 2.3vw, 2.45rem);
  font-weight: 800;
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.leave-title,
.leave-section-title,
.leave-filters-title,
.leave-state-title {
  color: hsl(var(--foreground));
}

.leave-subtitle,
.leave-section-text,
.leave-state-text {
  color: hsl(var(--muted-foreground));
}

.leave-subtitle {
  max-width: 46rem;
  font-size: 0.97rem;
  line-height: 1.55;
}

.leave-section {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.leave-section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.leave-section-title {
  font-size: 1.28rem;
  font-weight: 700;
  line-height: 1.15;
}

.leave-section-text,
.leave-filters-text {
  max-width: 46rem;
  line-height: 1.5;
}

.leave-section-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  flex-shrink: 0;
  padding: 0.45rem 0.8rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 999px;
  background: hsl(var(--secondary) / 0.24);
  color: hsl(var(--foreground));
  font-size: var(--text-xs);
  font-weight: 700;
}

.leave-filters-copy {
  padding: 1.15rem 1.25rem 0;
}

.leave-filters-title {
  font-size: 1rem;
  font-weight: 700;
  line-height: 1.2;
}

.leave-filters-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
  padding: 1rem 1.25rem 1.1rem;
}

.leave-filters-grid-self {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.leave-filters-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0 1.25rem 1.15rem;
}

.leave-summary-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.85rem;
}

.leave-summary-stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
  min-height: 9rem;
  padding: 1rem 1rem 1.05rem;
  overflow: hidden;
  position: relative;
  background: linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.18) 100%);
}

.leave-summary-stat-card::before {
  content: '';
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.15) 100%);
}

.leave-summary-stat-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.leave-summary-stat-dot {
  width: 0.6rem;
  height: 0.6rem;
  border-radius: 999px;
  background: hsl(var(--primary) / 0.4);
  flex-shrink: 0;
}

.leave-summary-stat-label {
  color: hsl(var(--muted-foreground));
}

.leave-summary-stat-value {
  color: hsl(var(--foreground));
  font-size: clamp(1.6rem, 1.2rem + 1vw, 2.1rem);
  line-height: 1.05;
  letter-spacing: -0.03em;
}

.leave-summary-stat-helper {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-sm);
  line-height: 1.45;
}

.leave-summary-stat-card-pending .leave-summary-stat-dot {
  background: hsl(var(--warning, 38 92% 50%) / 0.6);
}

.leave-summary-stat-card-approved .leave-summary-stat-dot {
  background: hsl(var(--success, 142 76% 36%) / 0.6);
}

.leave-summary-stat-card-rejected .leave-summary-stat-dot,
.leave-summary-stat-card-cancelled .leave-summary-stat-dot {
  background: hsl(var(--destructive) / 0.55);
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
  background: linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.1) 100%);
}

.leave-inline-state {
  min-height: 12rem;
}

@media (max-width: 768px) {
  .leave-section-heading {
    width: 100%;
    flex-direction: column;
    align-items: flex-start;
  }

  .leave-section-side,
  .leave-section-actions {
    width: 100%;
    justify-content: flex-start;
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
