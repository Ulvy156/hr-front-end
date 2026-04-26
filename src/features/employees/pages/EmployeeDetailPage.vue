<script setup lang="ts">
import { ArrowLeft, Pencil, Trash2, Upload } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

import EmployeeAvatar from '../components/EmployeeAvatar.vue'
import EmployeeDeleteModal from '../components/EmployeeDeleteModal.vue'
import EmployeeStatusBadge from '../components/EmployeeStatusBadge.vue'
import { useEmployees } from '../composable/useEmployees'
import {
  EMPLOYEE_SHOW_INCLUDES,
  formatEmployeeDate,
  formatEmployeeStatus,
  getEmployeeDisplayName,
  getEmployeeRequestErrorMessage,
} from '../utils/employee'

const router = useRouter()
const route = useRoute()
const fileInput = ref<HTMLInputElement | null>(null)
const activeTab = ref('overview')
const deleteOpen = ref(false)

const {
  selectedEmployee,
  canManageEmployeeProfiles,
  canManageEmployees,
  isDeleting,
  isDetailLoading,
  isPhotoUploading,
  detailError,
  fetchEmployee,
  deactivateEmployee,
  uploadProfilePhoto,
  clearSelectedEmployee,
} = useEmployees()

const employeeId = computed(() => Number(route.params.id))

const loadEmployee = async () => {
  if (!employeeId.value) {
    return
  }

  try {
    await fetchEmployee(employeeId.value, {
      include: [...EMPLOYEE_SHOW_INCLUDES],
    })
  } catch {
    // Store state handles the visible error.
  }
}

const openDelete = () => {
  deleteOpen.value = true
}

const closeDelete = () => {
  deleteOpen.value = false
}

const confirmDelete = async () => {
  if (!selectedEmployee.value) {
    return
  }

  try {
    await deactivateEmployee(selectedEmployee.value.id)
    ElMessage.success('Employee deactivated successfully.')
    closeDelete()
    await router.push({ name: 'employees' })
  } catch (err) {
    ElMessage.error(getEmployeeRequestErrorMessage(err))
  }
}

const triggerPhotoUpload = () => {
  fileInput.value?.click()
}

const handlePhotoSelection = async (event: Event) => {
  const file = (event.target as HTMLInputElement).files?.[0]

  if (!file || !selectedEmployee.value) {
    return
  }

  try {
    const response = await uploadProfilePhoto(selectedEmployee.value.id, file)
    ElMessage.success(response.message ?? 'Profile photo uploaded successfully.')
  } catch (err) {
    ElMessage.error(getEmployeeRequestErrorMessage(err))
  } finally {
    ;(event.target as HTMLInputElement).value = ''
  }
}

const goBack = () => {
  router.push({ name: 'employees' })
}

const goToEdit = () => {
  if (!selectedEmployee.value) {
    return
  }

  router.push({ name: 'employees-edit', params: { id: selectedEmployee.value.id } })
}

onMounted(async () => {
  await loadEmployee()
})

onBeforeUnmount(() => {
  clearSelectedEmployee()
})
</script>

