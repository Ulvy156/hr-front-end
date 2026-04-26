<script setup lang="ts">
import { CalendarRange, Clock3 } from 'lucide-vue-next'

import BaseCard from '@/components/ui/BaseCard.vue'

import type { LeaveCurrentBalance, LeaveRequestBalance } from '../interface/leave.interface'
import { isUnpaidLeaveType } from '../utils/leave'

type LeaveBalanceSummaryItem = LeaveRequestBalance | LeaveCurrentBalance

const props = withDefaults(
  defineProps<{
    balances: LeaveBalanceSummaryItem[]
    title?: string
    description?: string
    embedded?: boolean
  }>(),
  {
    title: 'Leave Balance Snapshot',
    description: 'Balance availability returned by the leave request API.',
    embedded: false,
  },
)

const isCurrentBalance = (balance: LeaveBalanceSummaryItem): balance is LeaveCurrentBalance => {
  return 'leave_type' in balance
}

const currentBalances = computed(() => props.balances.filter(isCurrentBalance))

const currentBalanceYearLabel = computed(() => {
  if (!props.balances.length || currentBalances.value.length !== props.balances.length) {
    return ''
  }

  const years = Array.from(new Set(currentBalances.value.map((balance) => balance.year))).sort(
    (left, right) => left - right,
  )

  if (!years.length) {
    return ''
  }

  if (years.length === 1) {
    return `Year ${years[0]}`
  }

  return `Years ${years.join(', ')}`
})

const getBalanceTitle = (balance: LeaveBalanceSummaryItem) => {
  if (isCurrentBalance(balance)) {
    return balance.leave_type.label || balance.leave_type.name
  }

  return `Year ${balance.year}`
}

const isUnlimitedCurrentBalance = (balance: LeaveBalanceSummaryItem) => {
  if (!isCurrentBalance(balance)) {
    return false
  }

  return isUnpaidLeaveType(balance.leave_type)
}

const formatDaysLabel = (value: number | null | undefined) => {
  if (typeof value !== 'number') {
    return '--'
  }

  return `${value} day${value === 1 ? '' : 's'}`
}

const getPrimaryValue = (balance: LeaveBalanceSummaryItem) => {
  if (isUnlimitedCurrentBalance(balance)) {
    return 'Unlimited'
  }

  if (isCurrentBalance(balance)) {
    return formatDaysLabel(balance.remaining_days)
  }

  return formatDaysLabel(balance.available_days)
}

const getPrimaryCaption = (balance: LeaveBalanceSummaryItem) => {
  if (isUnlimitedCurrentBalance(balance)) {
    return 'No limit'
  }

  return isCurrentBalance(balance) ? 'remaining days' : 'available days'
}

const getSecondaryValue = (balance: LeaveBalanceSummaryItem) => {
  if (isUnlimitedCurrentBalance(balance)) {
    return 'No balance tracking'
  }

  if (isCurrentBalance(balance)) {
    return `${formatDaysLabel(balance.used_days)} used / ${formatDaysLabel(balance.total_days)} total`
  }

  return `${formatDaysLabel(balance.used_days)} used / ${formatDaysLabel(balance.entitlement_days)} total`
}

const getBalanceMeta = (balance: LeaveBalanceSummaryItem) => {
  if (isCurrentBalance(balance)) {
    return `Policy year ${balance.year}`
  }

  return `Snapshot year ${balance.year}`
}

const getBalanceIcon = (balance: LeaveBalanceSummaryItem) => {
  return isCurrentBalance(balance) ? CalendarRange : Clock3
}
</script>

