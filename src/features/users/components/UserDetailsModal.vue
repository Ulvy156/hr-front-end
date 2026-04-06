<script setup lang="ts">
import BaseBadge from '@/components/ui/BaseBadge.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

import type { UserAccount } from '../interface/user.interface'
import { formatUserDate, formatUserLabel } from '../utils/user'

const props = withDefaults(
  defineProps<{
    open: boolean
    user?: UserAccount | null
    loading?: boolean
    error?: string
  }>(),
  {
    user: null,
    loading: false,
    error: '',
  },
)

const emit = defineEmits<{
  close: []
  retry: []
}>()

const getStatusVariant = (value: string | null | undefined) => {
  if (value === 'active') return 'success'
  if (value === 'inactive') return 'warning'
  if (value === 'terminated') return 'danger'
  return 'default'
}

const getRoleVariant = (value: string | null | undefined) => {
  if (value === 'admin') return 'primary'
  if (value === 'hr') return 'warning'
  return 'default'
}
</script>

<template>
  <BaseModal
    :model-value="open"
    title="User Details"
    width="46rem"
    @close="emit('close')"
    @update:model-value="(value) => !value && emit('close')"
  >
    <div v-if="loading" class="flex min-h-56 items-center justify-center">
      <BaseSpinner />
    </div>

    <div v-else-if="error" class="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
      <h3 class="text-lg font-semibold text-slate-900">Unable to load user details</h3>
      <p class="max-w-md text-sm text-slate-500">{{ error }}</p>
      <BaseButton @click="emit('retry')">Try Again</BaseButton>
    </div>

    <div v-else-if="user" class="space-y-6">
      <section class="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Name</p>
          <p class="text-sm font-medium text-slate-900">{{ user.name }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email</p>
          <p class="text-sm font-medium text-slate-900">{{ user.email }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">User ID</p>
          <p class="text-sm font-medium text-slate-900">{{ user.id }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Email Verified</p>
          <p class="text-sm font-medium text-slate-900">{{ formatUserDate(user.email_verified_at) }}</p>
        </div>
      </section>

      <section class="space-y-3">
        <div>
          <h3 class="text-sm font-semibold text-slate-900">Assigned Roles</h3>
          <p class="text-sm text-slate-500">Roles returned by the admin role lookup and user detail API.</p>
        </div>

        <div class="flex flex-wrap gap-2">
          <BaseBadge
            v-for="role in user.roles"
            :key="role.id"
            :variant="getRoleVariant(role.name)"
          >
            {{ role.description || formatUserLabel(role.name) }}
          </BaseBadge>
          <p v-if="!user.roles.length" class="text-sm text-slate-500">No roles assigned.</p>
        </div>
      </section>

      <section class="space-y-3">
        <div>
          <h3 class="text-sm font-semibold text-slate-900">Linked Employee</h3>
          <p class="text-sm text-slate-500">Employee information included with the user resource.</p>
        </div>

        <div
          v-if="user.employee"
          class="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 p-4 md:grid-cols-2"
        >
          <div class="space-y-1">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Employee</p>
            <p class="text-sm font-medium text-slate-900">{{ user.employee.full_name }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Employee Code</p>
            <p class="text-sm font-medium text-slate-900">{{ user.employee.employee_code || '--' }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Status</p>
            <BaseBadge :variant="getStatusVariant(user.employee.status)">
              {{ formatUserLabel(user.employee.status) }}
            </BaseBadge>
          </div>
          <div class="space-y-1">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Department</p>
            <p class="text-sm font-medium text-slate-900">{{ user.employee.department?.name || '--' }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Position</p>
            <p class="text-sm font-medium text-slate-900">{{ user.employee.current_position?.title || '--' }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Employee ID</p>
            <p class="text-sm font-medium text-slate-900">{{ user.employee.id }}</p>
          </div>
        </div>

        <div v-else class="rounded-2xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">
          No employee is linked to this user.
        </div>
      </section>

      <section class="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 p-4 md:grid-cols-2">
        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Created At</p>
          <p class="text-sm font-medium text-slate-900">{{ formatUserDate(user.created_at) }}</p>
        </div>
        <div class="space-y-1">
          <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Updated At</p>
          <p class="text-sm font-medium text-slate-900">{{ formatUserDate(user.updated_at) }}</p>
        </div>
      </section>
    </div>
  </BaseModal>
</template>