<template>
  <main class="employee-detail-page">
    <div class="employee-detail-header" v-if="selectedEmployee">
      <div class="employee-detail-profile">
        <EmployeeAvatar
          :name="selectedEmployee.full_name"
          :photo-url="selectedEmployee.profile_photo || null"
          size="lg"
        />

        <div class="employee-detail-profile-copy">
          <div class="employee-detail-profile-line">
            <h1 class="employee-detail-title">{{ selectedEmployee.full_name }}</h1>
            <EmployeeStatusBadge :status="selectedEmployee.status" />
          </div>
          <p class="employee-detail-code">{{ selectedEmployee.employee_code || '--' }}</p>
          <p class="employee-detail-meta">
            {{ selectedEmployee.department?.name || '--' }} •
            {{ selectedEmployee.current_position?.title || selectedEmployee.position?.title || '--' }}
          </p>
        </div>
      </div>

      <div class="employee-detail-actions">
        <BaseButton variant="ghost" @click="goBack">
          <ArrowLeft :size="16" />
          Back
        </BaseButton>
        <BaseButton v-if="canManageEmployees" :loading="isPhotoUploading" variant="ghost" @click="triggerPhotoUpload">
          <Upload :size="16" />
          Upload Photo
        </BaseButton>
        <BaseButton v-if="canManageEmployeeProfiles" variant="ghost" @click="goToEdit">
          <Pencil :size="16" />
          Edit
        </BaseButton>
        <BaseButton v-if="canManageEmployees" variant="danger" @click="openDelete">
          <Trash2 :size="16" />
          Deactivate
        </BaseButton>
        <input
          ref="fileInput"
          accept=".jpg,.jpeg,.png,.webp"
          class="employee-detail-hidden-input"
          type="file"
          @change="handlePhotoSelection"
        />
      </div>
    </div>

    <div v-if="isDetailLoading" class="employee-detail-state">
      <BaseSpinner />
    </div>

    <BaseCard v-else-if="detailError && !selectedEmployee" class="employee-detail-state-card">
      <div class="employee-detail-state">
        <h3 class="employee-detail-state-title">Failed to load employee</h3>
        <p class="employee-detail-state-text">{{ detailError }}</p>
        <BaseButton @click="loadEmployee">Try Again</BaseButton>
      </div>
    </BaseCard>

    <template v-else-if="selectedEmployee">
      <div class="employee-detail-grid">
        <BaseCard class="employee-detail-panel">
          <div class="employee-detail-panel-body">
            <h3 class="employee-detail-panel-title">General Info</h3>
            <div class="employee-detail-fields">
              <div class="employee-detail-field">
                <span class="employee-detail-label">First Name</span>
                <span class="employee-detail-value">{{ selectedEmployee.first_name }}</span>
              </div>
              <div class="employee-detail-field">
                <span class="employee-detail-label">Last Name</span>
                <span class="employee-detail-value">{{ selectedEmployee.last_name }}</span>
              </div>
              <div class="employee-detail-field">
                <span class="employee-detail-label">Gender</span>
                <span class="employee-detail-value">
                  {{ formatEmployeeStatus(selectedEmployee.gender) }}
                </span>
              </div>
              <div class="employee-detail-field">
                <span class="employee-detail-label">Date of Birth</span>
                <span class="employee-detail-value">
                  {{ formatEmployeeDate(selectedEmployee.date_of_birth) }}
                </span>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="employee-detail-panel">
          <div class="employee-detail-panel-body">
            <h3 class="employee-detail-panel-title">Contact Info</h3>
            <div class="employee-detail-fields">
              <div class="employee-detail-field">
                <span class="employee-detail-label">Email</span>
                <span class="employee-detail-value">{{ selectedEmployee.email }}</span>
              </div>
              <div class="employee-detail-field">
                <span class="employee-detail-label">Phone</span>
                <span class="employee-detail-value">{{ selectedEmployee.phone }}</span>
              </div>
              <div class="employee-detail-field">
                <span class="employee-detail-label">Personal Email</span>
                <span class="employee-detail-value">{{ selectedEmployee.personal_email || '--' }}</span>
              </div>
              <div class="employee-detail-field">
                <span class="employee-detail-label">Personal Phone</span>
                <span class="employee-detail-value">{{ selectedEmployee.personal_phone || '--' }}</span>
              </div>
            </div>
          </div>
        </BaseCard>

        <BaseCard class="employee-detail-panel">
          <div class="employee-detail-panel-body">
            <h3 class="employee-detail-panel-title">Employment Info</h3>
            <div class="employee-detail-fields">
              <div class="employee-detail-field">
                <span class="employee-detail-label">Department</span>
                <span class="employee-detail-value">{{ selectedEmployee.department?.name || '--' }}</span>
              </div>
              <div class="employee-detail-field">
                <span class="employee-detail-label">Position</span>
                <span class="employee-detail-value">
                  {{ selectedEmployee.current_position?.title || selectedEmployee.position?.title || '--' }}
                </span>
              </div>
              <div class="employee-detail-field">
                <span class="employee-detail-label">Employment Type</span>
                <span class="employee-detail-value">
                  {{ formatEmployeeStatus(selectedEmployee.employment_type) }}
                </span>
              </div>
              <div class="employee-detail-field">
                <span class="employee-detail-label">Hire Date</span>
                <span class="employee-detail-value">
                  {{ formatEmployeeDate(selectedEmployee.hire_date) }}
                </span>
              </div>
            </div>
          </div>
        </BaseCard>

        <div class="employee-detail-tabs-shell">
          <ElTabs v-model="activeTab" class="employee-detail-tabs">
            <ElTabPane label="Overview" name="overview">
              <div class="employee-detail-overview-grid">
                <BaseCard class="employee-detail-panel">
                  <div class="employee-detail-panel-body">
                    <h3 class="employee-detail-panel-title">Identity</h3>
                    <div class="employee-detail-fields">
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">ID Type</span>
                        <span class="employee-detail-value">
                          {{ formatEmployeeStatus(selectedEmployee.id_type) }}
                        </span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">ID Number</span>
                        <span class="employee-detail-value">{{ selectedEmployee.id_number || '--' }}</span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Employee Code</span>
                        <span class="employee-detail-value">{{ selectedEmployee.employee_code || '--' }}</span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">User ID</span>
                        <span class="employee-detail-value">{{ selectedEmployee.user_id || '--' }}</span>
                      </div>
                    </div>
                  </div>
                </BaseCard>

                <BaseCard class="employee-detail-panel">
                  <div class="employee-detail-panel-body">
                    <h3 class="employee-detail-panel-title">Addresses</h3>
                    <div class="employee-detail-fields single-column">
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Current Address</span>
                        <span class="employee-detail-value">{{ selectedEmployee.current_address || '--' }}</span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Permanent Address</span>
                        <span class="employee-detail-value">{{ selectedEmployee.permanent_address || '--' }}</span>
                      </div>
                    </div>
                  </div>
                </BaseCard>

                <BaseCard class="employee-detail-panel">
                  <div class="employee-detail-panel-body">
                    <h3 class="employee-detail-panel-title">Employment Dates</h3>
                    <div class="employee-detail-fields">
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Confirmation Date</span>
                        <span class="employee-detail-value">
                          {{ formatEmployeeDate(selectedEmployee.confirmation_date) }}
                        </span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Termination Date</span>
                        <span class="employee-detail-value">
                          {{ formatEmployeeDate(selectedEmployee.termination_date) }}
                        </span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Last Working Date</span>
                        <span class="employee-detail-value">
                          {{ formatEmployeeDate(selectedEmployee.last_working_date) }}
                        </span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Manager</span>
                        <span class="employee-detail-value">{{ getEmployeeDisplayName(selectedEmployee.manager) }}</span>
                      </div>
                    </div>
                  </div>
                </BaseCard>
              </div>
            </ElTabPane>

            <ElTabPane label="Job History" name="job-history">
              <div v-if="selectedEmployee.employee_positions?.length" class="employee-detail-list">
                <BaseCard
                  v-for="position in selectedEmployee.employee_positions"
                  :key="`${position.id ?? position.position_id}-${position.start_date}`"
                  class="employee-detail-panel"
                >
                  <div class="employee-detail-panel-body">
                    <div class="employee-detail-panel-head">
                      <h3 class="employee-detail-panel-title">Job History</h3>
                      <EmployeeStatusBadge :status="position.is_current ? 'active' : 'inactive'" />
                    </div>

                    <div class="employee-detail-fields">
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Position</span>
                        <span class="employee-detail-value">
                          {{ position.position?.title || `Position #${position.position_id}` }}
                        </span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Position ID</span>
                        <span class="employee-detail-value">{{ position.position_id }}</span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Date Range</span>
                        <span class="employee-detail-value">
                          {{ formatEmployeeDate(position.start_date) }} to
                          {{ position.end_date ? formatEmployeeDate(position.end_date) : 'Present' }}
                        </span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Base Salary</span>
                        <span class="employee-detail-value">{{ position.base_salary }}</span>
                      </div>
                    </div>
                  </div>
                </BaseCard>
              </div>
              <div v-else class="employee-detail-tab-empty">No job history available.</div>
            </ElTabPane>

            <ElTabPane label="Education" name="education">
              <div v-if="selectedEmployee.educations?.length" class="employee-detail-list">
                <BaseCard
                  v-for="education in selectedEmployee.educations"
                  :key="`${education.id ?? education.institution_name}-${education.graduation_year ?? education.start_date}`"
                  class="employee-detail-panel"
                >
                  <div class="employee-detail-panel-body">
                    <h3 class="employee-detail-panel-title">Education</h3>
                    <div class="employee-detail-fields">
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Institution Name</span>
                        <span class="employee-detail-value">{{ education.institution_name }}</span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Education Level</span>
                        <span class="employee-detail-value">{{ education.education_level || '--' }}</span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Degree</span>
                        <span class="employee-detail-value">{{ education.degree || '--' }}</span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Field of Study</span>
                        <span class="employee-detail-value">{{ education.field_of_study || '--' }}</span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Graduation Year</span>
                        <span class="employee-detail-value">{{ education.graduation_year || '--' }}</span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Grade</span>
                        <span class="employee-detail-value">{{ education.grade || '--' }}</span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Dates</span>
                        <span class="employee-detail-value">
                          {{ formatEmployeeDate(education.start_date) }} to
                          {{ education.end_date ? formatEmployeeDate(education.end_date) : 'Present' }}
                        </span>
                      </div>
                      <div class="employee-detail-field employee-detail-field-span">
                        <span class="employee-detail-label">Description</span>
                        <span class="employee-detail-value">{{ education.description || '--' }}</span>
                      </div>
                    </div>
                  </div>
                </BaseCard>
              </div>
              <div v-else class="employee-detail-tab-empty">No education records available.</div>
            </ElTabPane>

            <ElTabPane label="Emergency Contacts" name="emergency-contacts">
              <div v-if="selectedEmployee.emergency_contacts?.length" class="employee-detail-list">
                <BaseCard
                  v-for="contact in selectedEmployee.emergency_contacts"
                  :key="`${contact.id ?? contact.name}-${contact.phone}`"
                  class="employee-detail-panel"
                >
                  <div class="employee-detail-panel-body">
                    <div class="employee-detail-panel-head">
                      <h3 class="employee-detail-panel-title">Emergency Contact</h3>
                      <EmployeeStatusBadge v-if="contact.is_primary" status="primary" />
                    </div>

                    <div class="employee-detail-fields">
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Name</span>
                        <span class="employee-detail-value">{{ contact.name }}</span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Relationship</span>
                        <span class="employee-detail-value">{{ contact.relationship || '--' }}</span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Phone</span>
                        <span class="employee-detail-value">{{ contact.phone }}</span>
                      </div>
                      <div class="employee-detail-field">
                        <span class="employee-detail-label">Email</span>
                        <span class="employee-detail-value">{{ contact.email || '--' }}</span>
                      </div>
                    </div>
                  </div>
                </BaseCard>
              </div>
              <div v-else class="employee-detail-tab-empty">No emergency contacts available.</div>
            </ElTabPane>
          </ElTabs>
        </div>
      </div>
    </template>

    <EmployeeDeleteModal
      :employee-name="selectedEmployee?.full_name"
      :loading="isDeleting"
      :open="deleteOpen"
      @close="closeDelete"
      @confirm="confirmDelete"
    />
  </main>