<template>
  <BaseCard :class="props.embedded ? 'leave-balance-card leave-balance-card-embedded' : 'leave-balance-card'">
    <div class="leave-balance-body">
      <div class="leave-balance-header">
        <div class="leave-balance-header-copy">
          <h3 class="leave-balance-title">{{ props.title }}</h3>
          <p class="leave-balance-text">{{ props.description }}</p>
        </div>
        <p v-if="currentBalanceYearLabel" class="leave-balance-year-pill">{{ currentBalanceYearLabel }}</p>
      </div>

      <div v-if="props.balances.length" class="leave-balance-grid">
        <div
          v-for="balance in props.balances"
          :key="isCurrentBalance(balance) ? `${balance.leave_type.code}-${balance.year}` : balance.year"
          :class="[
            'leave-balance-item',
            isCurrentBalance(balance) ? 'leave-balance-item-current' : 'leave-balance-item-snapshot',
          ]"
        >
          <div class="leave-balance-item-top">
            <span class="leave-balance-icon-shell">
              <component :is="getBalanceIcon(balance)" :size="16" />
            </span>

            <div class="leave-balance-item-heading">
              <p class="leave-balance-item-title">{{ getBalanceTitle(balance) }}</p>
              <p v-if="!isCurrentBalance(balance)" class="leave-balance-item-meta">{{ getBalanceMeta(balance) }}</p>
            </div>
          </div>

          <div class="leave-balance-highlight">
            <div class="leave-balance-highlight-main">
              <strong class="leave-balance-primary-value">{{ getPrimaryValue(balance) }}</strong>
              <p class="leave-balance-primary-caption">{{ getPrimaryCaption(balance) }}</p>
            </div>

            <div class="leave-balance-secondary-shell">
              <p class="leave-balance-secondary">
                {{ getSecondaryValue(balance) }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <p v-else class="leave-balance-empty">
        No leave balance information is available from the current API response yet.
      </p>
    </div>
  </BaseCard>
</template>

<style scoped>
.leave-balance-card {
  overflow: hidden;
}

.leave-balance-card-embedded {
  border: 0;
  box-shadow: none;
  background: transparent;
}

.leave-balance-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
}

.leave-balance-card-embedded .leave-balance-body {
  padding: 0;
}

.leave-balance-header,
.leave-balance-header-copy {
  display: flex;
}

.leave-balance-header {
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.leave-balance-header-copy {
  flex: 1;
  flex-direction: column;
  gap: 0.22rem;
  min-width: 0;
}

.leave-balance-title {
  color: hsl(var(--foreground));
  font-size: 1.15rem;
  font-weight: 700;
  line-height: 1.2;
}

.leave-balance-text,
.leave-balance-item-meta,
.leave-balance-primary-caption,
.leave-balance-secondary,
.leave-balance-empty {
  color: hsl(var(--muted-foreground));
}

.leave-balance-year-pill {
  flex-shrink: 0;
  padding: 0.35rem 0.7rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 999px;
  background: hsl(var(--secondary) / 0.22);
  color: hsl(var(--foreground));
  font-size: var(--text-xs);
  font-weight: 600;
}

.leave-balance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));
  gap: 1rem;
}

.leave-balance-item {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background:
    linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--secondary) / 0.18) 100%);
  box-shadow: var(--shadow-card);
  padding: 1rem 1rem 1.05rem;
  position: relative;
  overflow: hidden;
}

.leave-balance-item::before {
  content: '';
  position: absolute;
  inset: 0 auto auto 0;
  width: 100%;
  height: 3px;
  background: linear-gradient(90deg, hsl(var(--primary)) 0%, hsl(var(--primary) / 0.2) 100%);
}

.leave-balance-item-title,
.leave-balance-primary-value {
  color: hsl(var(--foreground));
}

.leave-balance-item-top,
.leave-balance-item-heading,
.leave-balance-highlight,
.leave-balance-highlight-main,
.leave-balance-secondary-shell {
  display: flex;
  flex-direction: column;
}

.leave-balance-item-top {
  flex-direction: row;
  align-items: flex-start;
  gap: 0.75rem;
}

.leave-balance-icon-shell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.25rem;
  height: 2.25rem;
  flex-shrink: 0;
  border-radius: 999px;
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
}

.leave-balance-item-heading {
  gap: 0.18rem;
  min-width: 0;
}

.leave-balance-item-title {
  min-height: 2.2rem;
  font-weight: 700;
  line-height: 1.35;
}

.leave-balance-item-meta {
  font-size: var(--text-xs);
}

.leave-balance-highlight {
  gap: 0.85rem;
}

.leave-balance-highlight-main {
  gap: 0.24rem;
}

.leave-balance-primary-value {
  font-size: clamp(1.5rem, 1.25rem + 1vw, 2rem);
  line-height: 1;
  letter-spacing: -0.03em;
}

.leave-balance-primary-caption {
  font-size: var(--text-sm);
}

.leave-balance-secondary-shell {
  gap: 0.18rem;
  padding: 0.75rem 0.8rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: calc(var(--radius) - 0.2rem);
  background: hsl(var(--card) / 0.8);
}

.leave-balance-secondary {
  font-size: var(--text-sm);
  line-height: 1.4;
}

@media (max-width: 640px) {
  .leave-balance-header {
    flex-direction: column;
  }

  .leave-balance-year-pill {
    align-self: flex-start;
  }
}
</style>
