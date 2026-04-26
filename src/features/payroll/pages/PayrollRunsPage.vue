<script setup lang="ts">
import { ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  Check,
  Download,
  Eye,
  Plus,
  RefreshCw,
  RotateCcw,
  Wallet,
  XCircle,
} from 'lucide-vue-next'

import type { ActionMenuItem } from '@/components/ui/ActionMenu.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
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
  formatPayrollStatusLabel,
  getCurrentPayrollMonth,
  getPayrollRequestErrorMessage,
} from '../utils/payroll'

type PayrollRunActionCommand =
  | 'approve'
  | 'cancel'
  | 'mark-paid'
  | 'regenerate'
  | 'export'
type PayrollRunMutationActionCommand = Exclude<PayrollRunActionCommand, 'export'>

const { hasPermission } = usePermission()
const canGeneratePayrollRuns = computed(() => hasPermission(PERMISSIONS.PAYROLL_RUN_GENERATE))
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

const confirmRunAction = async (run: PayrollRun, action: PayrollRunMutationActionCommand) => {
  if (isMutatingPayrollRun.value && mutatingPayrollRunId.value === run.id) {
    return
  }

  const actionMap: Record<
    PayrollRunMutationActionCommand,
    {
      title: string
      message: string
      confirmButtonText: string
      confirmButtonClass?: string
      callback: () => Promise<unknown>
      successMessage: string
    }
  > = {
    approve: {
      title: 'Approve Payroll Run',
      message: `Approve the ${run.payroll_month ?? 'selected'} payroll run?`,
      confirmButtonText: 'Approve',
      callback: () => approvePayrollRun(run.id),
      successMessage: 'Payroll run approved successfully.',
    },
    'mark-paid': {
      title: 'Mark Payroll Run Paid',
      message: `Mark the ${run.payroll_month ?? 'selected'} payroll run as paid?`,
      confirmButtonText: 'Mark Paid',
      callback: () => markPayrollRunPaid(run.id),
      successMessage: 'Payroll run marked as paid successfully.',
    },
    cancel: {
      title: 'Cancel Payroll Run',
      message: `Cancel the ${run.payroll_month ?? 'selected'} payroll run?`,
      confirmButtonText: 'Cancel Run',
      confirmButtonClass: 'el-button--danger',
      callback: () => cancelPayrollRun(run.id),
      successMessage: 'Payroll run cancelled successfully.',
    },
    regenerate: {
      title: 'Regenerate Payroll Run',
      message: `Regenerate the ${run.payroll_month ?? 'selected'} payroll run from current payroll data?`,
      confirmButtonText: 'Regenerate',
      callback: () => regeneratePayrollRun(run.id),
      successMessage: 'Payroll run regenerated successfully.',
    },
  }

  const config = actionMap[action]

  try {
    await ElMessageBox.confirm(config.message, config.title, {
      confirmButtonText: config.confirmButtonText,
      cancelButtonText: 'Keep Current',
      confirmButtonClass: config.confirmButtonClass,
      type: action === 'cancel' ? 'warning' : 'info',
    })
  } catch {
    return
  }

  try {
    await config.callback()
    ElMessage.success(config.successMessage)
    await refreshPayrollRuns()
  } catch (err) {
    const errorMessage = getPayrollRequestErrorMessage(err)
    ElMessage.error(errorMessage)
  }
}

const getRunActions = (run: PayrollRun): ActionMenuItem[] => {
  const items: ActionMenuItem[] = [
    {
      key: 'view',
      label: 'View Details',
      icon: Eye,
      tone: 'primary',
    },
  ]

  const isRunMutating = isMutatingPayrollRun.value && mutatingPayrollRunId.value === run.id
  const isRunExporting = isExportingPayrollRun.value && exportingPayrollRunId.value === run.id

  if (canApproveRuns.value && canApprovePayrollRun(run) && !isRunMutating) {
    items.push({
      key: 'approve',
      label: 'Approve',
      icon: Check,
      tone: 'primary',
    })
  }

  if (canMarkRunsPaid.value && canMarkPayrollRunPaid(run) && !isRunMutating) {
    items.push({
      key: 'mark-paid',
      label: 'Mark Paid',
      icon: Wallet,
      tone: 'primary',
    })
  }

  if (canCancelRuns.value && canCancelPayrollRun(run) && !isRunMutating) {
    items.push({
      key: 'cancel',
      label: 'Cancel',
      icon: XCircle,
      tone: 'danger',
    })
  }

  if (canRegenerateRuns.value && canRegeneratePayrollRun(run) && !isRunMutating) {
    items.push({
      key: 'regenerate',
      label: 'Regenerate',
      icon: RotateCcw,
      tone: 'warning',
    })
  }

  if (canExportPayrollRuns.value && !isRunExporting) {
    items.push({
      key: 'export',
      label: 'Export Excel',
      icon: Download,
      tone: 'primary',
    })
  }

  return items
}

const handleRunAction = async ({
  run,
  actionKey,
}: {
  run: PayrollRun
  actionKey: string
}) => {
  if (actionKey === 'view') {
    await openPayrollRunDetail(run)
    return
  }

  if (actionKey === 'export') {
    await handleExportPayrollRun(run.id)
    return
  }

  if (
    actionKey === 'approve' ||
    actionKey === 'cancel' ||
    actionKey === 'mark-paid' ||
    actionKey === 'regenerate'
  ) {
    await confirmRunAction(run, actionKey)
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
          Generate monthly payroll snapshots, review totals, and move runs through approval and payment states.
        </p>
        <p v-if="headerError" class="payroll-page-error">{{ headerError }}</p>
      </div>

      <div class="payroll-page-actions">
        <BaseButton
          v-if="canGeneratePayrollRuns"
          :loading="isGeneratingPayrollRun"
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
        <p class="payroll-section-text">
          Choose the payroll month to generate a new payroll run.
        </p>

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
        <BaseButton :loading="isCheckingPayrollGeneration || isGeneratingPayrollRun" @click="handleGeneratePayrollRun">
          Generate
        </BaseButton>
      </template>
    </BaseModal>

    <PayrollMissingSalaryModal
      :employees="payrollGenerationMissingEmployees"
      :month="payrollGenerationCheckMonth"
      :open="isMissingSalaryModalOpen"
      @close="closeMissingSalaryModal"
      @go-to-salary-setup="goToSalarySetup"
    />
  </main>
</template>

<style scoped>
.payroll-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
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
