<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

import type {
  UserAccount,
  UserCreatePayload,
  UserRole,
  UserUpdatePayload,
} from '../interface/user.interface'

const props = withDefaults(
  defineProps<{
    open: boolean
    mode: 'create' | 'edit'
    user?: UserAccount | null
    roles: UserRole[]
    rolesLoading?: boolean
    loading?: boolean
    error?: string
    submitting?: boolean
  }>(),
  {
    user: null,
    rolesLoading: false,
    loading: false,
    error: '',
    submitting: false,
  },
)

const emit = defineEmits<{
  close: []
  retry: []
  save: [payload: UserCreatePayload | UserUpdatePayload]
}>()

type UserFormState = {
  name: string
  email: string
  password: string
  employee_id: string
  role_ids: number[]
}

const form = reactive<UserFormState>({
  name: '',
  email: '',
  password: '',
  employee_id: '',
  role_ids: [],
})

const modalTitle = computed(() => (props.mode === 'create' ? 'Create User' : 'Edit User'))
const roleOptions = computed<BaseDropdownOption[]>(() =>
  props.roles.map((role) => ({
    label: role.description || role.name,
    value: role.id,
  })),
)

const roleIdsModel = computed({
  get: () => form.role_ids,
  set: (value: unknown) => {
    form.role_ids = Array.isArray(value)
      ? value
          .map((item) => Number(item))
          .filter((item) => Number.isFinite(item))
      : []
  },
})

const syncForm = () => {
  const resolvedEmployeeId = props.user?.employee_id ?? props.user?.employee?.id ?? null

  form.name = props.user?.name ?? ''
  form.email = props.user?.email ?? ''
  form.password = ''
  form.employee_id = resolvedEmployeeId ? String(resolvedEmployeeId) : ''
  form.role_ids = props.user?.roles?.map((role) => role.id) ?? []
}

const handleClose = () => {
  emit('close')
}

const handleSubmit = () => {
  if (!form.name.trim()) {
    ElMessage.error('Name is required.')
    return
  }

  if (!form.email.trim()) {
    ElMessage.error('Email is required.')
    return
  }

  if (props.mode === 'create' && !form.password.trim()) {
    ElMessage.error('Password is required.')
    return
  }

  if (props.mode === 'create') {
    const employeeId = Number(form.employee_id)

    if (!Number.isFinite(employeeId) || employeeId <= 0) {
      ElMessage.error('Employee ID is required.')
      return
    }

    emit('save', {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      employee_id: employeeId,
      role_ids: [...form.role_ids],
    })
    return
  }

  const employeeId = props.user?.employee_id ?? props.user?.employee?.id ?? null

  if (!employeeId || employeeId <= 0) {
    ElMessage.error('This user is missing a linked employee and cannot be updated from this form.')
    return
  }

  emit('save', {
    name: form.name.trim(),
    email: form.email.trim(),
    employee_id: employeeId,
    role_ids: [...form.role_ids],
  })
}

watch(
  () => [props.open, props.mode, props.user],
  () => {
    if (!props.open) {
      return
    }

    syncForm()
  },
  { immediate: true },
)
</script>

<template>
  <BaseModal
    :model-value="open"
    :title="modalTitle"
    width="44rem"
    @close="handleClose"
    @update:model-value="(value) => !value && handleClose()"
  >
    <div v-if="mode === 'edit' && loading" class="flex min-h-56 items-center justify-center">
      <BaseSpinner />
    </div>

    <div v-else-if="mode === 'edit' && error" class="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
      <h3 class="text-lg font-semibold text-slate-900">Unable to load user</h3>
      <p class="max-w-md text-sm text-slate-500">{{ error }}</p>
      <BaseButton @click="emit('retry')">Try Again</BaseButton>
    </div>

    <div v-else class="space-y-5">
      <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
        <BaseInput v-model="form.name" label="Name" placeholder="User name" required />
        <BaseInput v-model="form.email" label="Email" placeholder="user@example.com" required type="email" />
        <BaseInput
          v-if="mode === 'create'"
          v-model="form.password"
          label="Password"
          placeholder="Create a password"
          required
          type="password"
        />
        <BaseInput
          v-if="mode === 'create'"
          v-model="form.employee_id"
          label="Employee ID"
          placeholder="Linked employee ID"
          required
          type="number"
        />
        <div class="md:col-span-2">
          <BaseDropdown
            v-model="roleIdsModel"
            :loading="rolesLoading"
            :options="roleOptions"
            clearable
            filterable
            label="Roles"
            multiple
            placeholder="Select role(s)"
          />
        </div>
      </div>

      <div
        v-if="mode === 'edit'"
        class="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
      >
        <p class="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">Linked Employee</p>
        <p class="mt-1 text-sm font-medium text-slate-900">
          {{ user?.employee?.full_name || 'No linked employee' }}
        </p>
        <p class="mt-1 text-xs text-slate-500">
          ID: {{ user?.employee_id ?? user?.employee?.id ?? '--' }}
          <template v-if="user?.employee?.employee_code">
            • Code: {{ user.employee.employee_code }}
          </template>
        </p>
      </div>

      <div class="flex justify-end gap-3">
        <BaseButton variant="ghost" @click="handleClose">Cancel</BaseButton>
        <BaseButton :loading="submitting" @click="handleSubmit">
          {{ mode === 'create' ? 'Create User' : 'Save Changes' }}
        </BaseButton>
      </div>
    </div>
  </BaseModal>
</template>
