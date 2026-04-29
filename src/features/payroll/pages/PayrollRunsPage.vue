<script setup lang="ts">
import type { Component } from 'vue'
import { useRouter } from 'vue-router'
import { Check, Download, Eye, Plus, RefreshCw, RotateCcw, Wallet, XCircle } from 'lucide-vue-next'

import type { ActionMenuItem } from '@/components/ui/ActionMenu.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import ConfirmActionModal from '@/components/ui/ConfirmActionModal.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import { PERMISSIONS } from '@/constants/permissions'
import { usePermission } from '@/features/auth/composable/usePermission'

import PayrollMissingSalaryModal from '../components/PayrollMissingSalaryModal.vue'
import PayrollRunsTable from '../components/PayrollRunsTable.vue'
import { usePayroll } from '../composable/usePayroll'
import type {
  PayrollRun,
  PayrollRunFiltersState,
  PayrollRunListParams,
} from '../interface/payroll.interface'
import { PAYROLL_RUN_STATUS } from '../interface/payroll.interface'
import {
  canApprovePayrollRun,
  canCancelPayrollRun,
  canMarkPayrollRunPaid,
  canRegeneratePayrollRun,
  createDefaultPayrollRunFilters,
  formatPayrollMonthLabel,
  formatPayrollStatusLabel,
  getCurrentPayrollMonth,
  getPayrollRequestErrorMessage,
} from '../utils/payroll'

type PayrollRunActionCommand = 'approve' | 'cancel' | 'mark-paid' | 'regenerate' | 'export'
type PayrollRunMutationActionCommand = Exclude<PayrollRunActionCommand, 'export'>
type PayrollRunConfirmationStatus = 'primary' | 'success' | 'warning' | 'danger'
type PayrollRunConfirmationState = {
  run: PayrollRun
  action: PayrollRunMutationActionCommand
}
type PayrollRunMutationActionConfig = {
  title: string
  message: string
  detail: string
  statusLabel: string
  status: PayrollRunConfirmationStatus
  icon: Component
  actionLabel: string
  actionVariant: 'primary' | 'danger'
  callback: () => Promise<unknown>
  successMessage: string
  errorMessage: string
}

const { hasPermission } = usePermission()
const canGeneratePayrollRuns = computed(() => hasPermission(PERMISSIONS.PAYROLL_RUN_GENERATE))
const canViewPayrollSalaries = computed(() => hasPermission(PERMISSIONS.PAYROLL_SALARY_VIEW))
const canApproveRuns = computed(() => hasPermission(PERMISSIONS.PAYROLL_RUN_APPROVE))
const canMarkRunsPaid = computed(() => hasPermission(PERMISSIONS.PAYROLL_RUN_MARK_PAID))
const canCancelRuns = computed(() => hasPermission(PERMISSIONS.PAYROLL_RUN_CANCEL))
const canRegenerateRuns = computed(() => hasPermission(PERMISSIONS.PAYROLL_RUN_REGENERATE))
const canExportPayrollRuns = computed(() => hasPermission(PERMISSIONS.PAYROLL_EXPORT))
const router = useRouter()

const {
  payrollRuns,
  payrollGenerationMissingEmployees,
  payrollGenerationCheckMonth,
  isPayrollRunsLoading,
  isGeneratingPayrollRun,
  isCheckingPayrollGeneration,
  isMutatingPayrollRun,
  mutatingPayrollRunId,
  payrollRunsError,
  fetchPayrollRuns,
  fetchPayrollRunsByUrl,
  clearPayrollGenerationCheck,
  checkAndGeneratePayroll,
  approvePayrollRun,
  markPayrollRunPaid,
  cancelPayrollRun,
  regeneratePayrollRun,
  exportPayrollRunExcel,
} = usePayroll()

const filters = reactive<PayrollRunFiltersState>(createDefaultPayrollRunFilters())
const isGenerateModalOpen = ref(false)
const isMissingSalaryModalOpen = ref(false)
const generateMonth = ref(getCurrentPayrollMonth())
const currentListUrl = ref<string | null>(null)
const headerError = ref('')
const isExportingPayrollRun = ref(false)
const exportingPayrollRunId = ref<number | null>(null)
const payrollRunConfirmation = ref<PayrollRunConfirmationState | null>(null)

const hasRunManagementActions = computed(
  () =>
    canGeneratePayrollRuns.value ||
    canApproveRuns.value ||
    canMarkRunsPaid.value ||
    canCancelRuns.value ||
    canRegenerateRuns.value ||
    canExportPayrollRuns.value,
)

