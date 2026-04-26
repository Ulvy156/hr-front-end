<script setup lang="ts">
import { Plus, Save, Trash2 } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseDatePicker from '@/components/ui/BaseDatePicker.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import type { EmployeePositionHistoryItem } from '../interface/employee.interface'
import { employeeService } from '../services/employeeService'
import {
  createEmptyEmployeePosition,
  getEmployeeRequestErrorMessage,
  getEmployeeSuccessMessage,
  isEmployeePositionDateRangeAvailable,
} from '../utils/employee'

const props = defineProps<{
  employeeId: number
}>()

const emit = defineEmits<{
  changed: []
}>()

type PositionEditorRow = ReturnType<typeof createEmptyEmployeePosition> & {
  id?: number
  localKey: string
}

const rows = ref<PositionEditorRow[]>([])
const positionItems = ref<Array<{ id: number; title: string }>>([])
const isLoading = ref(false)
const isOptionsLoading = ref(false)
const loadError = ref('')
const savingKeys = ref<string[]>([])
const deletingKeys = ref<string[]>([])
const pendingDeleteKey = ref<string | null>(null)

const createRowKey = () => `position-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const setLoadingKey = (keys: typeof savingKeys | typeof deletingKeys, key: string, active: boolean) => {
  const next = new Set(keys.value)

  if (active) {
    next.add(key)
  } else {
    next.delete(key)
  }

  keys.value = Array.from(next)
}

const positionOptions = computed<BaseDropdownOption[]>(() =>
  positionItems.value.map((position) => ({
    label: position.title,
    value: String(position.id),
  })),
)

const formatPickerDate = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

const pendingDeleteRow = computed(() =>
  rows.value.find((row) => row.localKey === pendingDeleteKey.value) ?? null,
)

const mapPositionToRow = (position?: EmployeePositionHistoryItem): PositionEditorRow => ({
  ...createEmptyEmployeePosition(),
  id: position?.id,
  localKey: createRowKey(),
  position_id: position?.position_id ? String(position.position_id) : '',
  base_salary: position?.base_salary ? String(position.base_salary) : '',
  start_date: position?.start_date ?? '',
  end_date: position?.end_date ?? '',
})

const loadOptions = async () => {
  isOptionsLoading.value = true

  try {
    const response = await employeeService.getPositions()
    positionItems.value = response.data
  } finally {
    isOptionsLoading.value = false
  }
}

const loadPositions = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await employeeService.getEmployeePositions(props.employeeId)
    rows.value = response.data.map((position) => mapPositionToRow(position))
  } catch (error) {
    loadError.value = getEmployeeRequestErrorMessage(error, 'Failed to load positions.')
  } finally {
    isLoading.value = false
  }
}

const addRow = () => {
  rows.value.push({
    ...createEmptyEmployeePosition(),
    localKey: createRowKey(),
  })
}

const handleStartDateChange = (index: number) => {
  const row = rows.value[index]

  if (!row) {
    return
  }

  row.end_date = ''
}

const getStartDateDisabledDate = (index: number) => (date: Date) => {
  if (index === 0) {
    return false
  }

  const row = rows.value[index]

  if (!row) {
    return false
  }

  return !isEmployeePositionDateRangeAvailable(
    rows.value,
    index,
    formatPickerDate(date),
    row.end_date,
  )
}

const getEndDateDisabledDate = (index: number) => (date: Date) => {
  const row = rows.value[index]

  if (!row?.start_date) {
    return false
  }

  return !isEmployeePositionDateRangeAvailable(
    rows.value,
    index,
    row.start_date,
    formatPickerDate(date),
  )
}

const getRowValidationMessage = (row: PositionEditorRow, rowIndex: number) => {
  if (!row.position_id.trim()) {
    return 'Position is required.'
  }

  if (!row.base_salary.trim()) {
    return 'Base salary is required.'
  }

  if (!row.start_date.trim()) {
    return 'Start date is required.'
  }

  if (row.end_date && row.end_date < row.start_date) {
    return 'End date must be the same as or after the start date.'
  }

  if (!isEmployeePositionDateRangeAvailable(rows.value, rowIndex, row.start_date, row.end_date)) {
    return 'Position periods cannot overlap.'
  }

  const openEndedCount = rows.value.filter((item) => item.start_date.trim() && !item.end_date.trim()).length

  if (!row.end_date.trim() && openEndedCount > 1) {
    return 'Only one open-ended current position is allowed.'
  }

  return ''
}

const saveRow = async (index: number) => {
  const row = rows.value[index]

  if (!row) {
    return
  }

  const validationMessage = getRowValidationMessage(row, index)

  if (validationMessage) {
    ElMessage.error(validationMessage)
    return
  }

  setLoadingKey(savingKeys, row.localKey, true)

  try {
    const payload = {
      position_id: Number(row.position_id),
      base_salary: Number(row.base_salary),
      start_date: row.start_date,
      end_date: row.end_date.trim() || null,
    }

    const response = row.id
      ? await employeeService.updateEmployeePosition(props.employeeId, row.id, payload)
      : await employeeService.createEmployeePosition(props.employeeId, payload)

    ElMessage.success(getEmployeeSuccessMessage(response, 'Position saved successfully.'))
    await loadPositions()
    emit('changed')
  } catch (error) {
    ElMessage.error(getEmployeeRequestErrorMessage(error))
  } finally {
    setLoadingKey(savingKeys, row.localKey, false)
  }
}

const requestDeleteRow = (index: number) => {
  const row = rows.value[index]

  if (!row) {
    return
  }

  if (!row.id) {
    rows.value.splice(index, 1)
    return
  }

  pendingDeleteKey.value = row.localKey
}

const closeDeleteModal = () => {
  pendingDeleteKey.value = null
}

const confirmDeleteRow = async () => {
  const row = pendingDeleteRow.value

  if (!row?.id) {
    closeDeleteModal()
    return
  }

  setLoadingKey(deletingKeys, row.localKey, true)

  try {
    const response = await employeeService.deleteEmployeePosition(props.employeeId, row.id)
    ElMessage.success(getEmployeeSuccessMessage(response, 'Position deleted successfully.'))
    await loadPositions()
    emit('changed')
    closeDeleteModal()
  } catch (error) {
    ElMessage.error(getEmployeeRequestErrorMessage(error))
  } finally {
    setLoadingKey(deletingKeys, row.localKey, false)
  }
}

onMounted(async () => {
  try {
    await Promise.all([loadOptions(), loadPositions()])
  } catch (error) {
    if (!loadError.value) {
      loadError.value = getEmployeeRequestErrorMessage(error, 'Failed to load positions.')
    }
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div>
        <h3 class="text-lg font-semibold text-slate-900">Positions</h3>
        <p class="text-sm text-slate-500">
          Manage the employee’s position history one record at a time.
        </p>
      </div>

      <BaseButton variant="secondary" @click="addRow">
        <Plus :size="16" />
        Add Position
      </BaseButton>
    </div>

    <div v-if="isLoading" class="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <BaseSpinner />
    </div>

    <BaseCard v-else-if="loadError" class="border border-red-100 shadow-sm">
      <div class="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
        <h3 class="text-lg font-semibold text-slate-900">Unable to load positions</h3>
        <p class="max-w-md text-sm text-slate-500">{{ loadError }}</p>
        <BaseButton @click="loadPositions">Try Again</BaseButton>
      </div>
    </BaseCard>

    <template v-else>
      <BaseCard v-if="!rows.length" class="border border-dashed border-slate-300 shadow-sm">
        <div class="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
          <h4 class="text-base font-semibold text-slate-900">No positions yet</h4>
          <p class="max-w-md text-sm text-slate-500">
            Add the employee’s current and previous positions here.
          </p>
        </div>
      </BaseCard>

      <div v-else class="space-y-4">
        <BaseCard
          v-for="(row, index) in rows"
          :key="row.id ?? row.localKey"
          class="border border-slate-200 shadow-sm"
        >
          <div class="space-y-4 p-5">
            <div class="flex items-center justify-between gap-4">
              <div>
                <h4 class="text-base font-semibold text-slate-900">Position {{ index + 1 }}</h4>
                <p class="text-sm text-slate-500">
                  {{ row.id ? 'Update this saved position record.' : 'Complete the fields and save this new position.' }}
                </p>
              </div>

              <div class="flex items-center gap-2">
                <BaseButton
                  :loading="savingKeys.includes(row.localKey)"
                  variant="secondary"
                  @click="saveRow(index)"
                >
                  <Save :size="16" />
                  Save
                </BaseButton>
                <BaseButton
                  :loading="deletingKeys.includes(row.localKey)"
                  variant="danger"
                  @click="requestDeleteRow(index)"
                >
                  <Trash2 :size="16" />
                  {{ row.id ? 'Delete' : 'Remove' }}
                </BaseButton>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <BaseDropdown
                v-model="row.position_id"
                :clearable="false"
                :loading="isOptionsLoading"
                :options="positionOptions"
                filterable
                label="Position"
                placeholder="Select position"
                required
              />
              <BaseInput
                v-model="row.base_salary"
                label="Base Salary"
                placeholder="Base salary"
                required
                size="large"
                type="number"
              />
              <BaseDatePicker
                v-model="row.start_date"
                :disabled-date="getStartDateDisabledDate(index)"
                label="Start Date"
                required
                value-format="YYYY-MM-DD"
                @change="handleStartDateChange(index)"
              />
              <BaseDatePicker
                v-model="row.end_date"
                :disabled-date="getEndDateDisabledDate(index)"
                label="End Date"
                value-format="YYYY-MM-DD"
              />
            </div>
          </div>
        </BaseCard>
      </div>
    </template>

    <BaseModal :open="Boolean(pendingDeleteRow)" title="Delete Position" @close="closeDeleteModal">
      <div class="space-y-2">
        <p class="text-sm text-slate-900">
          Delete this position record from the employee history?
        </p>
        <p class="text-sm text-slate-500">
          This action removes the saved job history entry permanently.
        </p>
      </div>

      <template #footer>
        <BaseButton variant="ghost" @click="closeDeleteModal">Cancel</BaseButton>
        <BaseButton
          :loading="pendingDeleteRow ? deletingKeys.includes(pendingDeleteRow.localKey) : false"
          variant="danger"
          @click="confirmDeleteRow"
        >
          Delete
        </BaseButton>
      </template>
    </BaseModal>
  </div>
</template>
