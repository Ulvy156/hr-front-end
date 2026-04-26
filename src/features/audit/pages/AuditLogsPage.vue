<script setup lang="ts">
import {
  ClipboardList,
  History,
  LogIn,
  LogOut,
  PencilLine,
  Trash2,
} from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseInput from '@/components/ui/BaseInput.vue'

import AuditLogDetailsModal from '../components/AuditLogDetailsModal.vue'
import AuditLogsTable from '../components/AuditLogsTable.vue'
import { useAudit } from '../composable/useAudit'
import type { AuditLog, AuditLogFilterParams, AuditLogListParams } from '../interface/audit.interface'

type AuditSummaryCard = {
  key: string
  title: string
  value: string
  helper: string
  icon: Component
  tone: 'gray' | 'green' | 'blue' | 'yellow' | 'red'
}

const {
  auditLogs,
  auditLogDetail,
  isAuditLogsLoading,
  isAuditLogDetailLoading,
  auditLogsError,
  auditLogDetailError,
  fetchAuditLogs,
  fetchAuditLogDetail,
  clearAuditLogDetail,
  exportAuditLogsExcel,
} = useAudit()

const currentPage = ref(1)
const selectedDateRange = ref<[string, string] | null>(null)
const isDetailModalOpen = ref(false)
const selectedAuditLogId = ref<number | null>(null)
const isExportingExcel = ref(false)
const exportError = ref('')

const filters = reactive({
  keyword: '',
  logName: '',
  event: '',
  causerId: '',
  subjectType: '',
  subjectId: '',
  perPage: 20,
})

const perPageOptions: BaseDropdownOption[] = [
  { label: '10 per page', value: 10 },
  { label: '20 per page', value: 20 },
  { label: '50 per page', value: 50 },
]

const summaryCards = computed<AuditSummaryCard[]>(() => {
  const logs = auditLogs.value?.data ?? []
  const cards: AuditSummaryCard[] = [
    {
      key: 'total',
      title: 'Total Logs',
      value: String(auditLogs.value?.total ?? 0),
      helper: 'All matching records',
      icon: ClipboardList,
      tone: 'gray',
    },
  ]

  const eventCards: Array<Omit<AuditSummaryCard, 'value'> & { count: number }> = [
    {
      key: 'check_in',
      title: 'Check In',
      helper: 'Events on this page',
      icon: LogIn,
      tone: 'green',
      count: countByEvent(logs, ['check_in']),
    },
    {
      key: 'check_out',
      title: 'Check Out',
      helper: 'Events on this page',
      icon: LogOut,
      tone: 'blue',
      count: countByEvent(logs, ['check_out']),
    },
    {
      key: 'create',
      title: 'Create',
      helper: 'Events on this page',
      icon: History,
      tone: 'green',
      count: countByEvent(logs, ['create', 'created']),
    },
    {
      key: 'update',
      title: 'Update',
      helper: 'Events on this page',
      icon: PencilLine,
      tone: 'yellow',
      count: countByEvent(logs, ['update', 'updated']),
    },
    {
      key: 'delete',
      title: 'Delete',
      helper: 'Events on this page',
      icon: Trash2,
      tone: 'red',
      count: countByEvent(logs, ['delete', 'deleted']),
    },
  ]

  eventCards
    .filter((card) => card.count > 0)
    .forEach((card) => {
      cards.push({
        key: card.key,
        title: card.title,
        value: String(card.count),
        helper: card.helper,
        icon: card.icon,
        tone: card.tone,
      })
    })

  return cards
})

const loadAuditLogs = async (page = currentPage.value) => {
  currentPage.value = page
  exportError.value = ''

  try {
    await fetchAuditLogs(buildListQueryParams(page))
  } catch {
    return
  }
}

const applyFilters = async () => {
  currentPage.value = 1
  await loadAuditLogs(1)
}

const resetFilters = async () => {
  filters.keyword = ''
  filters.logName = ''
  filters.event = ''
  filters.causerId = ''
  filters.subjectType = ''
  filters.subjectId = ''
  filters.perPage = 20
  selectedDateRange.value = null

  await applyFilters()
}

