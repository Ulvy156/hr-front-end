<script setup lang="ts">
import axios from 'axios'
import { ArrowLeft, RefreshCw } from 'lucide-vue-next'
import { useRoute, useRouter } from 'vue-router'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

import PayrollRunStatusBadge from '../components/PayrollRunStatusBadge.vue'
import { usePayroll } from '../composable/usePayroll'
import {
  getPayrollOwnPayslipOverview,
  getPayrollOwnPayslipPageSections,
} from '../utils/payroll'

const route = useRoute()
const router = useRouter()

const {
  payrollOwnPayslipDetail,
  isPayrollOwnPayslipDetailLoading,
  payrollOwnPayslipDetailError,
  fetchPayrollOwnPayslipDetail,
  clearPayrollOwnPayslipDetail,
} = usePayroll()

const isPayslipNotFound = ref(false)

const payslipId = computed(() => {
  const rawId = route.params.id
  const normalizedId = Array.isArray(rawId) ? rawId[0] : rawId
  const parsedId = Number(normalizedId)

  return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : null
})

const payslipOverview = computed(() => getPayrollOwnPayslipOverview(payrollOwnPayslipDetail.value))
const payslipSections = computed(() =>
  getPayrollOwnPayslipPageSections(payrollOwnPayslipDetail.value),
)

const loadPayslipDetail = async () => {
  if (!payslipId.value) {
    return
  }

  isPayslipNotFound.value = false

  try {
    await fetchPayrollOwnPayslipDetail(payslipId.value)
  } catch (error) {
    if (axios.isAxiosError(error) && error.response?.status === 404) {
      isPayslipNotFound.value = true
    }
  }
}

const goBack = async () => {
  await router.push({ name: 'payroll-my-payslips' })
}

watch(
  payslipId,
  async () => {
    clearPayrollOwnPayslipDetail()
    isPayslipNotFound.value = false
    await loadPayslipDetail()
  },
  {
    immediate: true,
  },
)

onBeforeUnmount(() => {
  clearPayrollOwnPayslipDetail()
})
</script>

<template>
  <main class="payslip-detail-page">
    <header class="payslip-detail-page-header">
      <div class="payslip-detail-page-copy">
        <BaseButton variant="ghost" @click="goBack">
          <ArrowLeft :size="16" />
          Back to My Payslips
        </BaseButton>

        <div class="payslip-detail-page-title-block">
          <p class="payslip-detail-eyebrow">My Payslip</p>
          <div class="payslip-detail-page-heading">
            <h1 class="payslip-detail-page-title">
              {{ payslipOverview?.monthLabel ?? 'Payslip Details' }}
            </h1>
            <PayrollRunStatusBadge
              v-if="payrollOwnPayslipDetail"
              :status="payrollOwnPayslipDetail.payroll_status"
            />
          </div>
          <p class="payslip-detail-page-subtitle">
            Review the selected monthly payslip summary, including earnings, deductions, and final net salary.
          </p>
        </div>
      </div>

      <div class="payslip-detail-page-actions">
        <BaseButton
          :loading="isPayrollOwnPayslipDetailLoading"
          variant="ghost"
          @click="loadPayslipDetail"
        >
          <RefreshCw :size="16" />
          Refresh
        </BaseButton>
      </div>
    </header>

    <BaseCard v-if="!payslipId" class="payslip-detail-state-card">
      <div class="payslip-detail-state">
        <h2 class="payslip-detail-state-title">Invalid payslip</h2>
        <p class="payslip-detail-state-text">
          The selected payslip ID is invalid or missing from the current route.
        </p>
        <BaseButton variant="ghost" @click="goBack">Back to My Payslips</BaseButton>
      </div>
    </BaseCard>

    <BaseCard v-else-if="isPayrollOwnPayslipDetailLoading" class="payslip-detail-state-card">
      <div class="payslip-detail-state">
        <BaseSpinner />
        <h2 class="payslip-detail-state-title">Loading payslip</h2>
        <p class="payslip-detail-state-text">
          Fetching the latest payslip summary for this payroll month.
        </p>
      </div>
    </BaseCard>

    <BaseCard v-else-if="isPayslipNotFound" class="payslip-detail-state-card">
      <div class="payslip-detail-state">
        <h2 class="payslip-detail-state-title">Payslip not found</h2>
        <p class="payslip-detail-state-text">
          The selected payslip could not be found or is no longer available.
        </p>
        <div class="payslip-detail-state-actions">
          <BaseButton variant="ghost" @click="goBack">Back</BaseButton>
          <BaseButton @click="loadPayslipDetail">
            <RefreshCw :size="16" />
            Try Again
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <BaseCard v-else-if="payrollOwnPayslipDetailError" class="payslip-detail-state-card">
      <div class="payslip-detail-state">
        <h2 class="payslip-detail-state-title">Unable to load payslip</h2>
        <p class="payslip-detail-state-text">{{ payrollOwnPayslipDetailError }}</p>
        <div class="payslip-detail-state-actions">
          <BaseButton variant="ghost" @click="goBack">Back</BaseButton>
          <BaseButton @click="loadPayslipDetail">
            <RefreshCw :size="16" />
            Try Again
          </BaseButton>
        </div>
      </div>
    </BaseCard>

    <template v-else-if="payrollOwnPayslipDetail && payslipOverview">
      <BaseCard class="payslip-detail-summary-card">
        <div class="payslip-detail-summary-panel">
          <div class="payslip-detail-summary-header">
            <div class="payslip-detail-summary-copy">
              <p class="payslip-detail-eyebrow">Net Salary Summary</p>
              <h2 class="payslip-detail-summary-title">{{ payslipOverview.primaryHighlight.label }}</h2>
            </div>
          </div>

          <div class="payslip-detail-summary-highlight">
            <p class="payslip-detail-summary-value">
              {{ payslipOverview.primaryHighlight.value }}
            </p>
            <p class="payslip-detail-summary-helper">
              Updated {{ payslipOverview.updatedAt }}
            </p>
          </div>
        </div>
      </BaseCard>

      <BaseCard
        v-for="section in payslipSections"
        :key="section.key"
        class="payslip-detail-section-card"
      >
        <div class="payslip-detail-section">
          <div class="payslip-detail-section-header">
            <div>
              <h3 class="payslip-detail-section-title">{{ section.title }}</h3>
            </div>
          </div>

          <div class="payslip-detail-section-grid">
            <div
              v-for="item in section.items"
              :key="item.key"
              :class="[
                'payslip-detail-section-item',
                `payslip-detail-section-item-${item.tone ?? 'default'}`,
              ]"
            >
              <p class="payslip-detail-section-label">{{ item.label }}</p>
              <p class="payslip-detail-section-value">{{ item.value }}</p>
            </div>
          </div>
        </div>
      </BaseCard>
    </template>

    <BaseCard v-else class="payslip-detail-state-card">
      <div class="payslip-detail-state">
        <h2 class="payslip-detail-state-title">Payslip unavailable</h2>
        <p class="payslip-detail-state-text">
          No payslip details are available for this selection.
        </p>
        <BaseButton variant="ghost" @click="goBack">Back to My Payslips</BaseButton>
      </div>
    </BaseCard>
  </main>
