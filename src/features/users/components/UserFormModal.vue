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
import { USER_MANAGEMENT_LABELS } from '../utils/user'

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
  role_id: string
}

const form = reactive<UserFormState>({
  name: '',
  email: '',
  password: '',
  employee_id: '',
  role_id: '',
})

const modalTitle = computed(() => (props.mode === 'create' ? 'Create User' : 'Edit User'))
const modalEyebrow = computed(() => (props.mode === 'create' ? 'New User' : 'Edit User'))
const modalDescription = computed(() =>
  props.mode === 'create'
    ? 'Add a new user account, choose a user type, and optionally link an employee.'
    : 'Update the account details and review the linked employee.',
)
const submitLabel = computed(() => (props.mode === 'create' ? 'Create User' : 'Save Changes'))
const roleOptions = computed<BaseDropdownOption[]>(() =>
  props.roles.map((role) => ({
    label: role.description || role.name,
    value: role.id,
  })),
)

const roleIdModel = computed({
  get: () => form.role_id,
  set: (value: unknown) => {
    form.role_id = value == null ? '' : String(value)
  },
})

const syncForm = () => {
  const resolvedEmployeeId = props.user?.employee_id ?? props.user?.employee?.id ?? null

  form.name = props.user?.name ?? ''
  form.email = props.user?.email ?? ''
  form.password = ''
  form.employee_id = resolvedEmployeeId ? String(resolvedEmployeeId) : ''
  form.role_id = props.user?.roles?.[0]?.id ? String(props.user.roles[0].id) : ''
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
    const roleId = Number(form.role_id)

    if (form.role_id && (!Number.isFinite(roleId) || roleId <= 0)) {
      ElMessage.error(`Select a valid ${USER_MANAGEMENT_LABELS.userType.toLowerCase()}.`)
      return
    }

    emit('save', {
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      ...(Number.isFinite(employeeId) && employeeId > 0
        ? { employee_id: employeeId }
        : {}),
      role_ids: Number.isFinite(roleId) && roleId > 0 ? [roleId] : [],
    })
    return
  }

  const employeeId = props.user?.employee_id ?? props.user?.employee?.id ?? null
  const roleId = Number(form.role_id)

  if (!employeeId || employeeId <= 0) {
    ElMessage.error('This user is missing a linked employee and cannot be updated from this form.')
    return
  }

  if (form.role_id && (!Number.isFinite(roleId) || roleId <= 0)) {
    ElMessage.error(`Select a valid ${USER_MANAGEMENT_LABELS.userType.toLowerCase()}.`)
    return
  }

  emit('save', {
    name: form.name.trim(),
    email: form.email.trim(),
    employee_id: employeeId,
    role_ids: Number.isFinite(roleId) && roleId > 0 ? [roleId] : [],
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
    width="52rem"
    @close="handleClose"
    @update:model-value="(value) => !value && handleClose()"
  >
    <template #header>
      <div class="user-form-modal-header">
        <p class="user-form-modal-eyebrow">{{ modalEyebrow }}</p>
        <h2 class="user-form-modal-title">{{ modalTitle }}</h2>
        <p class="user-form-modal-description">{{ modalDescription }}</p>
      </div>
    </template>

    <div v-if="mode === 'edit' && loading" class="user-form-state">
      <BaseSpinner />
    </div>

    <div v-else-if="mode === 'edit' && error" class="user-form-state user-form-state-error">
      <h3 class="user-form-state-title">Unable to load user</h3>
      <p class="user-form-state-text">{{ error }}</p>
      <BaseButton @click="emit('retry')">Try Again</BaseButton>
    </div>

    <div v-else class="user-form-layout">
      <section class="user-form-section">
        <div class="user-form-section-header">
          <div>
            <h3 class="user-form-section-title">Account Information</h3>
            <p class="user-form-section-text">
              Start with the required account details used for sign-in and identity.
            </p>
          </div>
        </div>

        <div class="user-form-grid">
          <BaseInput v-model="form.name" label="Name" placeholder="User name" required size="large" />
          <BaseInput v-model="form.email" label="Email" placeholder="user@example.com" required size="large" type="email" />
          <BaseInput
            v-if="mode === 'create'"
            v-model="form.password"
            label="Password"
            placeholder="Create a password"
            required
            size="large"
            type="password"
          />
        </div>
      </section>

      <section class="user-form-section">
        <div class="user-form-section-header">
          <div>
            <h3 class="user-form-section-title">{{ USER_MANAGEMENT_LABELS.userType }}</h3>
            <p class="user-form-section-text">
              Choose one user type to set the user's standard access.
            </p>
          </div>
        </div>

        <div class="user-form-grid user-form-grid-single">
          <BaseDropdown
            v-model="roleIdModel"
            :loading="rolesLoading"
            :options="roleOptions"
            clearable
            filterable
            :label="USER_MANAGEMENT_LABELS.userType"
            :placeholder="`Select a ${USER_MANAGEMENT_LABELS.userType.toLowerCase()}`"
          />
        </div>
      </section>

      <section v-if="mode === 'create'" class="user-form-section">
        <div class="user-form-section-header">
          <div>
            <div class="user-form-section-heading">
              <h3 class="user-form-section-title">Employee Link</h3>
              <span class="user-form-optional-badge">Optional</span>
            </div>
            <p class="user-form-section-text">
              Link this user to an employee now, or leave the field empty and connect it later.
            </p>
          </div>
        </div>

        <div class="user-form-grid">
          <BaseInput
            v-model="form.employee_id"
            label="Employee ID"
            placeholder="Linked employee ID"
            size="large"
            type="number"
          />
        </div>
      </section>

      <section v-if="mode === 'edit'" class="user-form-section user-form-linked-summary">
        <div class="user-form-section-header">
          <div>
            <h3 class="user-form-section-title">Linked Employee</h3>
            <p class="user-form-section-text">
              Review the employee currently attached to this user account.
            </p>
          </div>
        </div>

        <div class="user-form-summary-grid">
          <div class="user-form-summary-item">
            <p class="user-form-summary-label">Employee</p>
            <p class="user-form-summary-value">{{ user?.employee?.full_name || 'No linked employee' }}</p>
          </div>
          <div class="user-form-summary-item">
            <p class="user-form-summary-label">Employee ID</p>
            <p class="user-form-summary-value">{{ user?.employee_id ?? user?.employee?.id ?? '--' }}</p>
          </div>
          <div class="user-form-summary-item user-form-summary-item-wide">
            <p class="user-form-summary-label">Employee Code</p>
            <p class="user-form-summary-value">{{ user?.employee?.employee_code || '--' }}</p>
          </div>
        </div>
      </section>
    </div>

    <template #footer>
      <div class="user-form-footer">
        <div class="user-form-footer-copy">
          <p class="user-form-footer-title">
            {{ mode === 'create' ? 'Create the account when you are ready.' : 'Save the changes when you are ready.' }}
          </p>
          <p class="user-form-footer-text">
            {{ mode === 'create'
              ? 'Account details are grouped above, and the employee link is optional.'
              : 'Only the details shown here will be updated.' }}
          </p>
        </div>

        <div class="user-form-footer-actions">
          <BaseButton variant="ghost" @click="handleClose">Cancel</BaseButton>
          <BaseButton :loading="submitting" @click="handleSubmit">
            {{ submitLabel }}
          </BaseButton>
        </div>
      </div>
    </template>
  </BaseModal>
</template>

<style scoped>
.user-form-modal-header,
.user-form-layout,
.user-form-state,
.user-form-footer-copy,
.user-form-section-header {
  display: flex;
  flex-direction: column;
}

.user-form-modal-header,
.user-form-section-header {
  gap: 0.35rem;
}

.user-form-layout {
  gap: 1rem;
}

.user-form-modal-eyebrow,
.user-form-modal-description,
.user-form-section-text,
.user-form-state-text,
.user-form-summary-label,
.user-form-footer-text {
  color: hsl(var(--muted-foreground));
}

.user-form-modal-eyebrow,
.user-form-summary-label {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.user-form-modal-title,
.user-form-section-title,
.user-form-state-title,
.user-form-summary-value,
.user-form-footer-title {
  color: hsl(var(--foreground));
}

.user-form-modal-title {
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.2;
}

.user-form-modal-description {
  max-width: 42rem;
  font-size: var(--text-sm);
  line-height: 1.55;
}

.user-form-state {
  align-items: center;
  justify-content: center;
  min-height: 16rem;
  gap: 0.75rem;
  text-align: center;
}

.user-form-state-text {
  max-width: 32rem;
  font-size: var(--text-sm);
}

.user-form-state-error {
  padding-inline: 1rem;
}

.user-form-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 1rem;
  background: hsl(var(--secondary) / 0.18);
}

.user-form-section-title {
  font-size: var(--text-base);
  font-weight: 700;
  line-height: 1.35;
}

.user-form-section-text {
  font-size: var(--text-sm);
  line-height: 1.55;
}

.user-form-section-heading {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.user-form-optional-badge {
  display: inline-flex;
  align-items: center;
  min-height: 1.5rem;
  padding: 0.15rem 0.55rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 9999px;
  background: hsl(var(--card));
  color: hsl(var(--muted-foreground));
  font-size: var(--text-xs);
  font-weight: 600;
}

.user-form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 1.25rem;
}

.user-form-grid-single {
  grid-template-columns: minmax(0, 1fr);
}

.user-form-linked-summary {
  background: hsl(var(--card));
}

.user-form-summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.85rem 1rem;
}

.user-form-summary-item {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.85rem 0.95rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--secondary) / 0.16);
}

.user-form-summary-item-wide {
  grid-column: span 2;
}

.user-form-summary-value {
  font-size: var(--text-sm);
  font-weight: 600;
  line-height: 1.45;
}

.user-form-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  width: 100%;
}

.user-form-footer-copy {
  gap: 0.2rem;
}

.user-form-footer-title {
  font-size: var(--text-sm);
  font-weight: 700;
}

.user-form-footer-text {
  font-size: var(--text-xs);
  line-height: 1.5;
}

.user-form-footer-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

@media (max-width: 768px) {
  .user-form-grid,
  .user-form-summary-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .user-form-summary-item-wide {
    grid-column: span 1;
  }

  .user-form-footer {
    flex-direction: column;
    align-items: stretch;
  }

  .user-form-footer-actions {
    width: 100%;
    justify-content: flex-end;
    flex-wrap: wrap;
  }
}
</style>