</template>

<style scoped>
.employee-detail-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.employee-detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
}

.employee-detail-profile {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.employee-detail-profile-copy {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.employee-detail-profile-line {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.employee-detail-title,
.employee-detail-panel-title,
.employee-detail-state-title,
.employee-detail-list-title {
  color: hsl(var(--foreground));
}

.employee-detail-code,
.employee-detail-meta,
.employee-detail-label,
.employee-detail-state-text,
.employee-detail-list-copy,
.employee-detail-tab-empty {
  color: hsl(var(--muted-foreground));
}

.employee-detail-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.employee-detail-hidden-input {
  display: none;
}

.employee-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1.5rem;
}

.employee-detail-panel,
.employee-detail-tab-card {
  overflow: hidden;
}

.employee-detail-panel-body {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.25rem;
}

.employee-detail-fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem 1.25rem;
}

.employee-detail-fields.single-column {
  grid-template-columns: 1fr;
}

.employee-detail-field {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  min-width: 0;
}

.employee-detail-field-span {
  grid-column: 1 / -1;
}

.employee-detail-label {
  font-size: var(--text-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.employee-detail-value {
  color: hsl(var(--foreground));
  font-size: var(--text-sm);
  font-weight: 500;
  overflow-wrap: anywhere;
}

.employee-detail-panel-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

.employee-detail-tabs-shell {
  grid-column: 1 / -1;
}

.employee-detail-overview-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  padding-top: 0.5rem;
}

.employee-detail-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding-top: 0.5rem;
}

.employee-detail-state,
.employee-detail-tab-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 18rem;
  text-align: center;
}

.employee-detail-state-card {
  min-height: 20rem;
}

.employee-detail-tabs:deep(.el-tabs__header) {
  margin-bottom: 1rem;
}

.employee-detail-tabs:deep(.el-tabs__nav-wrap::after) {
  background: hsl(var(--border-gray));
}

.employee-detail-tabs:deep(.el-tabs__item.is-active) {
  color: hsl(var(--foreground));
}

.employee-detail-tabs:deep(.el-tabs__active-bar) {
  background: hsl(var(--primary));
}
</style>
