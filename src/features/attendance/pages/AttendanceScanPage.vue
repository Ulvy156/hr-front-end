<script setup lang="ts">
import { ArrowLeft, CheckCircle2, Clock3, QrCode, ShieldAlert } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { formatDateTime12h } from '@/utils/time'

import { useAttendance } from '../composable/useAttendance'
import type { EmployeeAttendanceTodayDetail } from '../interface/attendance.interface'
import {
  formatAttendanceActionLabel,
  getAttendanceRequestErrorMessage,
  isSelfServiceAttendanceAction,
  type SelfServiceAttendanceAction,
} from '../utils/selfService'

type ScanState = 'processing' | 'success' | 'completed' | 'error'

const router = useRouter()
const {
  canUseSelfAttendanceActions,
  checkIn,
  checkOut,
  fetchEmployeeAttendance,
  fetchEmployeeTodayAttendance,
} = useAttendance()

const state = ref<ScanState>('processing')
const message = ref('Preparing your attendance action...')
const performedAction = ref<SelfServiceAttendanceAction | null>(null)
const actionTimestamp = ref<string | null>(null)
const todayAttendance = ref<EmployeeAttendanceTodayDetail | null>(null)

const displayedAction = computed(() =>
  performedAction.value ? formatAttendanceActionLabel(performedAction.value) : null,
)

const displayedTimestamp = computed(() => {
  return formatDateTime12h(actionTimestamp.value)
})

const displayedNextAction = computed(() => {
  const nextAction = todayAttendance.value?.nextAction

  return nextAction ? formatAttendanceActionLabel(nextAction) : '--'
})

const loadTodayAttendance = async () => {
  const response = await fetchEmployeeTodayAttendance()
  todayAttendance.value = response.data

  return response.data
}

const runScanFlow = async () => {
  state.value = 'processing'
  message.value = 'Preparing your attendance action...'
  performedAction.value = null
  actionTimestamp.value = null

  if (!canUseSelfAttendanceActions.value) {
    state.value = 'error'
    message.value = 'Self-service attendance is unavailable for this account.'
    todayAttendance.value = null
    return
  }

  try {
    const today = await loadTodayAttendance()

    if (!isSelfServiceAttendanceAction(today.nextAction)) {
      state.value = 'completed'
      message.value = 'Attendance is already completed for today.'
      return
    }

    performedAction.value = today.nextAction
    const response = today.nextAction === 'check_in' ? await checkIn() : await checkOut()

    actionTimestamp.value =
      today.nextAction === 'check_in'
        ? response.data.checkInAt ?? response.data.createdAt
        : response.data.checkOutAt ?? response.data.updatedAt

    await loadTodayAttendance().catch(() => undefined)
    await fetchEmployeeAttendance().catch(() => undefined)

    state.value = 'success'
    message.value = response.message
  } catch (err) {
    state.value = 'error'
    message.value = getAttendanceRequestErrorMessage(err)
  }
}

onMounted(async () => {
  await runScanFlow()
})
</script>

<template>
  <main class="attendance-scan-page">
    <BaseCard class="attendance-scan-card">
      <div class="attendance-scan-header">
        <div class="attendance-scan-icon-shell">
          <QrCode :size="24" />
        </div>
        <div>
          <p class="attendance-scan-label">QR Attendance</p>
          <h1 class="attendance-scan-title">Self-Service Scan Flow</h1>
          <p class="attendance-scan-text">
            Use this page on mobile to record your attendance quickly and see today’s result.
          </p>
        </div>
      </div>

      <div v-if="state === 'processing'" class="attendance-scan-state">
        <BaseSpinner />
        <p class="attendance-scan-text">{{ message }}</p>
      </div>

      <div v-else class="attendance-scan-result">
        <div
          :class="[
            'attendance-scan-banner',
            state === 'success'
              ? 'attendance-scan-banner-success'
              : state === 'completed'
                ? 'attendance-scan-banner-completed'
                : 'attendance-scan-banner-error',
          ]"
        >
          <CheckCircle2 v-if="state === 'success'" :size="18" />
          <Clock3 v-else-if="state === 'completed'" :size="18" />
          <ShieldAlert v-else :size="18" />
          <span>{{ message }}</span>
        </div>

        <div class="attendance-scan-grid">
          <div class="attendance-scan-detail">
            <span class="attendance-scan-detail-label">Action</span>
            <strong class="attendance-scan-detail-value">
              {{ displayedAction ?? 'No action performed' }}
            </strong>
          </div>
          <div class="attendance-scan-detail">
            <span class="attendance-scan-detail-label">Timestamp</span>
            <strong class="attendance-scan-detail-value">{{ displayedTimestamp }}</strong>
          </div>
          <div class="attendance-scan-detail">
            <span class="attendance-scan-detail-label">Today Status</span>
            <strong class="attendance-scan-detail-value">
              {{ todayAttendance?.todayAttendanceStatus ?? '--' }}
            </strong>
          </div>
          <div class="attendance-scan-detail">
            <span class="attendance-scan-detail-label">Next Action</span>
            <strong class="attendance-scan-detail-value">{{ displayedNextAction }}</strong>
          </div>
        </div>

        <div class="attendance-scan-actions">
          <BaseButton variant="secondary" @click="runScanFlow">Retry Scan</BaseButton>
          <BaseButton variant="ghost" @click="router.push({ name: 'attendance' })">
            <ArrowLeft :size="16" />
            Back to Attendance
          </BaseButton>
        </div>
      </div>
    </BaseCard>
  </main>
</template>

<style scoped>
.attendance-scan-page {
  display: flex;
  min-height: calc(100vh - 8rem);
  align-items: center;
  justify-content: center;
}

.attendance-scan-card {
  width: min(100%, 40rem);
}

.attendance-scan-header,
.attendance-scan-result,
.attendance-scan-state {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
}

.attendance-scan-header {
  border-bottom: 1px solid hsl(var(--border-gray));
}

.attendance-scan-icon-shell {
  display: inline-flex;
  height: 3rem;
  width: 3rem;
  align-items: center;
  justify-content: center;
  border-radius: 1rem;
  background: hsl(var(--secondary));
  color: hsl(var(--foreground));
}

.attendance-scan-label,
.attendance-scan-text,
.attendance-scan-detail-label {
  color: hsl(var(--muted-foreground));
}

.attendance-scan-title {
  color: hsl(var(--foreground));
}

.attendance-scan-state {
  min-height: 16rem;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.attendance-scan-banner {
  display: inline-flex;
  align-items: center;
  gap: 0.625rem;
  border-radius: calc(var(--radius) - 0.125rem);
  padding: 0.875rem 1rem;
  font-weight: 600;
}

.attendance-scan-banner-success {
  background: hsl(142 76% 96%);
  color: hsl(142 72% 24%);
}

.attendance-scan-banner-completed {
  background: hsl(210 40% 96%);
  color: hsl(215 25% 27%);
}

.attendance-scan-banner-error {
  background: hsl(0 86% 97%);
  color: hsl(0 72% 42%);
}

.attendance-scan-grid {
  display: grid;
  gap: 0.75rem;
  grid-template-columns: repeat(1, minmax(0, 1fr));
}

.attendance-scan-detail {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: calc(var(--radius) - 0.125rem);
  padding: 0.875rem 1rem;
}

.attendance-scan-detail-value {
  color: hsl(var(--foreground));
}

.attendance-scan-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .attendance-scan-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
