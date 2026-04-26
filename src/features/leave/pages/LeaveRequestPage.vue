<script setup lang="ts">
import { ArrowLeft, Send } from 'lucide-vue-next'
import { useRouter } from 'vue-router'

import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseRadioGroup from '@/components/ui/BaseRadioGroup.vue'
import BaseSelect, { type BaseSelectOption } from '@/components/ui/BaseSelect.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'

import { useLeave } from '../composable/useLeave'
import { useLeaveRequestForm } from '../composable/useLeaveRequestForm'
import { LEAVE_DURATION } from '../interface/leave.interface'
import {
  buildLeaveTypeOptionLabel,
  getLeaveTypeCompensationLabel,
  getLeaveRequestErrorMessage,
  isLeaveTypeDisabledForEmployee,
  resolveLeaveTypePaidStatus,
} from '../utils/leave'

const router = useRouter()

const {
  employee,
  canViewSelfLeaveBalances,
  canViewSelfLeaveRequests,
  canCreateRequests,
  leaveTypes,
  leaveBalances,
  pendingRequests,
  publicHolidays,
  isLeaveTypesLoading,
  isLeaveBalancesLoading,
  isPendingRequestsLoading,
  isPublicHolidaysLoading,
  isSubmitting,
  leaveTypesError,
  leaveBalancesError,
  pendingRequestsError,
  publicHolidaysError,
  fetchLeaveTypes,
  fetchLeaveBalances,
  fetchPendingRequests,
  fetchPublicHolidays,
  submitLeaveRequest,
} = useLeave()

const {
  form,
  errors,
  selectedLeaveType,
  estimatedRequestedDays,
  hasSelectedDates,
  estimatedNoticeDays,
  selectedLeaveBalance,
  probationMessage,
  noticeMessage,
  isHalfDaySupported,
  isPublicHolidayDate,
  summaryTitle,
  limitLabel,
  compensationLabel,
  ruleNotices,
  validate,
  buildSubmitPayload,
  durationOptions,
  halfDaySessionOptions,
} = useLeaveRequestForm({
  leaveBalances: () => leaveBalances.value,
  leaveTypes: () => leaveTypes.value,
  publicHolidays: () => publicHolidays.value,
  employeeEmploymentType: () => employee.value?.employment_type ?? null,
})

const leaveTypeOptions = computed<BaseSelectOption[]>(() =>
  leaveTypes.value.map((leaveType) => ({
    label: buildLeaveTypeOptionLabel({
      employmentType: employee.value?.employment_type ?? null,
      leaveType,
    }),
    value: leaveType.code,
    disabled: isLeaveTypeDisabledForEmployee({
      employmentType: employee.value?.employment_type ?? null,
      leaveType,
    }),
  })),
)

const isInitialLoading = computed(() => {
  return (
    (isLeaveTypesLoading.value && !leaveTypes.value.length) ||
    (isPublicHolidaysLoading.value && !publicHolidays.value.length) ||
    (canViewSelfLeaveBalances.value && isLeaveBalancesLoading.value && !leaveBalances.value.length) ||
    (canViewSelfLeaveRequests.value && isPendingRequestsLoading.value && !pendingRequests.value)
  )
})

const hasPendingRequest = computed(() => {
  if (!pendingRequests.value) {
    return false
  }

  return pendingRequests.value.total > 0 || pendingRequests.value.data.length > 0
})

const noticeRuleSummary = computed(() => {
  if (!hasSelectedDates.value) {
    return '--'
  }

  if (!selectedLeaveType.value) {
    return '--'
  }

  if (estimatedNoticeDays.value) {
    return `${estimatedNoticeDays.value} days notice`
  }

  if (Array.isArray(selectedLeaveType.value.notice_rules) && selectedLeaveType.value.notice_rules.length) {
    return '3 or 7 days'
  }

  return 'None'
})