</template>

<style scoped>
.payslip-detail-page,
.payslip-detail-page-copy,
.payslip-detail-page-title-block,
.payslip-detail-summary-panel,
.payslip-detail-summary-copy,
.payslip-detail-summary-highlight,
.payslip-detail-section,
.payslip-detail-state,
.payslip-detail-section-item {
  display: flex;
  flex-direction: column;
}

.payslip-detail-page,
.payslip-detail-section,
.payslip-detail-summary-panel {
  gap: 1.5rem;
}

.payslip-detail-page-header,
.payslip-detail-page-heading,
.payslip-detail-section-header,
.payslip-detail-summary-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.payslip-detail-page-actions,
.payslip-detail-state-actions {
  display: flex;
  gap: 0.75rem;
}

.payslip-detail-page-copy,
.payslip-detail-page-title-block,
.payslip-detail-summary-copy,
.payslip-detail-summary-highlight,
.payslip-detail-state,
.payslip-detail-section-item {
  gap: 0.5rem;
}

.payslip-detail-page-title,
.payslip-detail-summary-title,
.payslip-detail-summary-value,
.payslip-detail-section-title,
.payslip-detail-section-value,
.payslip-detail-state-title {
  color: hsl(var(--foreground));
}

.payslip-detail-page-subtitle,
.payslip-detail-eyebrow,
.payslip-detail-summary-helper,
.payslip-detail-section-label,
.payslip-detail-state-text {
  color: hsl(var(--muted-foreground));
}

.payslip-detail-eyebrow,
.payslip-detail-section-label {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.payslip-detail-summary-card,
.payslip-detail-section-card,
.payslip-detail-state-card {
  overflow: hidden;
}

.payslip-detail-summary-panel,
.payslip-detail-section {
  padding: 1.25rem;
}

.payslip-detail-summary-highlight {
  padding: 1.25rem;
  border: 1px solid hsl(var(--border-gray));
  border-left: 4px solid hsl(var(--primary));
  border-radius: var(--radius);
  background: hsl(var(--primary) / 0.04);
}

.payslip-detail-summary-title {
  font-size: 1.1rem;
  font-weight: 700;
}

.payslip-detail-summary-value {
  color: hsl(var(--primary));
  font-size: clamp(2.5rem, 6vw, 3.5rem);
  font-weight: 700;
  line-height: 0.95;
}

.payslip-detail-section-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

.payslip-detail-section-item {
  justify-content: center;
  min-height: 6rem;
  padding: 1rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--secondary) / 0.08);
}

.payslip-detail-section-item-primary {
  border-color: hsl(var(--primary) / 0.24);
  background: hsl(var(--primary) / 0.05);
}

.payslip-detail-section-item-primary .payslip-detail-section-value {
  color: hsl(var(--primary));
}

.payslip-detail-section-item-danger {
  border-color: hsl(var(--destructive) / 0.22);
  background: hsl(var(--destructive) / 0.05);
}

.payslip-detail-section-item-danger .payslip-detail-section-value {
  color: hsl(var(--destructive));
}

.payslip-detail-section-value {
  font-size: 1.1rem;
  font-weight: 700;
}

.payslip-detail-state {
  align-items: center;
  justify-content: center;
  min-height: 16rem;
  padding: 1.5rem;
  text-align: center;
}

@media (max-width: 768px) {
  .payslip-detail-page-header,
  .payslip-detail-page-heading,
  .payslip-detail-section-header,
  .payslip-detail-summary-header {
    flex-direction: column;
    align-items: stretch;
  }

  .payslip-detail-page-actions,
  .payslip-detail-state-actions {
    flex-wrap: wrap;
    justify-content: center;
  }

  .payslip-detail-section-grid {
    grid-template-columns: 1fr;
  }
}
</style>
