<script setup lang="ts">
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import type { AuthUser } from '@/features/auth/interface/auth.interface'
import { authService } from '@/features/auth/services/authService'
import { employeeService } from '@/features/employees/services/employeeService'
import {
  getEmployeeRequestErrorMessage,
  getEmployeeSuccessMessage,
} from '@/features/employees/utils/employee'

const props = defineProps<{
  profile: AuthUser
  canEditUserAccount: boolean
  canEditEmployeeInfo: boolean
}>()

const emit = defineEmits<{
  refreshed: []
}>()

const genderOptions: BaseDropdownOption[] = [
  { label: 'Select gender', value: '' },
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
  { label: 'Other', value: 'other' },
  { label: 'Prefer Not To Say', value: 'prefer_not_to_say' },
]

const accountForm = reactive({
  name: '',
  email: '',
})

const personalForm = reactive({
  phone: '',
  personal_phone: '',
  personal_email: '',
  gender: '',
  date_of_birth: '',
})

const isSavingAccount = ref(false)
const isSavingPersonal = ref(false)

const applyProfile = () => {
  accountForm.name = props.profile.name ?? ''
  accountForm.email = props.profile.email ?? ''
  personalForm.phone = props.profile.employee?.phone ?? ''
  personalForm.personal_phone = props.profile.employee?.personal_phone ?? ''
  personalForm.personal_email = props.profile.employee?.personal_email ?? ''
  personalForm.gender = props.profile.employee?.gender ?? ''
  personalForm.date_of_birth = props.profile.employee?.date_of_birth ?? ''
}

const saveAccountInfo = async () => {
  if (!props.canEditUserAccount || !props.profile.employee) {
    return
  }

  if (!accountForm.name.trim()) {
    ElMessage.error('Name is required.')
    return
  }

  if (!accountForm.email.trim()) {
    ElMessage.error('Email is required.')
    return
  }

  isSavingAccount.value = true

  try {
    await authService.updateUser(props.profile.id, {
      name: accountForm.name.trim(),
      email: accountForm.email.trim(),
      employee_id: props.profile.employee.id,
    })
    ElMessage.success('Account info updated successfully.')
    emit('refreshed')
  } catch (error) {
    ElMessage.error(getEmployeeRequestErrorMessage(error))
  } finally {
    isSavingAccount.value = false
  }
}

const savePersonalInfo = async () => {
  if (!props.canEditEmployeeInfo || !props.profile.employee) {
    return
  }

  isSavingPersonal.value = true

  try {
    const response = await employeeService.updateEmployee(props.profile.employee.id, {
      phone: personalForm.phone.trim(),
      personal_phone: personalForm.personal_phone.trim() || null,
      personal_email: personalForm.personal_email.trim() || null,
      gender: personalForm.gender.trim() || null,
      date_of_birth: personalForm.date_of_birth.trim() || null,
    })
    ElMessage.success(getEmployeeSuccessMessage(response, 'Profile details updated successfully.'))
    emit('refreshed')
  } catch (error) {
    ElMessage.error(getEmployeeRequestErrorMessage(error))
  } finally {
    isSavingPersonal.value = false
  }
}

watch(
  () => props.profile,
  () => {
    applyProfile()
  },
  { deep: true, immediate: true },
)
</script>

<template>
  <div class="space-y-4">
    <div class="grid gap-4 xl:grid-cols-2">
      <BaseCard class="border border-slate-200 shadow-sm">
        <div class="space-y-4 p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Account Info</h3>
              <p class="text-sm text-slate-500">
                Review the main account details used to sign in.
              </p>
            </div>

            <BaseButton
              v-if="canEditUserAccount && profile.employee"
              :loading="isSavingAccount"
              @click="saveAccountInfo"
            >
              Save Account Info
            </BaseButton>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <BaseInput
              v-model="accountForm.name"
              :disabled="!canEditUserAccount || !profile.employee"
              label="Name"
              placeholder="Your full name"
              required
              size="large"
            />
            <BaseInput
              v-model="accountForm.email"
              :disabled="!canEditUserAccount || !profile.employee"
              label="Email"
              placeholder="name@example.com"
              required
              size="large"
              type="email"
            />
          </div>
        </div>
      </BaseCard>

      <BaseCard class="border border-slate-200 shadow-sm">
        <div class="space-y-4 p-5">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="text-lg font-semibold text-slate-900">Personal Details</h3>
              <p class="text-sm text-slate-500">
                Keep your contact details and personal information up to date.
              </p>
            </div>

            <BaseButton
              v-if="canEditEmployeeInfo && profile.employee"
              :loading="isSavingPersonal"
              @click="savePersonalInfo"
            >
              Save Personal Details
            </BaseButton>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
            <BaseInput
              v-model="personalForm.phone"
              :disabled="!canEditEmployeeInfo || !profile.employee"
              label="Phone"
              placeholder="Primary work phone"
              size="large"
            />
            <BaseInput
              v-model="personalForm.personal_phone"
              :disabled="!canEditEmployeeInfo || !profile.employee"
              label="Personal Phone"
              placeholder="Personal contact number"
              size="large"
            />
            <BaseInput
              v-model="personalForm.personal_email"
              :disabled="!canEditEmployeeInfo || !profile.employee"
              label="Personal Email"
              placeholder="personal@example.com"
              size="large"
              type="email"
            />
            <BaseDropdown
              v-model="personalForm.gender"
              :disabled="!canEditEmployeeInfo || !profile.employee"
              :options="genderOptions"
              label="Gender"
            />
            <BaseDatePicker
              v-model="personalForm.date_of_birth"
              :disabled="!canEditEmployeeInfo || !profile.employee"
              label="Date of Birth"
              value-format="YYYY-MM-DD"
            />
          </div>
        </div>
      </BaseCard>
    </div>
  </div>
</template>
