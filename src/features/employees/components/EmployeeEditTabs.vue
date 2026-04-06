<script setup lang="ts">
import { ImagePlus } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

import EmployeeAvatar from './EmployeeAvatar.vue'
import EmployeeBasicInfoTab from './EmployeeBasicInfoTab.vue'
import EmployeeAddressesTab from './EmployeeAddressesTab.vue'
import EmployeeEmergencyContactsTab from './EmployeeEmergencyContactsTab.vue'
import EmployeePositionsTab from './EmployeePositionsTab.vue'
import EmployeeStatusBadge from './EmployeeStatusBadge.vue'
import type { EmployeeDetail } from '../interface/employee.interface'
import { employeeService } from '../services/employeeService'
import {
  getEmployeeRequestErrorMessage,
  getEmployeeSuccessMessage,
} from '../utils/employee'

const props = defineProps<{
  employeeId: number
}>()

const activeTab = ref('basic-info')
const employee = ref<EmployeeDetail | null>(null)
const isLoading = ref(false)
const loadError = ref('')
const isPhotoUploading = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const loadEmployeeSummary = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    employee.value = await employeeService.getEmployee(props.employeeId, { include: ['user'] })
  } catch (error) {
    loadError.value = getEmployeeRequestErrorMessage(error, 'Failed to load employee details.')
  } finally {
    isLoading.value = false
  }
}

const handleEmployeeUpdated = async (updatedEmployee?: EmployeeDetail) => {
  if (updatedEmployee) {
    employee.value = updatedEmployee
  }
}

const triggerPhotoPicker = () => {
  fileInput.value?.click()
}

const handlePhotoSelection = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]

  if (!file) {
    return
  }

  isPhotoUploading.value = true

  try {
    const response = await employeeService.uploadProfilePhoto(props.employeeId, file)
    employee.value = response.employee
    ElMessage.success(getEmployeeSuccessMessage(response, 'Profile photo uploaded successfully.'))
  } catch (error) {
    ElMessage.error(getEmployeeRequestErrorMessage(error))
  } finally {
    isPhotoUploading.value = false
    ;(event.target as HTMLInputElement).value = ''
  }
}

onMounted(loadEmployeeSummary)

watch(
  () => props.employeeId,
  async () => {
    await loadEmployeeSummary()
  },
)
</script>

<template>
  <div class="space-y-5">
    <div v-if="isLoading" class="flex min-h-80 items-center justify-center rounded-3xl border border-slate-200 bg-white">
      <BaseSpinner />
    </div>

    <BaseCard v-else-if="loadError" class="border border-red-100 shadow-sm">
      <div class="flex min-h-72 flex-col items-center justify-center gap-3 p-8 text-center">
        <h3 class="text-lg font-semibold text-slate-900">Unable to load employee</h3>
        <p class="max-w-md text-sm text-slate-500">{{ loadError }}</p>
        <BaseButton @click="loadEmployeeSummary">Try Again</BaseButton>
      </div>
    </BaseCard>

    <template v-else-if="employee">
      <BaseCard class="border border-slate-200 shadow-sm">
        <div class="flex flex-wrap items-center justify-between gap-4 p-6">
          <div class="flex min-w-0 items-center gap-4">
            <EmployeeAvatar
              :name="employee.full_name"
              :photo-url="employee.profile_photo || employee.profile_photo_path"
              size="lg"
            />

            <div class="min-w-0 space-y-1">
              <div class="flex flex-wrap items-center gap-3">
                <h2 class="text-2xl font-semibold text-slate-900">{{ employee.full_name }}</h2>
                <EmployeeStatusBadge :status="employee.status" />
              </div>
              <p class="text-sm font-medium text-slate-600">{{ employee.employee_code || '--' }}</p>
              <p class="text-sm text-slate-500">
                {{ employee.department?.name || '--' }} •
                {{ employee.current_position?.title || employee.position?.title || '--' }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <BaseButton :loading="isPhotoUploading" variant="ghost" @click="triggerPhotoPicker">
              <ImagePlus :size="16" />
              Upload Photo
            </BaseButton>
            <input
              ref="fileInput"
              accept=".jpg,.jpeg,.png,.webp"
              class="hidden"
              type="file"
              @change="handlePhotoSelection"
            />
          </div>
        </div>
      </BaseCard>

      <BaseCard class="border border-slate-200 shadow-sm">
        <div class="p-5">
          <ElTabs v-model="activeTab" class="employee-edit-tabs">
            <ElTabPane label="Basic Info" lazy name="basic-info">
              <EmployeeBasicInfoTab
                :employee-id="employeeId"
                @updated="handleEmployeeUpdated"
              />
            </ElTabPane>

            <ElTabPane label="Addresses" lazy name="addresses">
              <EmployeeAddressesTab :employee-id="employeeId" />
            </ElTabPane>

            <ElTabPane label="Emergency Contacts" lazy name="emergency-contacts">
              <EmployeeEmergencyContactsTab :employee-id="employeeId" />
            </ElTabPane>

            <ElTabPane label="Positions" lazy name="positions">
              <EmployeePositionsTab :employee-id="employeeId" />
            </ElTabPane>
          </ElTabs>
        </div>
      </BaseCard>
    </template>
  </div>
</template>

<style scoped>
.employee-edit-tabs:deep(.el-tabs__header) {
  margin-bottom: 1rem;
}

.employee-edit-tabs:deep(.el-tabs__nav-wrap::after) {
  background-color: hsl(var(--border-gray));
}

.employee-edit-tabs:deep(.el-tabs__item) {
  padding-inline: 0;
  margin-right: 1.5rem;
  color: hsl(var(--muted-foreground));
  font-weight: 500;
}

.employee-edit-tabs:deep(.el-tabs__item.is-active) {
  color: hsl(var(--primary));
  font-weight: 600;
}

.employee-edit-tabs:deep(.el-tabs__active-bar) {
  background-color: hsl(var(--primary));
  height: 2px;
}

.employee-edit-tabs:deep(.el-tabs__content) {
  overflow: visible;
}
</style>