const refreshAuditLogs = async () => {
  await loadAuditLogs(currentPage.value)
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

const handleExportExcel = async () => {
  exportError.value = ''
  isExportingExcel.value = true

  try {
    const response = await exportAuditLogsExcel(buildExportQueryParams())
    downloadExportFile(response.blob, response.filename)
  } catch (err) {
    exportError.value = err instanceof Error ? err.message : 'Failed to export audit logs.'
  } finally {
    isExportingExcel.value = false
  }
}

const openLogDetails = async (log: AuditLog) => {
  selectedAuditLogId.value = log.id
  isDetailModalOpen.value = true

  try {
    await fetchAuditLogDetail(log.id)
  } catch {
    return
  }
}

const closeDetailModal = () => {
  isDetailModalOpen.value = false
  selectedAuditLogId.value = null
  clearAuditLogDetail()
}

const retryLogDetail = async () => {
  if (!selectedAuditLogId.value) {
    return
  }

  try {
    await fetchAuditLogDetail(selectedAuditLogId.value)
  } catch {
    return
  }
}

function buildSharedFilterParams(): AuditLogFilterParams {
  const params: AuditLogFilterParams = {}
  const trimmedKeyword = filters.keyword.trim()
  const trimmedLogName = filters.logName.trim()
  const trimmedEvent = filters.event.trim()
  const trimmedSubjectType = filters.subjectType.trim()
  const causerId = parsePositiveNumber(filters.causerId)
  const subjectId = parsePositiveNumber(filters.subjectId)

  if (trimmedKeyword) {
    params.keyword = trimmedKeyword
  }

  if (trimmedLogName) {
    params.log_name = trimmedLogName
  }

  if (trimmedEvent) {
    params.event = trimmedEvent
  }

  if (causerId) {
    params.causer_id = causerId
  }

  if (trimmedSubjectType) {
    params.subject_type = trimmedSubjectType
  }

  if (subjectId) {
    params.subject_id = subjectId
  }

  if (selectedDateRange.value?.[0]) {
    params.from_date = selectedDateRange.value[0]
  }

  if (selectedDateRange.value?.[1]) {
    params.to_date = selectedDateRange.value[1]
  }

  return params
}

function buildListQueryParams(page: number): AuditLogListParams {
  return {
    ...buildSharedFilterParams(),
    page,
    per_page: filters.perPage,
  }
}

function buildExportQueryParams() {
  return buildSharedFilterParams()
}

function parsePositiveNumber(value: string) {
  const parsedValue = Number(value)

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : undefined
}

function countByEvent(logs: AuditLog[], events: string[]) {
  return logs.filter((log) => events.includes(log.event.toLowerCase())).length
}

onMounted(() => {
  void loadAuditLogs()
})
</script>

<template>
  <div class="audit-page">
    <header class="audit-page-header">
      <div>
        <h1 class="audit-page-title">Audit Logs</h1>
        <p class="audit-page-subtitle">
          Review important activity history such as created, updated, and deleted records.
        </p>
        <p v-if="exportError" class="audit-page-error">{{ exportError }}</p>
      </div>

      <div class="audit-page-actions">
        <BaseButton
          :disabled="isExportingExcel"
          :loading="isExportingExcel"
          variant="secondary"
          @click="handleExportExcel"
        >
          Export Excel
        </BaseButton>

        <BaseButton :loading="isAuditLogsLoading" variant="ghost" @click="refreshAuditLogs">
          Refresh
        </BaseButton>
      </div>
    </header>

    <BaseCard class="audit-filters-card">
      <div class="audit-section-header">
        <div>
          <h2 class="audit-section-title">Filters</h2>
          <p class="audit-section-text">
            Narrow the list by activity type, related record, person, or date.
          </p>
        </div>
      </div>

      <form class="audit-filters-grid" @submit.prevent="applyFilters">
        <BaseInput
          v-model="filters.keyword"
          label="Keyword"
          placeholder="Search across activity details"
          size="large"
        />
        <BaseInput
          v-model="filters.logName"
          label="Log Name"
          placeholder="Example: attendance"
          size="large"
        />
        <BaseInput
          v-model="filters.event"
          label="Event"
          placeholder="Example: check_in"
          size="large"
        />
        <BaseInput
          v-model="filters.causerId"
          label="Causer ID"
          placeholder="Filter by user ID"
          size="large"
          type="number"
        />
        <BaseInput
          v-model="filters.subjectType"
          label="Subject Type"
          placeholder="Example: App\\Models\\Attendance"
          size="large"
        />
        <BaseInput
          v-model="filters.subjectId"
          label="Subject ID"
          placeholder="Filter by record ID"
          size="large"
          type="number"
        />
        <BaseDatePicker
          v-model="selectedDateRange"
          end-placeholder="To date"
          label="Date Range"
          start-placeholder="From date"
          type="daterange"
          value-format="YYYY-MM-DD"
        />
        <BaseDropdown
          v-model="filters.perPage"
          :options="perPageOptions"
          :clearable="false"
          label="Rows Per Page"
          placeholder="Select page size"
        />

        <div class="audit-filter-actions">
          <BaseButton type="submit">Apply Filters</BaseButton>
          <BaseButton type="button" variant="ghost" @click="resetFilters">Reset</BaseButton>
        </div>
      </form>
    </BaseCard>

    <section v-if="summaryCards.length" class="audit-summary-grid">
      <BaseCard
        v-for="card in summaryCards"
        :key="card.key"
        class="audit-summary-card"
        :class="`tone-${card.tone}`"
      >
        <div class="audit-summary-card-top">
          <div>
            <p class="audit-summary-card-label">{{ card.title }}</p>
            <p class="audit-summary-card-helper">{{ card.helper }}</p>
          </div>

          <div class="audit-summary-card-icon">
            <component :is="card.icon" class="audit-summary-icon-svg" />
          </div>
        </div>

        <p class="audit-summary-card-value">{{ card.value }}</p>
      </BaseCard>
    </section>

    <AuditLogsTable
      :error="auditLogsError"
      :loading="isAuditLogsLoading"
      :logs="auditLogs"
      @page-change="loadAuditLogs"
      @retry="refreshAuditLogs"
      @view-details="openLogDetails"
    />

    <AuditLogDetailsModal
      :error="auditLogDetailError"
      :loading="isAuditLogDetailLoading"
      :log="auditLogDetail"
      :open="isDetailModalOpen"
      @close="closeDetailModal"
      @retry="retryLogDetail"
    />
  </div>
</template>

<style scoped>
.audit-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.audit-page-header,
.audit-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.audit-page-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

.audit-page-title,
.audit-section-title {
  color: hsl(var(--foreground));
}

.audit-page-subtitle,
.audit-section-text {
  color: hsl(var(--muted-foreground));
}

.audit-page-error {
  margin-top: 0.5rem;
  color: hsl(var(--destructive));
}

.audit-filters-card {
  padding: 1.5rem;
}

.audit-filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.audit-filter-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: 0.75rem;
}

