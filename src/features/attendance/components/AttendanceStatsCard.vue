<script setup lang="ts">
import {
  BadgeCheck,
  CalendarDays,
  ClockAlert,
  FileClock,
  Hourglass,
  NotebookTabs,
  PencilLine,
  Timer,
  UserX,
} from 'lucide-vue-next'
import { computed, type Component } from 'vue'

import BaseCard from '@/components/ui/BaseCard.vue'

type StatsCardColor =
  | 'gray'
  | 'green'
  | 'yellow'
  | 'red'
  | 'blue'
  | 'purple'
  | 'indigo'
  | 'orange'
type StatsCardIcon =
  | 'records'
  | 'check'
  | 'clock'
  | 'absent'
  | 'edit'
  | 'timer'
  | 'hourglass'
  | 'file-clock'
  | 'calendar'

const props = defineProps<{
  title: string
  value: string | number
  icon: StatsCardIcon
  color: StatsCardColor
  helper?: string
}>()

const iconMap: Record<StatsCardIcon, Component> = {
  records: NotebookTabs,
  check: BadgeCheck,
  clock: ClockAlert,
  absent: UserX,
  edit: PencilLine,
  timer: Timer,
  hourglass: Hourglass,
  'file-clock': FileClock,
  calendar: CalendarDays,
}

const colorClasses: Record<StatsCardColor, string> = {
  gray: 'bg-gray-100 text-gray-600',
  green: 'bg-green-50 text-green-600',
  yellow: 'bg-yellow-50 text-yellow-600',
  red: 'bg-red-50 text-red-600',
  blue: 'bg-blue-50 text-blue-600',
  purple: 'bg-purple-50 text-purple-600',
  indigo: 'bg-indigo-50 text-indigo-600',
  orange: 'bg-orange-50 text-orange-600',
}

const iconComponent = computed(() => iconMap[props.icon])
const iconShellClass = computed(() => colorClasses[props.color])
</script>

<template>
  <BaseCard
    class="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
  >
    <div class="flex h-full flex-col">
      <div class="mb-2 flex items-center justify-between gap-3">
        <span class="text-sm text-gray-500">{{ title }}</span>
        <div
          :class="iconShellClass"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        >
          <component :is="iconComponent" class="h-4 w-4" />
        </div>
      </div>

      <div class="text-2xl font-bold leading-none text-gray-900 sm:text-3xl">
        {{ value }}
      </div>

      <div v-if="helper" class="mt-1 text-xs text-gray-400">
        {{ helper }}
      </div>
    </div>
  </BaseCard>
</template>