const statusOptions: BaseDropdownOption[] = [
  { label: 'All statuses', value: '' },
  { label: formatPayrollStatusLabel(PAYROLL_RUN_STATUS.DRAFT), value: PAYROLL_RUN_STATUS.DRAFT },
  {
    label: formatPayrollStatusLabel(PAYROLL_RUN_STATUS.APPROVED),
    value: PAYROLL_RUN_STATUS.APPROVED,
  },
  { label: formatPayrollStatusLabel(PAYROLL_RUN_STATUS.PAID), value: PAYROLL_RUN_STATUS.PAID },
  {
    label: formatPayrollStatusLabel(PAYROLL_RUN_STATUS.CANCELLED),
    value: PAYROLL_RUN_STATUS.CANCELLED,
  },
]

const perPageOptions: BaseDropdownOption[] = [
  { label: '10 per page', value: 10 },
  { label: '20 per page', value: 20 },
  { label: '50 per page', value: 50 },
]

const buildListParams = (): PayrollRunListParams => {
  const params: PayrollRunListParams = {
    per_page: filters.per_page,
  }

  if (filters.month) {
    params.month = filters.month
  }

  if (filters.status) {
    params.status = filters.status
  }

  return params
}

const loadPayrollRuns = async () => {
  headerError.value = ''
  currentListUrl.value = null

  try {
    await fetchPayrollRuns(buildListParams())
  } catch {
    return
  }
}

const refreshPayrollRuns = async () => {
  headerError.value = ''

  try {
    if (currentListUrl.value) {
      await fetchPayrollRunsByUrl(currentListUrl.value)
      return
    }

    await fetchPayrollRuns(buildListParams())
  } catch {
    return
  }
}

const applyFilters = async () => {
  await loadPayrollRuns()
}

const resetFilters = async () => {
  Object.assign(filters, createDefaultPayrollRunFilters())
  await loadPayrollRuns()
}

const handleNavigateByUrl = async (url: string) => {
  headerError.value = ''
  currentListUrl.value = url

  try {
    await fetchPayrollRunsByUrl(url)
  } catch {
    return
  }
}

const openGenerateModal = () => {
  console.log(canGeneratePayrollRuns.value)
  if (!canGeneratePayrollRuns.value || isGeneratingPayrollRun.value || isCheckingPayrollGeneration.value) {
    return false;
  }

  clearPayrollGenerationCheck()
  generateMonth.value = filters.month || getCurrentPayrollMonth()
  isGenerateModalOpen.value = true
}

const closeGenerateModal = () => {
  isGenerateModalOpen.value = false
}

const closeMissingSalaryModal = () => {
  isMissingSalaryModalOpen.value = false
}

const downloadExportFile = (blob: Blob, filename: string) => {
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)

  window.setTimeout(() => {
    URL.revokeObjectURL(objectUrl)
  }, 0)
}

const handleGeneratePayrollRun = async () => {
  if (!canGeneratePayrollRuns.value || isGeneratingPayrollRun.value || isCheckingPayrollGeneration.value) {
    return false;
  }

  if (!generateMonth.value) {
    ElMessage.error('Select a payroll month before generating a payroll run.')
    return
  }

  try {
    const result = await checkAndGeneratePayroll(generateMonth.value)

    if (result.status === 'missing-salary') {
      closeGenerateModal()
      isMissingSalaryModalOpen.value = true
      return
    }

    if (result.status === 'no-employees') {
      headerError.value = 'No active employees are available for the selected payroll month.'
      ElMessage.warning(headerError.value)
      return
    }

    ElMessage.success('Payroll run generated successfully.')
    closeGenerateModal()
    await loadPayrollRuns()
  } catch (err) {
    headerError.value = getPayrollRequestErrorMessage(
      err,
      'Unable to generate payroll run. Please try again.',
    )
    ElMessage.error(headerError.value)
  }
}

const goToSalarySetup = async () => {
  if (!canViewPayrollSalaries.value) {
    return
  }

  closeMissingSalaryModal()
  await router.push({ name: 'payroll-salaries' })
}

const openPayrollRunDetail = async (run: PayrollRun) => {
  await router.push({ name: 'payroll-run-detail', params: { id: run.id } })
}

