<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import { employeeService } from '../services/employeeService'
import type { EmployeeDetail, EmployeeListItem, EmployeeUpsertPayload } from '../interface/employee.interface'
import {
  getEmployeeRequestErrorMessage,
  getEmployeeSuccessMessage,
} from '../utils/employee'

const props = withDefaults(
  defineProps<{
    employeeId: number
    canEdit?: boolean
  }>(),
  {
    canEdit: true,
  },
)

const emit = defineEmits<{
  updated: [employee: EmployeeDetail]
}>()

type BasicInfoFormState = {
  user_id: string
  employee_code: string
  first_name: string
  last_name: string
  email: string
  phone: string
  status: string
  hire_date: string
  employment_type: string
  confirmation_date: string
  termination_date: string
  last_working_date: string
  department_id: string
  current_position_id: string
  manager_id: string
  date_of_birth: string
  gender: string
  personal_phone: string
  personal_email: string
  id_type: string
  id_number: string
}

const createEmptyForm = (): BasicInfoFormState => ({
  user_id: '',
  employee_code: '',
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  status: 'active',
  hire_date: '',
  employment_type: '',
  confirmation_date: '',
  termination_date: '',
  last_working_date: '',
  department_id: '',
  current_position_id: '',
  manager_id: '',
  date_of_birth: '',
  gender: '',
  personal_phone: '',
  personal_email: '',
  id_type: '',
  id_number: '',
})

const form = reactive<BasicInfoFormState>(createEmptyForm())
const initialSnapshot = ref<string>('')
const directoryEmployees = ref<EmployeeListItem[]>([])
const positionItems = ref<Array<{ id: number; title: string }>>([])
const employeeRecord = ref<EmployeeDetail | null>(null)
const isLoading = ref(false)
const isOptionsLoading = ref(false)
const isSaving = ref(false)
const loadError = ref('')

const statusOptions: BaseDropdownOption[] = [
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' },
  { label: 'Terminated', value: 'terminated' },
]

const employmentTypeOptions: BaseDropdownOption[] = [
  { label: 'Select employment type', value: '' },
  { label: 'Full Time', value: 'full_time' },
  { label: 'Part Time', value: 'part_time' },
  { label: 'Contract', value: 'contract' },
  { label: 'Intern', value: 'intern' },
  { label: 'Probation', value: 'probation' },
]

