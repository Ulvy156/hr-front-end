<script setup lang="ts">
import { ArrowLeft, ImagePlus, Plus, Trash2 } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'

import { useUsers } from '@/features/users/composable/useUsers'

import EmployeeAvatar from '../components/EmployeeAvatar.vue'
import EmployeeEditTabs from '../components/EmployeeEditTabs.vue'
import { useEmployees } from '../composable/useEmployees'
import type { EmployeeCommune, EmployeeDistrict, EmployeeProvince, EmployeeVillage } from '../interface/employee.interface'
import { locationService } from '../services/locationService'
import {
  buildEmployeeUpsertPayload,
  createEmptyAddress,
  createEmptyEducation,
  createEmptyEmployeeForm,
  createEmptyEmployeePosition,
  createEmptyEmergencyContact,
  EMPLOYEE_SHOW_INCLUDES,
  getEmployeeRequestErrorMessage,
  getEmployeeSuccessMessage,
  isEmployeeEducationDateRangeAvailable,
  isEmployeePositionDateRangeAvailable,
  validateEmployeeAddresses,
  validateEmployeeEmergencyContacts,
  validateEmployeeEducationHistory,
  validateEmployeePositionHistory,
  populateEmployeeForm,
  type EmployeeFormState,
} from '../utils/employee'

const router = useRouter()
const route = useRoute()
const fileInput = ref<HTMLInputElement | null>(null)

const {
  employees,
  positions,
  selectedEmployee,
  isDetailLoading,
  isHrRole,
  isPositionsLoading,
  isPhotoUploading,
  isSaving,
  fetchEmployees,
  fetchPositions,
  fetchEmployee,
  createEmployee,
  updateEmployee,
  uploadProfilePhoto,
  clearSelectedEmployee,
} = useEmployees()
const {
  users,
  isLoading: isUsersLoading,
  fetchUsers,
} = useUsers()

const form = reactive<EmployeeFormState>(createEmptyEmployeeForm())
const selectedPhotoFile = ref<File | null>(null)
const photoPreviewUrl = ref<string | null>(null)
const provinces = ref<EmployeeProvince[]>([])
const districtsByProvince = ref<Record<string, EmployeeDistrict[]>>({})
const communesByDistrict = ref<Record<string, EmployeeCommune[]>>({})
const villagesByCommune = ref<Record<string, EmployeeVillage[]>>({})
const isLocationLoading = ref(false)

const isEditMode = computed(() => Boolean(route.params.id))
const employeeId = computed(() => Number(route.params.id))
const pageTitle = computed(() => (isEditMode.value ? 'Edit Employee' : 'Add Employee'))
const pageSubtitle = computed(() =>
  isEditMode.value
    ? 'Update employee information, work details, and related records.'
    : 'Create a new employee record with the details needed for daily work and history.',
)

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

const relationshipOptions: BaseDropdownOption[] = [
  { label: 'Select relationship', value: '' },
  { label: 'Parent', value: 'parent' },
  { label: 'Sibling', value: 'sibling' },
  { label: 'Spouse', value: 'spouse' },
  { label: 'Child', value: 'child' },
  { label: 'Relative', value: 'relative' },
  { label: 'Friend', value: 'friend' },
  { label: 'Guardian', value: 'guardian' },
  { label: 'Other', value: 'other' },
]

const addressTypeOptions: BaseDropdownOption[] = [
  { label: 'Select address type', value: '' },
  { label: 'Current', value: 'current' },
  { label: 'Permanent', value: 'permanent' },
  { label: 'Temporary', value: 'temporary' },
]

const educationLevelOptions: BaseDropdownOption[] = [
  { label: 'Select education level', value: '' },
  { label: 'Certificate', value: 'certificate' },
  { label: 'Diploma', value: 'diploma' },
  { label: 'High School', value: 'high_school' },
  { label: 'Associate', value: 'associate' },
  { label: 'Bachelor', value: 'bachelor' },
  { label: 'Master', value: 'master' },
  { label: 'Doctorate', value: 'doctorate' },
  { label: 'Other', value: 'other' },
]

const photoUrl = computed(() => {
  if (photoPreviewUrl.value) {
    return photoPreviewUrl.value
  }

  return selectedEmployee.value?.profile_photo || selectedEmployee.value?.profile_photo_path || null
})