const handleExportPayrollRun = async (payrollRunId: number) => {
  if (!canExportPayrollRuns.value) {
    return
  }

  if (isExportingPayrollRun.value && exportingPayrollRunId.value === payrollRunId) {
    return
  }

  headerError.value = ''
  isExportingPayrollRun.value = true
  exportingPayrollRunId.value = payrollRunId

  try {
    const response = await exportPayrollRunExcel(payrollRunId)
    downloadExportFile(response.blob, response.filename)
    ElMessage.success('Payroll run export started successfully.')
  } catch (err) {
    headerError.value = getPayrollRequestErrorMessage(err, 'Failed to export payroll run.')
    ElMessage.error(headerError.value)
  } finally {
    isExportingPayrollRun.value = false
    exportingPayrollRunId.value = null
  }
}

const getRunActionConfig = (
  run: PayrollRun,
  action: PayrollRunMutationActionCommand,
): PayrollRunMutationActionConfig => {
  const payrollMonthLabel = formatPayrollMonthLabel(run.payroll_month)

  const actionMap: Record<PayrollRunMutationActionCommand, PayrollRunMutationActionConfig> = {
    approve: {
      title: 'Approve Payroll Run',
      message: `Approve the ${payrollMonthLabel} payroll run?`,
      detail: 'This will move the run forward so it can be marked as paid after final review.',
      statusLabel: 'Approval',
      status: 'success',
      icon: Check,
      actionLabel: 'Approve Run',
      actionVariant: 'primary',
      callback: () => approvePayrollRun(run.id),
      successMessage: 'Payroll run approved successfully.',
      errorMessage: 'We could not approve this payroll run. Please refresh and try again.',
    },
    'mark-paid': {
      title: 'Mark Payroll Run as Paid',
      message: `Mark the ${payrollMonthLabel} payroll run as paid?`,
      detail: 'Use this after payroll has been finalized and payment has been completed.',
      statusLabel: 'Payment',
      status: 'primary',
      icon: Wallet,
      actionLabel: 'Mark as Paid',
      actionVariant: 'primary',
      callback: () => markPayrollRunPaid(run.id),
      successMessage: 'Payroll run marked as paid successfully.',
      errorMessage: 'We could not update this payroll run right now. Please refresh and try again.',
    },
    cancel: {
      title: 'Cancel Payroll Run',
      message: `Cancel the ${payrollMonthLabel} payroll run?`,
      detail:
        'Use this only if the run should no longer move forward. This action cannot be undone from this screen.',
      statusLabel: 'Destructive Action',
      status: 'danger',
      icon: XCircle,
      actionLabel: 'Cancel Run',
      actionVariant: 'danger',
      callback: () => cancelPayrollRun(run.id),
      successMessage: 'Payroll run cancelled successfully.',
      errorMessage: 'We could not cancel this payroll run. Please refresh and try again.',
    },
    regenerate: {
      title: 'Regenerate Payroll Run',
      message: `Regenerate the ${payrollMonthLabel} payroll run from the latest payroll data?`,
      detail: 'Use this to rebuild a draft run after salary or attendance changes.',
      statusLabel: 'Refresh Data',
      status: 'warning',
      icon: RotateCcw,
      actionLabel: 'Regenerate Run',
      actionVariant: 'primary',
      callback: () => regeneratePayrollRun(run.id),
      successMessage: 'Payroll run regenerated successfully.',
      errorMessage: 'We could not regenerate this payroll run. Please refresh and try again.',
    },
  }

  return actionMap[action]
}

const activeRunActionConfig = computed(() => {
  if (!payrollRunConfirmation.value) {
    return null
  }

  return getRunActionConfig(payrollRunConfirmation.value.run, payrollRunConfirmation.value.action)
})

const isRunActionConfirmationOpen = computed(() => payrollRunConfirmation.value !== null)

const isRunActionConfirmationSubmitting = computed(() => {
  const currentConfirmation = payrollRunConfirmation.value

  if (!currentConfirmation) {
    return false
  }

  return isMutatingPayrollRun.value && mutatingPayrollRunId.value === currentConfirmation.run.id
})

const openRunActionConfirmation = (run: PayrollRun, action: PayrollRunMutationActionCommand) => {
  if (isMutatingPayrollRun.value && mutatingPayrollRunId.value === run.id) {
    return
  }

  payrollRunConfirmation.value = {
    run,
    action,
  }
}

const closeRunActionConfirmation = () => {
  if (isRunActionConfirmationSubmitting.value) {
    return
  }

  payrollRunConfirmation.value = null
}

