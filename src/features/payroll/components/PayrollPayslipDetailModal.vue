<script setup lang="ts">
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

import type { PayrollOwnPayslip } from '../interface/payroll.interface'
import {
  formatPayrollAmount,
  formatPayrollDateTime,
  formatPayrollInteger,
  formatPayrollMonthLabel,
  formatPayrollSalarySourceLabel,
  getPayrollSalarySourceVariant,
  getPayslipSummaryCards,
} from '../utils/payroll'
import PayrollRunStatusBadge from './PayrollRunStatusBadge.vue'

const props = defineProps<{
  open: boolean
  payslip: PayrollOwnPayslip | null
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  close: []
  retry: []
}>()

const summaryCards = computed(() => getPayslipSummaryCards(props.payslip))
</script>

<template>
  <BaseModal width="92%" :open="open" @close="emit('close')">
    <template #header>
      <div class="payroll-payslip-detail-header">
        <div class="payroll-payslip-detail-copy">
          <p class="payroll-payslip-detail-eyebrow">Payslip Detail</p>
          <div class="payroll-payslip-detail-title-row">
            <h2 class="payroll-payslip-detail-title">
              {{ formatPayrollMonthLabel(payslip?.payroll_month) }}
            </h2>
            <PayrollRunStatusBadge :status="payslip?.payroll_status" />
          </div>
        </div>

        <p class="payroll-payslip-detail-text">
          Updated: {{ formatPayrollDateTime(payslip?.updated_at) }}
        </p>
      </div>
    </template>

    <div v-if="loading" class="payroll-payslip-detail-state">
      <BaseSpinner />
      <p class="payroll-payslip-detail-text">Loading payslip details...</p>
    </div>

    <div
      v-else-if="error"
      class="payroll-payslip-detail-state payroll-payslip-detail-state-error"
    >
      <p class="payroll-payslip-detail-text">{{ error }}</p>
      <BaseButton variant="secondary" @click="emit('retry')">Try Again</BaseButton>
    </div>

    <div v-else-if="payslip" class="payroll-payslip-detail-content">
      <section class="payroll-payslip-detail-summary-grid">
        <div
          v-for="card in summaryCards"
          :key="card.key"
          class="payroll-payslip-detail-summary-card"
        >
          <p class="payroll-payslip-detail-summary-label">{{ card.label }}</p>
          <p class="payroll-payslip-detail-summary-value">{{ card.value }}</p>
        </div>
      </section>

      <section class="payroll-payslip-detail-section">
        <div class="payroll-payslip-detail-section-heading">
          <h3 class="payroll-payslip-detail-section-title">Salary Breakdown</h3>
          <BaseBadge :variant="getPayrollSalarySourceVariant(payslip.salary_source)">
            {{ formatPayrollSalarySourceLabel(payslip.salary_source) }}
          </BaseBadge>
        </div>

        <div class="payroll-payslip-detail-grid">
          <div class="payroll-payslip-detail-item">
            <p class="payroll-payslip-detail-label">Eligible Working Days</p>
            <p class="payroll-payslip-detail-value">
              {{ formatPayrollInteger(payslip.eligible_working_days) }}
            </p>
          </div>
          <div class="payroll-payslip-detail-item">
            <p class="payroll-payslip-detail-label">Company Working Days</p>
            <p class="payroll-payslip-detail-value">
              {{ formatPayrollInteger(payslip.company_working_days) }}
            </p>
          </div>
          <div class="payroll-payslip-detail-item">
            <p class="payroll-payslip-detail-label">Monthly Hours</p>
            <p class="payroll-payslip-detail-value">
              {{ formatPayrollInteger(payslip.monthly_working_hours) }}
            </p>
          </div>
          <div class="payroll-payslip-detail-item">
            <p class="payroll-payslip-detail-label">Hourly Rate</p>
            <p class="payroll-payslip-detail-value">
              {{ formatPayrollAmount(payslip.hourly_rate) }}
            </p>
          </div>
          <div class="payroll-payslip-detail-item">
            <p class="payroll-payslip-detail-label">Daily Rate</p>
            <p class="payroll-payslip-detail-value">
              {{ formatPayrollAmount(payslip.daily_rate) }}
            </p>
          </div>
        </div>
      </section>

      <section class="payroll-payslip-detail-section">
        <div class="payroll-payslip-detail-section-heading">
          <h3 class="payroll-payslip-detail-section-title">Overtime</h3>
        </div>

        <div class="payroll-payslip-detail-grid">
          <div class="payroll-payslip-detail-item">
            <p class="payroll-payslip-detail-label">Normal Hours</p>
            <p class="payroll-payslip-detail-value">
              {{ formatPayrollAmount(payslip.overtime_normal_hours) }}
            </p>
          </div>
          <div class="payroll-payslip-detail-item">
            <p class="payroll-payslip-detail-label">Weekend Hours</p>
            <p class="payroll-payslip-detail-value">
              {{ formatPayrollAmount(payslip.overtime_weekend_hours) }}
            </p>
          </div>
          <div class="payroll-payslip-detail-item">
            <p class="payroll-payslip-detail-label">Holiday Hours</p>
            <p class="payroll-payslip-detail-value">
              {{ formatPayrollAmount(payslip.overtime_holiday_hours) }}
            </p>
          </div>
          <div class="payroll-payslip-detail-item">
            <p class="payroll-payslip-detail-label">Overtime Pay</p>
            <p class="payroll-payslip-detail-value">
              {{ formatPayrollAmount(payslip.overtime_pay) }}
            </p>
          </div>
        </div>
      </section>

      <section class="payroll-payslip-detail-section">
        <div class="payroll-payslip-detail-section-heading">
          <h3 class="payroll-payslip-detail-section-title">Unpaid Leave</h3>
        </div>

        <div class="payroll-payslip-detail-grid">
          <div class="payroll-payslip-detail-item">
            <p class="payroll-payslip-detail-label">Units</p>
            <p class="payroll-payslip-detail-value">
              {{ formatPayrollAmount(payslip.unpaid_leave_units) }}
            </p>
          </div>
          <div class="payroll-payslip-detail-item">
            <p class="payroll-payslip-detail-label">Deduction</p>
            <p class="payroll-payslip-detail-value">
              {{ formatPayrollAmount(payslip.unpaid_leave_deduction) }}
            </p>
          </div>
          <div class="payroll-payslip-detail-item">
            <p class="payroll-payslip-detail-label">Raw Net Salary</p>
            <p class="payroll-payslip-detail-value">
              {{ formatPayrollAmount(payslip.raw_net_salary) }}
            </p>
          </div>
          <div class="payroll-payslip-detail-item">
            <p class="payroll-payslip-detail-label">Final Net Salary</p>
            <p class="payroll-payslip-detail-value payroll-payslip-detail-value-strong">
              {{ formatPayrollAmount(payslip.net_salary) }}
            </p>
          </div>
        </div>
      </section>
    </div>

    <div v-else class="payroll-payslip-detail-state">
      <p class="payroll-payslip-detail-text">Select a payslip to review the full details.</p>
    </div>
  </BaseModal>