const genderOptions: BaseDropdownOption[] = [
  { label: 'Select gender', value: '' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer Not To Say', value: 'prefer_not_to_say' },
]

const idTypeOptions: BaseDropdownOption[] = [
  { label: 'Select ID type', value: '' },
  { label: 'National ID', value: 'national_id' },
  { label: 'Passport', value: 'passport' },
  { label: 'Driver License', value: 'driver_license' },
  { label: 'Residence Card', value: 'residence_card' },
  { label: 'Other', value: 'other' },
]

const mapEmployeeToForm = (employee: EmployeeDetail): BasicInfoFormState => ({
  user_id: employee.user_id ? String(employee.user_id) : '',
  employee_code: employee.employee_code ?? '',
  first_name: employee.first_name ?? '',
  last_name: employee.last_name ?? '',
  email: employee.email ?? '',
  phone: employee.phone ?? '',
  status: employee.status ?? 'active',
  hire_date: employee.hire_date ?? '',
  employment_type: employee.employment_type ?? '',
  confirmation_date: employee.confirmation_date ?? '',
  termination_date: employee.termination_date ?? '',
  last_working_date: employee.last_working_date ?? '',
  department_id: employee.department?.id ? String(employee.department.id) : '',
  current_position_id: employee.current_position_id ? String(employee.current_position_id) : '',
  manager_id: employee.manager_id ? String(employee.manager_id) : '',
  date_of_birth: employee.date_of_birth ?? '',
  gender: employee.gender ?? '',
  personal_phone: employee.personal_phone ?? '',
  personal_email: employee.personal_email ?? '',
  id_type: employee.id_type ?? '',
  id_number: employee.id_number ?? '',
})

const assignForm = (employee: EmployeeDetail) => {
  Object.assign(form, mapEmployeeToForm(employee))
  initialSnapshot.value = JSON.stringify(form)
}

const departmentOptions = computed<BaseDropdownOption[]>(() => {
  const uniqueDepartments = new Map<number, string>()

  for (const employee of directoryEmployees.value) {
    if (employee.department?.id && employee.department.name) {
      uniqueDepartments.set(employee.department.id, employee.department.name)
    }
  }

  if (employeeRecord.value?.department?.id && employeeRecord.value.department.name) {
    uniqueDepartments.set(employeeRecord.value.department.id, employeeRecord.value.department.name)
  }

  return Array.from(uniqueDepartments.entries())
    .sort((left, right) => left[1].localeCompare(right[1]))
    .map(([id, name]) => ({ label: name, value: String(id) }))
})

const managerOptions = computed<BaseDropdownOption[]>(() => {
  const uniqueManagers = new Map<number, string>()

  for (const employee of directoryEmployees.value) {
    if (employee.manager?.id && employee.manager.name) {
      uniqueManagers.set(employee.manager.id, employee.manager.name)
    }
  }

  if (employeeRecord.value?.manager?.id && employeeRecord.value.manager.name) {
    uniqueManagers.set(employeeRecord.value.manager.id, employeeRecord.value.manager.name)
  }

  return Array.from(uniqueManagers.entries())
    .sort((left, right) => left[1].localeCompare(right[1]))
    .map(([id, name]) => ({ label: name, value: String(id) }))
})

const positionOptions = computed<BaseDropdownOption[]>(() =>
  positionItems.value.map((position) => ({
    label: position.title,
    value: String(position.id),
  })),
)

const normalizeNullableString = (value: string) => {
  const trimmed = value.trim()

  return trimmed ? trimmed : null
}

const normalizeNullableNumber = (value: string) => {
  const trimmed = value.trim()

  if (!trimmed) {
    return null
  }

  const parsed = Number(trimmed)

  return Number.isFinite(parsed) ? parsed : null
}

const buildPayload = (): EmployeeUpsertPayload => ({
  user_id: normalizeNullableNumber(form.user_id),
  employee_code: normalizeNullableString(form.employee_code),
  first_name: form.first_name.trim(),
  last_name: form.last_name.trim(),
  email: form.email.trim(),
  phone: form.phone.trim(),
  status: form.status || 'active',
  hire_date: form.hire_date,
  employment_type: normalizeNullableString(form.employment_type),
  confirmation_date: normalizeNullableString(form.confirmation_date),
  termination_date: normalizeNullableString(form.termination_date),
  last_working_date: normalizeNullableString(form.last_working_date),
  department_id: normalizeNullableNumber(form.department_id),
  current_position_id: normalizeNullableNumber(form.current_position_id),
  manager_id: normalizeNullableNumber(form.manager_id),
  date_of_birth: normalizeNullableString(form.date_of_birth),
  gender: normalizeNullableString(form.gender),
  personal_phone: normalizeNullableString(form.personal_phone),
  personal_email: normalizeNullableString(form.personal_email),
  id_type: normalizeNullableString(form.id_type),
  id_number: normalizeNullableString(form.id_number),
})

const getValidationMessage = () => {
  if (!form.first_name.trim()) {
    return 'First name is required.'
  }

  if (!form.last_name.trim()) {
    return 'Last name is required.'
  }

  if (!form.email.trim()) {
    return 'Email is required.'
  }

  if (!form.phone.trim()) {
    return 'Phone is required.'
  }

  if (!form.hire_date.trim()) {
    return 'Hire date is required.'
  }

  if (!form.department_id.trim()) {
    return 'Department is required.'
  }

  if (!form.current_position_id.trim()) {
    return 'Current position is required.'
  }

  return ''
}

const loadOptions = async () => {
  isOptionsLoading.value = true

  try {
    const [positionsResponse, employeesResponse] = await Promise.all([
      employeeService.getPositions(),
      employeeService.getEmployees({
        per_page: 100,
        sort_by: 'first_name',
        sort_direction: 'asc',
      }),
    ])

    positionItems.value = positionsResponse.data
    directoryEmployees.value = employeesResponse.data
  } finally {
    isOptionsLoading.value = false
  }
}

const loadBasicInfo = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const employee = await employeeService.getEmployee(props.employeeId, { include: ['user'] })
    employeeRecord.value = employee
    assignForm(employee)
  } catch (error) {
    loadError.value = getEmployeeRequestErrorMessage(error, 'Failed to load employee details.')
  } finally {
    isLoading.value = false
  }
}