const submitRunActionConfirmation = async () => {
  const currentConfirmation = payrollRunConfirmation.value
  const config = activeRunActionConfig.value

  if (!currentConfirmation || !config || isRunActionConfirmationSubmitting.value) {
    return
  }

  headerError.value = ''

  try {
    await config.callback()
    ElMessage.success(config.successMessage)
    payrollRunConfirmation.value = null
    await refreshPayrollRuns()
  } catch {
    headerError.value = config.errorMessage
    ElMessage.error(config.errorMessage)
  }
}

const getRunActions = (run: PayrollRun): ActionMenuItem[] => {
  const isRunMutating = isMutatingPayrollRun.value && mutatingPayrollRunId.value === run.id
  const isRunExporting = isExportingPayrollRun.value && exportingPayrollRunId.value === run.id
  const isActionDisabled = isPayrollRunsLoading.value || isRunMutating || isRunExporting

  const items: ActionMenuItem[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      tone: 'primary',
      disabled: isPayrollRunsLoading.value || isRunMutating || isRunExporting,
    },
  ]

  if (canApproveRuns.value && canApprovePayrollRun(run)) {
    items.push({
      key: 'approve',
      label: 'Approve',
      icon: Check,
      tone: 'primary',
      disabled: isActionDisabled,
    })
  }

  if (canMarkRunsPaid.value && canMarkPayrollRunPaid(run)) {
    items.push({
      key: 'mark-paid',
      label: 'Mark Paid',
      icon: Wallet,
      tone: 'primary',
      disabled: isActionDisabled,
    })
  }

  if (canCancelRuns.value && canCancelPayrollRun(run)) {
    items.push({
      key: 'cancel',
      label: 'Cancel',
      icon: XCircle,
      tone: 'danger',
      disabled: isActionDisabled,
    })
  }

  if (canRegenerateRuns.value && canRegeneratePayrollRun(run)) {
    items.push({
      key: 'regenerate',
      label: 'Regenerate',
      icon: RotateCcw,
      tone: 'warning',
      disabled: isActionDisabled,
    })
  }

  if (canExportPayrollRuns.value) {
    items.push({
      key: 'export',
      label: 'Export Excel',
      icon: Download,
      tone: 'primary',
      disabled: isActionDisabled,
    })
  }

  return items
}

const handleRunAction = async ({ run, actionKey }: { run: PayrollRun; actionKey: string }) => {
  if (isPayrollRunsLoading.value) {
    return
  }

  if (actionKey === 'view') {
    await openPayrollRunDetail(run)
    return
  }

  if (actionKey === 'export') {
    if (!canExportPayrollRuns.value) {
      return
    }

    await handleExportPayrollRun(run.id)
    return
  }

  if (actionKey === 'approve' && canApproveRuns.value && canApprovePayrollRun(run)) {
    openRunActionConfirmation(run, actionKey)
    return
  }

  if (actionKey === 'cancel' && canCancelRuns.value && canCancelPayrollRun(run)) {
    openRunActionConfirmation(run, actionKey)
    return
  }

  if (actionKey === 'mark-paid' && canMarkRunsPaid.value && canMarkPayrollRunPaid(run)) {
    openRunActionConfirmation(run, actionKey)
    return
  }

  if (actionKey === 'regenerate' && canRegenerateRuns.value && canRegeneratePayrollRun(run)) {
    openRunActionConfirmation(run, actionKey)
  }
}

onMounted(() => {
  void loadPayrollRuns()
})
</script>