</template>

<style scoped>
:deep(.base-modal-panel) {
  width: min(92vw, 72rem);
  max-height: 88vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.base-modal-body) {
  display: flex;
  flex: 1 1 auto;
  min-height: 0;
  flex-direction: column;
  gap: 1rem;
  overflow-y: auto;
}

.payroll-payslip-detail-header,
.payroll-payslip-detail-title-row,
.payroll-payslip-detail-section-heading {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.payroll-payslip-detail-copy,
.payroll-payslip-detail-content,
.payroll-payslip-detail-section {
  display: flex;
  flex-direction: column;
}

.payroll-payslip-detail-copy,
.payroll-payslip-detail-content,
.payroll-payslip-detail-section {
  gap: 1rem;
}

.payroll-payslip-detail-eyebrow,
.payroll-payslip-detail-summary-label,
.payroll-payslip-detail-label {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.payroll-payslip-detail-title,
.payroll-payslip-detail-summary-value,
.payroll-payslip-detail-section-title,
.payroll-payslip-detail-value {
  color: hsl(var(--foreground));
}

.payroll-payslip-detail-title {
  font-size: 1.25rem;
  font-weight: 700;
}

.payroll-payslip-detail-text {
  color: hsl(var(--muted-foreground));
}

.payroll-payslip-detail-state {
  display: flex;
  min-height: 12rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.payroll-payslip-detail-state-error {
  gap: 1rem;
}

.payroll-payslip-detail-summary-grid,
.payroll-payslip-detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(10rem, 1fr));
  gap: 0.85rem;
}

.payroll-payslip-detail-summary-card,
.payroll-payslip-detail-item {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  padding: 0.95rem 1rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--secondary) / 0.12);
}

.payroll-payslip-detail-summary-value,
.payroll-payslip-detail-value {
  font-size: 1rem;
  font-weight: 600;
}

.payroll-payslip-detail-value-strong {
  font-size: 1.1rem;
  font-weight: 700;
}

@media (max-width: 768px) {
  .payroll-payslip-detail-header,
  .payroll-payslip-detail-title-row,
  .payroll-payslip-detail-section-heading {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