const positionOptions = computed<BaseDropdownOption[]>(() => [
  ...positions.value.map((position) => ({
    label: position.title,
    value: String(position.id),
  })),
])

const provinceOptions = computed<BaseDropdownOption[]>(() =>
  provinces.value
    .map((province) => ({
      label: province.name_en || province.name_kh || `Province #${province.id}`,
      value: String(province.id),
    }))
    .sort((left, right) => left.label.localeCompare(right.label)),
)

const departmentOptions = computed<BaseDropdownOption[]>(() => {
  const uniqueDepartments = new Map<number, string>()

  for (const employee of employees.value?.data ?? []) {
    if (employee.department?.id && employee.department.name) {
      uniqueDepartments.set(employee.department.id, employee.department.name)
    }
  }

  if (selectedEmployee.value?.department?.id && selectedEmployee.value.department.name) {
    uniqueDepartments.set(selectedEmployee.value.department.id, selectedEmployee.value.department.name)
  }

  return Array.from(uniqueDepartments.entries())
    .sort((left, right) => left[1].localeCompare(right[1]))
    .map(([id, name]) => ({ label: name, value: String(id) }))
})

const managerOptions = computed<BaseDropdownOption[]>(() => {
  const uniqueManagers = new Map<number, string>()

  for (const employee of employees.value?.data ?? []) {
    if (employee.manager?.id && employee.manager.name) {
      uniqueManagers.set(employee.manager.id, employee.manager.name)
    }
  }

  if (selectedEmployee.value?.manager?.id && selectedEmployee.value.manager.name) {
    uniqueManagers.set(selectedEmployee.value.manager.id, selectedEmployee.value.manager.name)
  }

  return Array.from(uniqueManagers.entries())
    .sort((left, right) => left[1].localeCompare(right[1]))
    .map(([id, name]) => ({ label: name, value: String(id) }))
})

const userOptions = computed<BaseDropdownOption[]>(() => {
  return (users.value?.data ?? [])
    .map((user) => {
      const displayName = user.employee?.full_name || user.name
      const departmentName = user.employee?.department?.name || 'No Department'

      return {
        label: `${displayName} - ${departmentName}`,
        value: String(user.id),
      }
    })
    .sort((left, right) => left.label.localeCompare(right.label))
})

const getEducationLevelOptions = (index: number): BaseDropdownOption[] => {
  const selectedLevels = new Set(
    form.educations
      .map((education, educationIndex) =>
        educationIndex === index ? '' : education.education_level.trim(),
      )
      .filter(Boolean),
  )

  return educationLevelOptions.map((option) => ({
    ...option,
    disabled:
      typeof option.value === 'string' &&
      option.value !== '' &&
      selectedLevels.has(option.value),
  }))
}

const assignForm = (nextForm: EmployeeFormState) => {
  Object.assign(form, nextForm)
}

const loadEmployee = async () => {
  if (!isEditMode.value || !employeeId.value) {
    assignForm(createEmptyEmployeeForm())
    return
  }

  try {
    const employee = await fetchEmployee(employeeId.value, {
      include: [...EMPLOYEE_SHOW_INCLUDES],
    })
    assignForm(populateEmployeeForm(employee))
    await hydrateAddressLocationOptions()
  } catch {
    // The page uses toasts/store state for the visible error.
  }
}

const loadWorkSetupOptions = async () => {
  await Promise.all([
    fetchPositions(),
    fetchEmployees({
      per_page: 100,
      sort_by: 'first_name',
      sort_direction: 'asc',
    }),
  ])
}

const loadUserOptions = async () => {
  if (users.value !== null) {
    return
  }

  await fetchUsers({
    per_page: 100,
  })
}

const loadProvinces = async () => {
  isLocationLoading.value = true

  try {
    const response = await locationService.getProvinces()
    provinces.value = response.data
  } finally {
    isLocationLoading.value = false
  }
}

const goBack = () => {
  if (isEditMode.value && employeeId.value) {
    router.push({ name: 'employees-detail', params: { id: employeeId.value } })
    return
  }

  router.push({ name: 'employees' })
}