<template>
  <main class="payroll-page">
    <header class="payroll-page-header">
      <div class="payroll-page-copy">
        <h1 class="payroll-page-title">Payroll Runs</h1>
        <p class="payroll-page-subtitle">
          Generate monthly payroll snapshots, review totals, and move runs through approval and
          payment states.
        </p>
        <p v-if="headerError" class="payroll-page-error">{{ headerError }}</p>
      </div>

      <div class="payroll-page-actions">
        <BaseButton
          v-if="canGeneratePayrollRuns"
          :loading="isGeneratingPayrollRun"
          :disabled="isCheckingPayrollGeneration"
          @click="openGenerateModal"
        >
          <Plus :size="16" />
          Generate Payroll Run
        </BaseButton>
        <BaseButton :loading="isPayrollRunsLoading" variant="ghost" @click="refreshPayrollRuns">
          <RefreshCw :size="16" />
          Refresh
        </BaseButton>
      </div>
    </header>

    <BaseCard v-if="!hasRunManagementActions" class="payroll-state-card">
      <div class="payroll-state-copy">
        <h2 class="payroll-section-title">View-Only Access</h2>
        <p class="payroll-section-text">
          You can review payroll runs, but generate, export, approval, cancellation, payment, and
          regeneration actions are unavailable for this account.
        </p>
      </div>
    </BaseCard>

    <BaseCard class="payroll-filters-card">
      <div class="payroll-section-header">
        <div>
          <h2 class="payroll-section-title">Filters</h2>
          <p class="payroll-section-text">
            Narrow payroll runs by month, status, and rows per page.
          </p>
        </div>
      </div>

      <form class="payroll-filters-grid" @submit.prevent="applyFilters">
        <BaseDatePicker
          v-model="filters.month"
          format="MMMM YYYY"
          label="Month"
          type="month"
          value-format="YYYY-MM"
        />
        <BaseDropdown
          v-model="filters.status"
          :options="statusOptions"
          label="Status"
          placeholder="All statuses"
        />
        <BaseDropdown
          v-model="filters.per_page"
          :clearable="false"
          :options="perPageOptions"
          label="Rows Per Page"
        />

        <div class="payroll-filter-actions">
          <BaseButton type="submit">Apply Filters</BaseButton>
          <BaseButton type="button" variant="ghost" @click="resetFilters">Reset</BaseButton>
        </div>
      </form>
    </BaseCard>

    <PayrollRunsTable
      :error="payrollRunsError"
      :loading="isPayrollRunsLoading"
      :resolve-actions="getRunActions"
      :runs="payrollRuns"
      @action="handleRunAction"
      @navigate-by-url="handleNavigateByUrl"
      @retry="refreshPayrollRuns"
      @view-details="openPayrollRunDetail"
    />

    <BaseModal title="Generate Payroll Run" :open="isGenerateModalOpen" @close="closeGenerateModal">
      <div class="payroll-generate-modal">
        <p class="payroll-section-text">Choose the payroll month to generate a new payroll run.</p>

        <BaseDatePicker
          v-model="generateMonth"
          format="MMMM YYYY"
          label="Payroll Month"
          type="month"
          value-format="YYYY-MM"
        />
        <p v-if="isCheckingPayrollGeneration" class="payroll-section-text">
          Checking salary coverage for the selected payroll month...
        </p>
      </div>

      <template #footer>
        <BaseButton variant="ghost" @click="closeGenerateModal">Cancel</BaseButton>
        <BaseButton
          :loading="isCheckingPayrollGeneration || isGeneratingPayrollRun"
          @click="handleGeneratePayrollRun"
        >
          Generate
        </BaseButton>
      </template>
    </BaseModal>

    <PayrollMissingSalaryModal
      :can-open-salary-setup="canViewPayrollSalaries"
      :employees="payrollGenerationMissingEmployees"
      :month="payrollGenerationCheckMonth"
      :open="isMissingSalaryModalOpen"
      @close="closeMissingSalaryModal"
      @go-to-salary-setup="goToSalarySetup"
    />

    <ConfirmActionModal
      :action-label="activeRunActionConfig?.actionLabel ?? 'Continue'"
      :action-variant="activeRunActionConfig?.actionVariant ?? 'primary'"
      :detail="activeRunActionConfig?.detail ?? ''"
      :icon="activeRunActionConfig?.icon ?? null"
      :loading="isRunActionConfirmationSubmitting"
      :message="activeRunActionConfig?.message ?? ''"
      :open="isRunActionConfirmationOpen"
      :status="activeRunActionConfig?.status ?? 'primary'"
      :status-label="activeRunActionConfig?.statusLabel ?? ''"
      :title="activeRunActionConfig?.title ?? 'Confirm Payroll Action'"
      close-label="Back"
      @close="closeRunActionConfirmation"
      @confirm="submitRunActionConfirmation"
    />
  </main>
</template>

<style scoped>
.payroll-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.payroll-state-card {
  padding: 1.25rem 1.5rem;
}

.payroll-state-copy {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.payroll-page-header,
.payroll-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.payroll-page-copy {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.payroll-page-actions,
.payroll-filter-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.payroll-page-title,
.payroll-section-title {
  color: hsl(var(--foreground));
}

.payroll-page-title {
  font-size: 1.9rem;
  font-weight: 700;
  line-height: 1.1;
}

.payroll-page-subtitle,
.payroll-section-text {
  color: hsl(var(--muted-foreground));
}

.payroll-page-error {
  color: hsl(var(--destructive));
}

.payroll-filters-card {
  padding: 1.5rem;
}

.payroll-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.payroll-generate-modal {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (max-width: 768px) {
  .payroll-page-header,
  .payroll-section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .payroll-page-actions,
  .payroll-filter-actions {
    align-items: stretch;
  }
}
</style>