const isSelectedLeavePaid = computed(() => resolveLeaveTypePaidStatus(selectedLeaveType.value))
const isSelectedLeaveBalanceTracked = computed(() => {
  return Boolean(
    selectedLeaveType.value?.requires_balance || selectedLeaveBalance.value || limitLabel.value,
  )
})
const selectedLeaveCompensationLabel = computed(() => {
  return compensationLabel.value || getLeaveTypeCompensationLabel(selectedLeaveType.value)
})

const balanceMetricValue = computed(() => {
  if (!selectedLeaveType.value) {
    return '--'
  }

  if (isLeaveBalancesLoading.value && !leaveBalances.value.length) {
    return 'Loading...'
  }

  if (leaveBalancesError.value) {
    return 'Unavailable'
  }

  if (!selectedLeaveBalance.value) {
    return 'No data'
  }

  if (typeof selectedLeaveBalance.value.remaining_days === 'number') {
    return String(selectedLeaveBalance.value.remaining_days)
  }

  return '--'
})

const balanceMetricHelper = computed(() => {
  if (!selectedLeaveType.value) {
    return limitLabel.value
  }

  if (isLeaveBalancesLoading.value && !leaveBalances.value.length) {
    return 'Loading current balance from API'
  }

  if (leaveBalancesError.value) {
    return leaveBalancesError.value
  }

  if (!selectedLeaveBalance.value) {
    return 'No balance data returned for this leave type.'
  }

  if (selectedLeaveBalance.value.remaining_days === null) {
    return 'This leave type does not deduct from balance.'
  }

  return limitLabel.value || `Used ${selectedLeaveBalance.value.used_days} of ${selectedLeaveBalance.value.total_days ?? '--'} days`
})

const loadPage = async () => {
  const tasks: Array<Promise<unknown>> = [fetchLeaveTypes(), fetchPublicHolidays()]

  if (canViewSelfLeaveBalances.value) {
    tasks.push(fetchLeaveBalances())
  }

  if (canViewSelfLeaveRequests.value || canCreateRequests.value) {
    tasks.push(fetchPendingRequests())
  }

  try {
    await Promise.all(tasks)
  } catch {
    // Individual UI sections handle their own error state.
  }
}

const goBack = async () => {
  await router.push({ name: 'leave' })
}

const handleSubmit = async () => {
  if (!validate()) {
    return
  }

  try {
    const response = await submitLeaveRequest(buildSubmitPayload())
    ElMessage.success(response.message)
    await router.push({ name: 'leave' })
  } catch (error) {
    ElMessage.error(getLeaveRequestErrorMessage(error))
  }
}

onMounted(async () => {
  await loadPage()
})
</script>