const resetForm = () => {
  if (!initialSnapshot.value) {
    return
  }

  Object.assign(form, JSON.parse(initialSnapshot.value) as BasicInfoFormState)
}

const saveBasicInfo = async () => {
  const validationMessage = getValidationMessage()

  if (validationMessage) {
    ElMessage.error(validationMessage)
    return
  }

  isSaving.value = true

  try {
    const response = await employeeService.updateEmployee(props.employeeId, buildPayload())
    assignForm(response)
    emit('updated', response)
    ElMessage.success(getEmployeeSuccessMessage(response, 'Employee details updated successfully.'))
  } catch (error) {
    ElMessage.error(getEmployeeRequestErrorMessage(error))
  } finally {
    isSaving.value = false
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadOptions(), loadBasicInfo()])
  } catch (error) {
    if (!loadError.value) {
      loadError.value = getEmployeeRequestErrorMessage(error, 'Failed to load employee form options.')
    }
  }
})

watch(
  () => props.employeeId,
  async () => {
    try {
      await Promise.all([loadOptions(), loadBasicInfo()])
    } catch (error) {
      if (!loadError.value) {
        loadError.value = getEmployeeRequestErrorMessage(error, 'Failed to load employee form options.')
      }
    }
  },
)
</script>

<template>
  <div class="space-y-5">
    <div v-if="isLoading" class="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <BaseSpinner />
    </div>

    <BaseCard v-else-if="loadError" class="border border-red-100 shadow-sm">
      <div class="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
        <h3 class="text-lg font-semibold text-slate-900">Unable to load basic info</h3>
        <p class="max-w-md text-sm text-slate-500">{{ loadError }}</p>
        <BaseButton @click="loadBasicInfo">Try Again</BaseButton>
      </div>
    </BaseCard>

    <template v-else>
      <div
        class="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm lg:flex-row lg:items-center lg:justify-between"
      >
        <div>
          <h3 class="text-lg font-semibold text-slate-900">Basic Info</h3>
          <p class="text-sm text-slate-500">
            Update employee identity, work setup, and personal details in one place.
          </p>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <BaseButton variant="ghost" @click="resetForm">Reset</BaseButton>
          <BaseButton
            :disabled="!canEdit"
            :loading="isSaving || isOptionsLoading"
            @click="saveBasicInfo"
          >
            Save Basic Info
          </BaseButton>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6">
        <BaseCard class="w-full border border-slate-200 shadow-sm">
          <div class="space-y-5 p-5 lg:p-6">
            <div class="space-y-1 border-b border-slate-100 pb-4">
              <h4 class="text-base font-semibold text-slate-900">General Info</h4>
              <p class="text-sm text-slate-500">Core employee details used across the employee record.</p>
            </div>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div class="lg:col-span-1">
                <BaseInput v-model="form.user_id" label="User ID" placeholder="Linked user ID" type="number" />
              </div>
              <div class="lg:col-span-1">
                <BaseInput v-model="form.employee_code" label="Employee Code" placeholder="Optional employee code" />
              </div>
              <div class="lg:col-span-1">
                <BaseDatePicker v-model="form.hire_date" label="Hire Date" required value-format="YYYY-MM-DD" />
              </div>
              <div class="lg:col-span-1">
                <BaseInput v-model="form.first_name" label="First Name" placeholder="First name" required />
              </div>
              <div class="lg:col-span-1">
                <BaseInput v-model="form.last_name" label="Last Name" placeholder="Last name" required />
              </div>
              <div class="lg:col-span-1">
                <BaseInput v-model="form.phone" label="Phone" placeholder="Primary work phone" required />
              </div>
              <div class="lg:col-span-2">
                <BaseInput v-model="form.email" label="Email" placeholder="name@example.com" required type="email" />
              </div>
              <div class="lg:col-span-1">
                <BaseDatePicker
                  v-model="form.confirmation_date"
                  label="Confirmation Date"
                  value-format="YYYY-MM-DD"
                />
              </div>
              <div class="lg:col-span-1">
                <BaseDatePicker
                  v-model="form.termination_date"
                  label="Termination Date"
                  value-format="YYYY-MM-DD"
                />
              </div>
              <div class="lg:col-span-1">
                <BaseDatePicker
                  v-model="form.last_working_date"
                  label="Last Working Date"
                  value-format="YYYY-MM-DD"
                />
              </div>
              <div class="lg:col-span-3">
                <BaseDropdown
                  v-model="form.status"
                  :clearable="false"
                  :options="statusOptions"
                  label="Status"
                  required
                />
              </div>
              <div class="lg:col-span-3">
                <BaseDropdown
                  v-model="form.employment_type"
                  :options="employmentTypeOptions"
                  label="Employment Type"
                />
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="w-full border border-slate-200 shadow-sm">
          <div class="space-y-5 p-5 lg:p-6">
            <div class="space-y-1 border-b border-slate-100 pb-4">
              <h4 class="text-base font-semibold text-slate-900">Work Setup</h4>
              <p class="text-sm text-slate-500">Choose the department, current position, and manager.</p>
            </div>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div class="w-full min-w-0 lg:col-span-1">
                <BaseDropdown
                  v-model="form.department_id"
                  :clearable="false"
                  :loading="isOptionsLoading"
                  :options="departmentOptions"
                  filterable
                  label="Department"
                  placeholder="Select department"
                  required
                />
              </div>
              <div class="w-full min-w-0 lg:col-span-1">
                <BaseDropdown
                  v-model="form.current_position_id"
                  :clearable="false"
                  :loading="isOptionsLoading"
                  :options="positionOptions"
                  filterable
                  label="Current Position"
                  placeholder="Select position"
                  required
                />
              </div>
              <div class="w-full min-w-0 lg:col-span-1">
                <BaseDropdown
                  v-model="form.manager_id"
                  :loading="isOptionsLoading"
                  :options="managerOptions"
                  clearable
                  filterable
                  label="Manager"
                  placeholder="Select manager"
                />
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="w-full border border-slate-200 shadow-sm">
          <div class="space-y-5 p-5 lg:p-6">
            <div class="space-y-1 border-b border-slate-100 pb-4">
              <h4 class="text-base font-semibold text-slate-900">Personal Info</h4>
              <p class="text-sm text-slate-500">Keep personal contact and identity details up to date.</p>
            </div>

            <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div class="w-full min-w-0 lg:col-span-1">
                <BaseDatePicker
                  v-model="form.date_of_birth"
                  label="Date of Birth"
                  value-format="YYYY-MM-DD"
                />
              </div>
              <div class="w-full min-w-0 lg:col-span-1">
                <BaseInput v-model="form.personal_phone" label="Personal Phone" placeholder="Personal contact number" />
              </div>
              <div class="w-full min-w-0 lg:col-span-1">
                <BaseInput v-model="form.id_number" label="ID Number" placeholder="Official ID number" />
              </div>
              <div class="w-full min-w-0 lg:col-span-1">
                <BaseInput
                  v-model="form.personal_email"
                  label="Personal Email"
                  placeholder="personal@example.com"
                  type="email"
                />
              </div>
              <div class="w-full min-w-0 lg:col-span-1">
                <BaseDropdown v-model="form.gender" :options="genderOptions" label="Gender" />
              </div>
              <div class="w-full min-w-0 lg:col-span-1">
                <BaseDropdown v-model="form.id_type" :options="idTypeOptions" label="ID Type" />
              </div>
            </div>
          </div>
        </BaseCard>
      </div>
    </template>
  </div>
</template>