.audit-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(12rem, 1fr));
  gap: 1rem;
}

.audit-summary-card {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem 1.125rem;
}

.audit-summary-card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
}

.audit-summary-card-label {
  color: hsl(var(--foreground));
  font-size: var(--text-sm);
  font-weight: 700;
}

.audit-summary-card-helper {
  margin-top: 0.25rem;
  color: hsl(var(--muted-foreground));
  font-size: var(--text-xs);
}

.audit-summary-card-value {
  color: hsl(var(--foreground));
  font-size: clamp(1.75rem, 3vw, 2.25rem);
  font-weight: 800;
  line-height: 1;
}

.audit-summary-card-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.9rem;
}

.audit-summary-icon-svg {
  width: 1.25rem;
  height: 1.25rem;
}

.tone-gray .audit-summary-card-icon {
  background: rgb(243 244 246);
  color: rgb(75 85 99);
}

.tone-green .audit-summary-card-icon {
  background: rgb(220 252 231);
  color: rgb(21 128 61);
}

.tone-blue .audit-summary-card-icon {
  background: rgb(219 234 254);
  color: rgb(29 78 216);
}

.tone-yellow .audit-summary-card-icon {
  background: rgb(254 249 195);
  color: rgb(161 98 7);
}

.tone-red .audit-summary-card-icon {
  background: rgb(254 226 226);
  color: rgb(185 28 28);
}

@media (max-width: 768px) {
  .audit-page-header,
  .audit-section-header {
    flex-direction: column;
    align-items: stretch;
  }

  .audit-page-actions,
  .audit-filter-actions {
    align-items: stretch;
  }
}
</style>