<template>
  <main class="leave-request-page">
    <div class="leave-request-header">
      <div class="leave-request-header-copy">
        <BaseButton variant="ghost" @click="goBack">
          <ArrowLeft :size="16" />
          Back to Leave Requests
        </BaseButton>
        <div class="leave-request-title-block">
          <h1 class="leave-request-title">Request Leave</h1>
          <p class="leave-request-subtitle">
            Fill in the form to request leave and review your current balance.
          </p>
        </div>
      </div>
    </div>

    <BaseCard v-if="!canCreateRequests" class="leave-request-state-card">
      <div class="leave-request-state">
        <h2 class="leave-request-state-title">Leave requests are unavailable</h2>
        <p class="leave-request-state-text">
          This account does not currently have permission to create leave requests.
        </p>
        <BaseButton variant="ghost" @click="goBack">Back to Leave Requests</BaseButton>
      </div>
    </BaseCard>

    <BaseCard v-else-if="isInitialLoading" class="leave-request-state-card">
      <div class="leave-request-state">
        <h2 class="leave-request-state-title">Loading leave form</h2>
        <p class="leave-request-state-text">
          Loading leave types, balances, and pending requests.
        </p>
      </div>
    </BaseCard>

    <BaseCard
      v-else-if="(leaveTypesError && !leaveTypes.length) || (publicHolidaysError && !publicHolidays.length)"
      class="leave-request-state-card"
    >
      <div class="leave-request-state">
        <h2 class="leave-request-state-title">Unable to load leave request form</h2>
        <p class="leave-request-state-text">{{ leaveTypesError || publicHolidaysError }}</p>
        <div class="leave-request-state-actions">
          <BaseButton variant="ghost" @click="goBack">Back</BaseButton>
          <BaseButton @click="loadPage">Try Again</BaseButton>
        </div>
      </div>
    </BaseCard>

    <BaseCard
      v-else-if="(canViewSelfLeaveRequests || canCreateRequests) && pendingRequestsError && !pendingRequests"
      class="leave-request-state-card"
    >
      <div class="leave-request-state">
        <h2 class="leave-request-state-title">Unable to verify pending requests</h2>
        <p class="leave-request-state-text">{{ pendingRequestsError }}</p>
        <div class="leave-request-state-actions">
          <BaseButton variant="ghost" @click="goBack">Back</BaseButton>
          <BaseButton @click="loadPage">Try Again</BaseButton>
        </div>
      </div>
    </BaseCard>

    <BaseCard v-else-if="(canViewSelfLeaveRequests || canCreateRequests) && hasPendingRequest" class="leave-request-state-card">
      <div class="leave-request-state">
        <h2 class="leave-request-state-title">You already have a pending request</h2>
        <p class="leave-request-state-text">
          You cannot create a new leave request until your current pending request is reviewed.
        </p>
        <BaseButton variant="ghost" @click="goBack">Back to Leave Requests</BaseButton>
      </div>
    </BaseCard>

    <BaseCard v-else class="leave-request-card">
      <div class="leave-request-body">
        <div v-if="probationMessage" class="leave-request-notice leave-request-notice-warning">
          <p>{{ probationMessage }}</p>
        </div>

        <div v-if="leaveBalancesError" class="leave-request-notice">
          <p>
            Current leave balances could not be loaded right now. You can still review the form, but balance information is unavailable.
          </p>
        </div>

        <div class="grid grid-cols-1 items-start gap-6 xl:grid-cols-2">
          <div class="flex min-w-0 flex-col gap-4">
            <BaseSelect
              v-model="form.type"
              :error="errors.type"
              :options="leaveTypeOptions"
              label="Leave Type"
              placeholder="Select leave type"
              required
            />

            <div class="grid gap-4">
              <div class="leave-request-field">
                <BaseDatePicker
                  v-model="form.start_date"
                  :disabled-date="isPublicHolidayDate"
                  label="Start Date"
                  required
                  type="date"
                  value-format="YYYY-MM-DD"
                />
                <p v-if="errors.start_date" class="leave-request-error">{{ errors.start_date }}</p>
              </div>

              <div v-if="form.duration_type === LEAVE_DURATION.FULL_DAY" class="leave-request-field">
                <BaseDatePicker
                  v-model="form.end_date"
                  :disabled-date="isPublicHolidayDate"
                  label="End Date"
                  required
                  type="date"
                  value-format="YYYY-MM-DD"
                />
                <p v-if="errors.end_date" class="leave-request-error">{{ errors.end_date }}</p>
              </div>

              <div v-else class="leave-request-inline-note">
                <span class="leave-request-inline-note-label">End Date</span>
                <p>Half-day leave always uses the same date as the selected start date.</p>
                <p v-if="errors.end_date" class="leave-request-error">{{ errors.end_date }}</p>
              </div>
            </div>

            <BaseTextarea
              v-model="form.reason"
              :error="errors.reason"
              label="Reason"
              placeholder="Enter the reason for this leave request."
              required
            />
          </div>

          <div class="flex min-w-0 flex-col gap-4">
            <div class="space-y-2">
              <BaseRadioGroup
                v-model="form.duration_type"
                :error="errors.duration_type"
                :options="durationOptions"
                density="compact"
                label="Duration"
                orientation="row"
                required
              />

              <p
                v-if="selectedLeaveType && form.duration_type === LEAVE_DURATION.HALF_DAY && !isHalfDaySupported"
                class="leave-summary-fallback"
              >
                {{ selectedLeaveType.request_restriction_reason || 'Half-day leave is not supported for this leave type.' }}
              </p>
            </div>

            <BaseRadioGroup
              v-if="form.duration_type === LEAVE_DURATION.HALF_DAY"
              v-model="form.half_day_session"
              :error="errors.half_day_session"
              :options="halfDaySessionOptions"
              density="compact"
              label="Half-Day Session"
              orientation="row"
              required
            />

            <BaseCard class="overflow-hidden">
              <div class="flex flex-col gap-4 p-4">
                <div class="flex items-start justify-between gap-3">
                  <div class="min-w-0">
                    <h2 class="text-base font-semibold text-slate-900">
                      {{ summaryTitle }}
                    </h2>
                  </div>

                  <div v-if="selectedLeaveType" class="flex flex-wrap justify-end gap-2">
                    <BaseBadge :variant="isSelectedLeavePaid ? 'success' : 'default'">
                      {{ selectedLeaveCompensationLabel }}
                    </BaseBadge>
                    <BaseBadge :variant="isSelectedLeaveBalanceTracked ? 'warning' : 'default'">
                      {{ isSelectedLeaveBalanceTracked ? 'Balance Required' : 'No Balance Deduction' }}
                    </BaseBadge>
                  </div>
                </div>

                <div class="grid grid-cols-2 gap-3">
                  <div class="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p class="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Estimated Days
                    </p>
                    <p class="mt-1 text-base font-semibold text-slate-900">
                      {{ estimatedRequestedDays }}
                    </p>
                  </div>

                  <div class="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p class="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Notice Rule
                    </p>
                    <p
                      class="mt-1 text-base font-semibold"
                      :class="hasSelectedDates ? 'text-slate-900' : 'text-slate-400'"
                    >
                      {{ noticeRuleSummary }}
                    </p>
                  </div>

                  <div class="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p class="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Balance
                    </p>
                    <p class="mt-1 text-base font-semibold text-slate-900">
                      {{ balanceMetricValue }}
                    </p>
                    <p v-if="balanceMetricHelper" class="mt-1 text-xs text-slate-500">
                      {{ balanceMetricHelper }}
                    </p>
                  </div>

                  <div class="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
                    <p class="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                      Weekends
                    </p>
                    <p class="mt-1 text-base font-semibold text-slate-900">
                      {{ selectedLeaveType?.auto_exclude_weekends ? 'Excluded' : 'Counted' }}
                    </p>
                  </div>
                </div>

                <div v-if="hasSelectedDates" class="space-y-2">
                  <p class="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                    Rule Notices
                  </p>

                  <ul v-if="ruleNotices.length" class="space-y-2">
                    <li
                      v-for="notice in ruleNotices"
                      :key="notice"
                      class="flex items-start gap-2 rounded-lg border border-slate-200 bg-white p-2.5 text-sm text-slate-700"
                    >
                      <span class="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-slate-400" />
                      <span>{{ notice }}</span>
                    </li>
                  </ul>

                  <div
                    v-else
                    class="rounded-lg border border-dashed border-slate-200 bg-slate-50/70 p-3 text-sm text-slate-500"
                  >
                    {{ noticeMessage }}
                  </div>
                </div>
              </div>
            </BaseCard>
          </div>
        </div>

        <div v-if="selectedLeaveType" class="leave-policy-card">
          <div class="leave-policy-header">
            <div>
              <h2 class="leave-policy-title">Leave Rules</h2>
              <p class="leave-policy-text">
                Rules that apply to this leave type.
              </p>
            </div>
          </div>

          <div class="leave-policy-grid">
            <div class="leave-policy-item">
              <span class="leave-policy-label">Public Holidays</span>
              <strong class="leave-policy-value">
                {{ selectedLeaveType.auto_exclude_public_holidays ? 'Excluded by company policy' : 'Counted in request' }}
              </strong>
            </div>
            <div class="leave-policy-item">
              <span class="leave-policy-label">Weekends</span>
              <strong class="leave-policy-value">
                {{ selectedLeaveType.auto_exclude_weekends ? 'Excluded in estimate' : 'Counted in estimate' }}
              </strong>
            </div>
            <div class="leave-policy-item">
              <span class="leave-policy-label">Max Days Per Request</span>
              <strong class="leave-policy-value">{{ selectedLeaveType.max_days_per_request ?? '--' }}</strong>
            </div>
          </div>
        </div>
      </div>

      <div class="leave-request-footer">
        <BaseButton variant="ghost" @click="goBack">Cancel</BaseButton>
        <BaseButton :loading="isSubmitting" @click="handleSubmit">
          <Send :size="16" />
          Send Request
        </BaseButton>
      </div>
    </BaseCard>
  </main>