const triggerPhotoPicker = () => {
  fileInput.value?.click()
}

const handlePhotoChange = (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]

  if (!file) {
    return
  }

  selectedPhotoFile.value = file

  if (photoPreviewUrl.value) {
    URL.revokeObjectURL(photoPreviewUrl.value)
  }

  photoPreviewUrl.value = URL.createObjectURL(file)
}

const addEmergencyContact = () => {
  form.emergency_contacts.push(createEmptyEmergencyContact())
}

const removeEmergencyContact = (index: number) => {
  form.emergency_contacts.splice(index, 1)
}

const addAddress = () => {
  form.addresses.push(createEmptyAddress())
}

const removeAddress = (index: number) => {
  form.addresses.splice(index, 1)
}

const handleAddressPrimaryChange = (index: number) => {
  const address = form.addresses[index]

  if (!address?.is_primary) {
    return
  }

  form.addresses.forEach((item, itemIndex) => {
    if (itemIndex !== index) {
      item.is_primary = false
    }
  })
}

const getDistrictOptions = (index: number): BaseDropdownOption[] => {
  const provinceId = form.addresses[index]?.province_id || ''

  if (!provinceId) {
    return []
  }

  return (districtsByProvince.value[provinceId] ?? [])
    .map((district) => ({
      label: district.name_en || district.name_kh || `District #${district.id}`,
      value: String(district.id),
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

const getCommuneOptions = (index: number): BaseDropdownOption[] => {
  const districtId = form.addresses[index]?.district_id || ''

  if (!districtId) {
    return []
  }

  return (communesByDistrict.value[districtId] ?? [])
    .map((commune) => ({
      label: commune.name_en || commune.name_kh || `Commune #${commune.id}`,
      value: String(commune.id),
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

const getVillageOptions = (index: number): BaseDropdownOption[] => {
  const communeId = form.addresses[index]?.commune_id || ''

  if (!communeId) {
    return []
  }

  return (villagesByCommune.value[communeId] ?? [])
    .map((village) => ({
      label: village.name_en || village.name_kh || `Village #${village.id}`,
      value: String(village.id),
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

const loadDistricts = async (provinceId: string) => {
  if (!provinceId || districtsByProvince.value[provinceId]) {
    return
  }

  isLocationLoading.value = true

  try {
    const response = await locationService.getDistricts({ province_id: Number(provinceId) })
    districtsByProvince.value = {
      ...districtsByProvince.value,
      [provinceId]: response.data,
    }
  } finally {
    isLocationLoading.value = false
  }
}

const loadCommunes = async (districtId: string) => {
  if (!districtId || communesByDistrict.value[districtId]) {
    return
  }

  isLocationLoading.value = true

  try {
    const response = await locationService.getCommunes({ district_id: Number(districtId) })
    communesByDistrict.value = {
      ...communesByDistrict.value,
      [districtId]: response.data,
    }
  } finally {
    isLocationLoading.value = false
  }
}

const loadVillages = async (communeId: string) => {
  if (!communeId || villagesByCommune.value[communeId]) {
    return
  }

  isLocationLoading.value = true

  try {
    const response = await locationService.getVillages({ commune_id: Number(communeId) })
    villagesByCommune.value = {
      ...villagesByCommune.value,
      [communeId]: response.data,
    }
  } finally {
    isLocationLoading.value = false
  }
}

const hydrateAddressLocationOptions = async () => {
  for (const address of form.addresses) {
    if (address.province_id) {
      await loadDistricts(address.province_id)
    }

    if (address.district_id) {
      await loadCommunes(address.district_id)
    }

    if (address.commune_id) {
      await loadVillages(address.commune_id)
    }
  }
}

const handleAddressProvinceChange = async (index: number) => {
  const address = form.addresses[index]

  if (!address) {
    return
  }

  address.district_id = ''
  address.commune_id = ''
  address.village_id = ''

  if (address.province_id) {
    await loadDistricts(address.province_id)
  }
}

const handleAddressDistrictChange = async (index: number) => {
  const address = form.addresses[index]

  if (!address) {
    return
  }

  address.commune_id = ''
  address.village_id = ''

  if (address.district_id) {
    await loadCommunes(address.district_id)
  }
}

const handleAddressCommuneChange = async (index: number) => {
  const address = form.addresses[index]

  if (!address) {
    return
  }

  address.village_id = ''

  if (address.commune_id) {
    await loadVillages(address.commune_id)
  }
}

const handleEmergencyContactPrimaryChange = (index: number) => {
  const contact = form.emergency_contacts[index]

  if (!contact?.is_primary) {
    return
  }

  form.emergency_contacts.forEach((item, itemIndex) => {
    if (itemIndex !== index) {
      item.is_primary = false
    }
  })
}

const addEducation = () => {
  form.educations.push(createEmptyEducation())
}

const removeEducation = (index: number) => {
  form.educations.splice(index, 1)
}

const addEmployeePosition = () => {
  form.employee_positions.push(createEmptyEmployeePosition())
}

const removeEmployeePosition = (index: number) => {
  form.employee_positions.splice(index, 1)
}

const formatPickerDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const getPositionStartDateDisabledDate = (index: number) => (date: Date) => {
  if (index === 0) {
    return false
  }

  const position = form.employee_positions[index]

  if (!position) {
    return false
  }

  return !isEmployeePositionDateRangeAvailable(
    form.employee_positions,
    index,
    formatPickerDate(date),
    position.end_date,
  )
}

const getPositionEndDateDisabledDate = (index: number) => (date: Date) => {
  const position = form.employee_positions[index]

  if (!position?.start_date) {
    return false
  }

  return !isEmployeePositionDateRangeAvailable(
    form.employee_positions,
    index,
    position.start_date,
    formatPickerDate(date),
  )
}

const handlePositionStartDateChange = (index: number) => {
  const position = form.employee_positions[index]

  if (!position) {
    return
  }

  position.end_date = ''
}

const getEducationStartDateDisabledDate = (index: number) => (date: Date) => {
  if (index === 0) {
    return false
  }

  const education = form.educations[index]

  if (!education) {
    return false
  }

  return !isEmployeeEducationDateRangeAvailable(
    form.educations,
    index,
    formatPickerDate(date),
    education.end_date,
  )
}

const getEducationEndDateDisabledDate = (index: number) => (date: Date) => {
  const education = form.educations[index]

  if (!education?.start_date) {
    return false
  }

  return !isEmployeeEducationDateRangeAvailable(
    form.educations,
    index,
    education.start_date,
    formatPickerDate(date),
  )
}

const handleEducationStartDateChange = (index: number) => {
  const education = form.educations[index]

  if (!education) {
    return
  }

  education.end_date = ''
}

const submitForm = async () => {
  const addressValidationMessage = validateEmployeeAddresses(form.addresses)

  if (addressValidationMessage) {
    ElMessage.error(addressValidationMessage)
    return
  }

  const emergencyContactValidationMessage = validateEmployeeEmergencyContacts(
    form.emergency_contacts,
  )

  if (emergencyContactValidationMessage) {
    ElMessage.error(emergencyContactValidationMessage)
    return
  }

  const educationValidationMessage = validateEmployeeEducationHistory(form.educations)

  if (educationValidationMessage) {
    ElMessage.error(educationValidationMessage)
    return
  }

  const positionValidationMessage = validateEmployeePositionHistory(form.employee_positions)

  if (positionValidationMessage) {
    ElMessage.error(positionValidationMessage)
    return
  }

  try {
    const payload = buildEmployeeUpsertPayload(form)
    const employeeResponse = isEditMode.value && employeeId.value
      ? await updateEmployee(employeeId.value, payload)
      : await createEmployee(payload)
    const employee = employeeResponse

    if (selectedPhotoFile.value) {
      const photoResponse = await uploadProfilePhoto(employee.id, selectedPhotoFile.value)
      ElMessage.success(
        getEmployeeSuccessMessage(
          photoResponse,
          isEditMode.value
            ? 'Employee updated successfully.'
            : 'Employee created successfully.',
        ),
      )
    } else {
      ElMessage.success(
        getEmployeeSuccessMessage(
          employeeResponse,
          isEditMode.value
            ? 'Employee updated successfully.'
            : 'Employee created successfully.',
        ),
      )
    }
    await router.push({ name: 'employees-detail', params: { id: employee.id } })
  } catch (err) {
    ElMessage.error(getEmployeeRequestErrorMessage(err))
  }
}

onMounted(async () => {
  if (isEditMode.value) {
    return
  }

  try {
    await Promise.all([loadWorkSetupOptions(), loadUserOptions(), loadProvinces(), loadEmployee()])
  } catch (err) {
    if (
      !positions.value.length ||
      !departmentOptions.value.length ||
      !provinces.value.length ||
      users.value === null
    ) {
      ElMessage.error(getEmployeeRequestErrorMessage(err, 'Failed to load employee form options.'))
    }
  }
})

onBeforeUnmount(() => {
  if (photoPreviewUrl.value) {
    URL.revokeObjectURL(photoPreviewUrl.value)
  }

  clearSelectedEmployee()
})
</script>

<template>
  <main class="employee-form-page">
    <div class="employee-form-header">
      <div>
        <h1 class="employee-form-title">{{ pageTitle }}</h1>
        <p class="employee-form-subtitle">{{ pageSubtitle }}</p>
      </div>

    <div class="employee-form-header-actions">
        <BaseButton variant="ghost" @click="goBack">
          <ArrowLeft :size="16" />
          Back
        </BaseButton>
        <BaseButton
          v-if="!isEditMode"
          :disabled="!isHrRole"
          :loading="isSaving || isPhotoUploading"
          @click="submitForm"
        >
          {{ isEditMode ? 'Save Changes' : 'Create Employee' }}
        </BaseButton>
      </div>
    </div>

    <EmployeeEditTabs v-if="isEditMode" :employee-id="employeeId" />

    <div v-else-if="isDetailLoading" class="employee-form-state">
      <BaseSpinner />
    </div>

    <template v-else>
      <BaseCard class="employee-form-photo-card">
        <div class="employee-form-photo-body">
          <div class="employee-form-photo-profile">
            <EmployeeAvatar
              :name="`${form.first_name} ${form.last_name}`.trim() || 'New Employee'"
              :photo-url="photoUrl"
              size="lg"
            />
            <div>
              <h3 class="employee-form-section-title">Profile Photo</h3>
              <p class="employee-form-help">
                Upload a JPG, PNG, or WEBP image up to 2 MB.
              </p>
            </div>
          </div>

          <div class="employee-form-photo-actions">
            <BaseButton :disabled="!isHrRole" variant="ghost" @click="triggerPhotoPicker">
              <ImagePlus :size="16" />
              Choose Photo
            </BaseButton>
            <input
              ref="fileInput"
              accept=".jpg,.jpeg,.png,.webp"
              class="employee-form-hidden-input"
              type="file"
              @change="handlePhotoChange"
            />
          </div>
        </div>
      </BaseCard>

      <div class="employee-form-grid">
        <BaseCard class="employee-form-card">
          <div class="employee-form-card-body">
            <h3 class="employee-form-section-title">General Info</h3>
            <div class="employee-form-fields">
              <BaseDropdown
                v-model="form.user_id"
                :loading="isUsersLoading"
                :options="userOptions"
                filterable
                label="User"
                placeholder="Select linked user"
                required
              />
              <BaseInput v-model="form.employee_code" label="Employee Code" placeholder="Optional employee code" />
              <BaseInput v-model="form.first_name" label="First Name" placeholder="First name" required />
              <BaseInput v-model="form.last_name" label="Last Name" placeholder="Last name" required />
              <BaseInput v-model="form.email" label="Email" placeholder="name@example.com" required type="email" />
              <BaseInput v-model="form.phone" label="Phone" placeholder="Primary work phone" required />
              <BaseDropdown v-model="form.status" :options="statusOptions" :clearable="false" label="Status" required />
              <BaseDatePicker v-model="form.hire_date" label="Hire Date" required value-format="YYYY-MM-DD" />
              <BaseDropdown v-model="form.employment_type" :options="employmentTypeOptions" label="Employment Type" />
              <BaseDatePicker v-model="form.confirmation_date" label="Confirmation Date" value-format="YYYY-MM-DD" />
              <BaseDatePicker v-model="form.termination_date" label="Termination Date" value-format="YYYY-MM-DD" />
              <BaseDatePicker v-model="form.last_working_date" label="Last Working Date" value-format="YYYY-MM-DD" />
            </div>
          </div>
        </BaseCard>

        <BaseCard class="employee-form-card">
          <div class="employee-form-card-body">
            <h3 class="employee-form-section-title">Work Setup</h3>
            <p class="employee-form-help">
              Choose the department, current position, and reporting manager for this employee.
            </p>
            <div class="employee-form-fields">
              <BaseDropdown
                v-model="form.department_id"
                :clearable="false"
                :options="departmentOptions"
                filterable
                label="Department"
                placeholder="Select department"
                required
              />
              <BaseDropdown
                v-model="form.current_position_id"
                :clearable="false"
                :loading="isPositionsLoading"
                :options="positionOptions"
                label="Current Position"
                placeholder="Select position"
                required
              />
              <BaseDropdown
                v-model="form.manager_id"
                :options="managerOptions"
                clearable
                filterable
                label="Manager"
                placeholder="Select manager"
              />
            </div>
          </div>
        </BaseCard>

        <BaseCard class="employee-form-card">
          <div class="employee-form-card-body">
            <h3 class="employee-form-section-title">Personal Info</h3>
            <div class="employee-form-fields">
              <BaseDatePicker v-model="form.date_of_birth" label="Date of Birth" value-format="YYYY-MM-DD" />
              <BaseDropdown v-model="form.gender" :options="genderOptions" label="Gender" />
              <BaseInput v-model="form.personal_phone" label="Personal Phone" />
              <BaseInput v-model="form.personal_email" label="Personal Email" type="email" />
              <BaseDropdown v-model="form.id_type" :options="idTypeOptions" label="ID Type" />
              <BaseInput v-model="form.id_number" label="ID Number" />
            </div>
          </div>
        </BaseCard>
      </div>

      <BaseCard class="employee-form-card">
        <div class="employee-form-card-body">
          <div class="employee-form-section-header">
            <div>
              <h3 class="employee-form-section-title">Addresses</h3>
              <p class="employee-form-help">
                Maintain structured employee addresses using the same fields as the employee API.
              </p>
            </div>
            <BaseButton variant="secondary" @click="addAddress">
              <Plus :size="16" />
              Add Address
            </BaseButton>
          </div>

          <div v-if="form.addresses.length" class="employee-form-stack">
            <div
              v-for="(address, index) in form.addresses"
              :key="`address-${index}`"
              class="employee-form-repeatable"
            >
              <div class="employee-form-repeatable-header">
                <h4 class="employee-form-repeatable-title">Address {{ index + 1 }}</h4>
                <BaseButton variant="ghost" @click="removeAddress(index)">
                  <Trash2 :size="16" />
                  Remove
                </BaseButton>
              </div>
              <div class="employee-form-fields">
                <BaseDropdown
                  v-model="address.address_type"
                  :options="addressTypeOptions"
                  label="Address Type"
                  required
                />
                <BaseInput
                  v-model="address.address_line"
                  label="Address Line"
                  placeholder="Apartment, building, or area details"
                />
                <BaseDropdown
                  v-model="address.province_id"
                  :loading="isLocationLoading"
                  :options="provinceOptions"
                  filterable
                  label="Province"
                  placeholder="Select province"
                  required
                  @change="handleAddressProvinceChange(index)"
                />
                <BaseDropdown
                  v-model="address.district_id"
                  :disabled="!address.province_id"
                  :loading="isLocationLoading"
                  :options="getDistrictOptions(index)"
                  filterable
                  label="District"
                  placeholder="Select district"
                  required
                  @change="handleAddressDistrictChange(index)"
                />
                <BaseDropdown
                  v-model="address.commune_id"
                  :disabled="!address.district_id"
                  :loading="isLocationLoading"
                  :options="getCommuneOptions(index)"
                  filterable
                  label="Commune"
                  placeholder="Select commune"
                  required
                  @change="handleAddressCommuneChange(index)"
                />
                <BaseDropdown
                  v-model="address.village_id"
                  :disabled="!address.commune_id"
                  :loading="isLocationLoading"
                  :options="getVillageOptions(index)"
                  filterable
                  label="Village"
                  placeholder="Select village"
                  required
                />
                <BaseInput
                  v-model="address.street"
                  label="Street"
                  placeholder="Street name or number"
                />
                <BaseInput
                  v-model="address.house_no"
                  label="House No"
                  placeholder="House or unit number"
                />
                <BaseInput
                  v-model="address.postal_code"
                  label="Postal Code"
                  placeholder="Postal code"
                />
              </div>
              <BaseTextarea
                v-model="address.note"
                label="Note"
                placeholder="Extra address notes"
                :rows="3"
              />
              <label class="employee-form-checkbox">
                <input
                  v-model="address.is_primary"
                  type="checkbox"
                  @change="handleAddressPrimaryChange(index)"
                />
                <span>Primary address</span>
              </label>
            </div>
          </div>
          <p v-else class="employee-form-help">No addresses added yet.</p>
        </div>
      </BaseCard>

      <BaseCard class="employee-form-card">
        <div class="employee-form-card-body">
          <div class="employee-form-section-header">
            <div>
              <h3 class="employee-form-section-title">Emergency Contacts</h3>
              <p class="employee-form-help">Add the contacts that should be reached first.</p>
            </div>
            <BaseButton variant="secondary" @click="addEmergencyContact">
              <Plus :size="16" />
              Add Contact
            </BaseButton>
          </div>

          <div v-if="form.emergency_contacts.length" class="employee-form-stack">
            <div
              v-for="(contact, index) in form.emergency_contacts"
              :key="`contact-${index}`"
              class="employee-form-repeatable"
            >
              <div class="employee-form-repeatable-header">
                <h4 class="employee-form-repeatable-title">Contact {{ index + 1 }}</h4>
                <BaseButton variant="ghost" @click="removeEmergencyContact(index)">
                  <Trash2 :size="16" />
                  Remove
                </BaseButton>
              </div>
              <div class="employee-form-fields">
                <BaseInput v-model="contact.name" label="Name" required />
                <BaseDropdown v-model="contact.relationship" :options="relationshipOptions" label="Relationship" required />
                <BaseInput v-model="contact.phone" label="Phone" required />
                <BaseInput v-model="contact.email" label="Email" type="email" />
              </div>
              <label class="employee-form-checkbox">
                <input
                  v-model="contact.is_primary"
                  type="checkbox"
                  @change="handleEmergencyContactPrimaryChange(index)"
                />
                <span>Primary contact</span>
              </label>
            </div>
          </div>
          <p v-else class="employee-form-help">No emergency contacts added yet.</p>
        </div>
      </BaseCard>

      <BaseCard class="employee-form-card">
        <div class="employee-form-card-body">
          <div class="employee-form-section-header">
            <div>
              <h3 class="employee-form-section-title">Education</h3>
              <p class="employee-form-help">Record the employee’s education history.</p>
            </div>
            <BaseButton variant="secondary" @click="addEducation">
              <Plus :size="16" />
              Add Education
            </BaseButton>
          </div>

          <div v-if="form.educations.length" class="employee-form-stack">
            <div
              v-for="(education, index) in form.educations"
              :key="`education-${index}`"
              class="employee-form-repeatable"
            >
              <div class="employee-form-repeatable-header">
                <h4 class="employee-form-repeatable-title">Education {{ index + 1 }}</h4>
                <BaseButton variant="ghost" @click="removeEducation(index)">
                  <Trash2 :size="16" />
                  Remove
                </BaseButton>
              </div>
              <div class="employee-form-fields">
                <BaseInput
                  v-model="education.institution_name"
                  label="Institution Name"
                  placeholder="School, university, or training center name"
                  required
                />
                <BaseDropdown
                  v-model="education.education_level"
                  :options="getEducationLevelOptions(index)"
                  label="Education Level"
                  placeholder="Select education level"
                />
                <BaseInput
                  v-model="education.degree"
                  label="Degree"
                  placeholder="Formal qualification, e.g. Bachelor of Information Technology"
                />
                <BaseInput
                  v-model="education.field_of_study"
                  label="Field of Study"
                  placeholder="Major or specialization, e.g. Computer Science"
                />
                <BaseDatePicker
                  v-model="education.start_date"
                  :disabled-date="getEducationStartDateDisabledDate(index)"
                  @change="handleEducationStartDateChange(index)"
                  label="Start Date"
                  placeholder="When the program started"
                  value-format="YYYY-MM-DD"
                />
                <BaseDatePicker
                  v-model="education.end_date"
                  :disabled-date="getEducationEndDateDisabledDate(index)"
                  label="End Date"
                  placeholder="When the program ended"
                  value-format="YYYY-MM-DD"
                />
                <BaseInput
                  v-model="education.graduation_year"
                  label="Graduation Year"
                  placeholder="Year completed, e.g. 2024"
                  type="number"
                />
                <BaseInput
                  v-model="education.grade"
                  label="Grade"
                  placeholder="Final result, e.g. A or 3.45 GPA"
                />
              </div>
              <BaseTextarea
                v-model="education.description"
                label="Description"
                placeholder="Honors, thesis topic, scholarship note, or incomplete program note"
                :rows="3"
              />
            </div>
          </div>
          <p v-else class="employee-form-help">No education records added yet.</p>
        </div>
      </BaseCard>

      <BaseCard class="employee-form-card">
        <div class="employee-form-card-body">
          <div class="employee-form-section-header">
            <div>
              <h3 class="employee-form-section-title">Job History</h3>
              <p class="employee-form-help">Add current and previous employee positions.</p>
            </div>
            <BaseButton variant="secondary" @click="addEmployeePosition">
              <Plus :size="16" />
              Add Position
            </BaseButton>
          </div>

          <div v-if="form.employee_positions.length" class="employee-form-stack">
            <div
              v-for="(position, index) in form.employee_positions"
              :key="`position-${index}`"
              class="employee-form-repeatable"
            >
              <div class="employee-form-repeatable-header">
                <h4 class="employee-form-repeatable-title">Position {{ index + 1 }}</h4>
                <BaseButton variant="ghost" @click="removeEmployeePosition(index)">
                  <Trash2 :size="16" />
                  Remove
                </BaseButton>
              </div>
              <div class="employee-form-fields">
                <BaseDropdown
                  v-model="position.position_id"
                  :clearable="false"
                  :loading="isPositionsLoading"
                  :options="positionOptions"
                  label="Position"
                  placeholder="Select position"
                  required
                />
                <BaseInput v-model="position.base_salary" label="Base Salary" required type="number" />
                <BaseDatePicker
                  v-model="position.start_date"
                  :disabled-date="getPositionStartDateDisabledDate(index)"
                  @change="handlePositionStartDateChange(index)"
                  label="Start Date"
                  required
                  value-format="YYYY-MM-DD"
                />
                <BaseDatePicker
                  v-model="position.end_date"
                  :disabled-date="getPositionEndDateDisabledDate(index)"
                  label="End Date"
                  value-format="YYYY-MM-DD"
                />
              </div>
            </div>
          </div>
          <p v-else class="employee-form-help">No job history records added yet.</p>
        </div>
      </BaseCard>
    </template>
  </main>
</template>

<style scoped>
.employee-form-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.employee-form-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.employee-form-header-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.employee-form-title,
.employee-form-section-title,
.employee-form-repeatable-title {
  color: hsl(var(--foreground));
}

.employee-form-subtitle,
.employee-form-help {
  color: hsl(var(--muted-foreground));
}

.employee-form-state {
  display: flex;
  min-height: 18rem;
  align-items: center;
  justify-content: center;
}

.employee-form-photo-card,
.employee-form-card {
  overflow: hidden;
}

.employee-form-photo-body,
.employee-form-card-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
}

.employee-form-photo-body {
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
}

.employee-form-photo-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.employee-form-photo-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.employee-form-hidden-input {
  display: none;
}

.employee-form-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
}

.employee-form-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 1.25rem;
}

.employee-form-section-header,
.employee-form-repeatable-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.employee-form-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.employee-form-repeatable {
  border: 1px solid hsl(var(--border-gray));
  border-radius: var(--radius);
  background: hsl(var(--secondary) / 0.35);
  padding: 1rem;
}

.employee-form-checkbox {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  color: hsl(var(--foreground));
  font-size: var(--text-sm);
}
</style>