</template>

<style scoped>
.leave-request-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.leave-request-header,
.leave-request-header-copy,
.leave-request-title-block,
.leave-request-body,
.leave-request-state {
  display: flex;
  flex-direction: column;
}

.leave-request-header-copy,
.leave-request-title-block,
.leave-request-state {
  gap: 0.5rem;
}

.leave-request-title,
.leave-request-state-title,
.leave-summary-title,
.leave-policy-title {
  color: hsl(var(--foreground));
}

.leave-request-subtitle,
.leave-request-state-text,
.leave-summary-label,
.leave-policy-text,
.leave-policy-label {
  color: hsl(var(--muted-foreground));
}

.leave-request-card {
  overflow: hidden;
}

.leave-request-body {
  gap: 1rem;
  padding: 1.25rem;
}

.leave-request-field {
  display: flex;
  flex-direction: column;
}

.leave-request-error {
  margin-top: 0.7rem;
  color: hsl(var(--destructive));
  font-size: var(--text-xs);
}

.leave-request-inline-note {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.875rem;
  border: 1px dashed hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--secondary) / 0.18);
  color: hsl(var(--muted-foreground));
  font-size: var(--text-sm);
}

.leave-request-inline-note-label {
  color: hsl(var(--foreground));
  font-size: var(--text-xs);
  font-weight: 600;
}

.leave-request-notice {
  padding: 0.75rem 0.875rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--secondary) / 0.18);
  color: hsl(var(--foreground));
  font-size: var(--text-sm);
}

.leave-request-notice-warning {
  border-color: hsl(var(--warning) / 0.2);
  background: hsl(var(--warning) / 0.12);
}

.leave-request-state-card {
  overflow: hidden;
}

.leave-request-state {
  align-items: center;
  justify-content: center;
  min-height: 16rem;
  padding: 1.5rem;
  text-align: center;
}

.leave-request-state-actions {
  display: flex;
  gap: 0.75rem;
}

.leave-summary-card {
  padding: 0.875rem;
}

.leave-summary-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.leave-summary-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  justify-content: flex-end;
}

.leave-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.625rem;
  margin-top: 0.875rem;
}

.leave-summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--secondary) / 0.18);
}

.leave-summary-value,
.leave-policy-value {
  color: hsl(var(--foreground));
  font-size: var(--text-sm);
}

.leave-summary-notices {
  display: grid;
  gap: 0.5rem;
  margin: 0.875rem 0 0;
  padding: 0;
  list-style: none;
}

.leave-summary-notice-item {
  padding: 0.625rem 0.75rem;
  border-radius: var(--radius);
  background: hsl(var(--secondary) / 0.22);
  color: hsl(var(--foreground));
  font-size: var(--text-sm);
  line-height: 1.4;
}

.leave-summary-fallback {
  margin-top: 0.875rem;
  color: hsl(var(--muted-foreground));
  font-size: var(--text-sm);
}

.leave-policy-card {
  border: 1px solid hsl(var(--border-gray));
  border-radius: calc(var(--radius) + 0.1rem);
  background: hsl(var(--secondary) / 0.12);
  padding: 0.875rem;
}

.leave-policy-header {
  margin-bottom: 0.75rem;
}

.leave-policy-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.625rem;
}

.leave-policy-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.75rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--card));
}

.leave-request-footer {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  padding: 0 1.25rem 1.25rem;
}

@media (max-width: 960px) {
  .leave-policy-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .leave-summary-grid,
  .leave-policy-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .leave-request-footer,
  .leave-request-state-actions {
    flex-wrap: wrap;
    justify-content: flex-start;
  }
}
</style>
