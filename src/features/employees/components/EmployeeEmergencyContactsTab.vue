<script setup lang="ts">
import { Plus, Save, Trash2 } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import type { EmployeeEmergencyContact } from '../interface/employee.interface'
import { employeeService } from '../services/employeeService'
import {
  createEmptyEmergencyContact,
  getEmployeeRequestErrorMessage,
  getEmployeeSuccessMessage,
} from '../utils/employee'

const props = defineProps<{
  employeeId: number
}>()

const emit = defineEmits<{
  changed: []
}>()

type ContactEditorRow = ReturnType<typeof createEmptyEmergencyContact> & {
  id?: number
  localKey: string
}

const rows = ref<ContactEditorRow[]>([])
const isLoading = ref(false)
const loadError = ref('')
const savingKeys = ref<string[]>([])
const deletingKeys = ref<string[]>([])
const pendingDeleteKey = ref<string | null>(null)

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

const createRowKey = () => `contact-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const mapContactToRow = (contact?: EmployeeEmergencyContact): ContactEditorRow => ({
  ...createEmptyEmergencyContact(),
  id: contact?.id,
  localKey: createRowKey(),
  name: contact?.name ?? '',
  relationship: contact?.relationship ?? '',
  phone: contact?.phone ?? '',
  email: contact?.email ?? '',
  is_primary: Boolean(contact?.is_primary),
})

const setLoadingKey = (keys: typeof savingKeys | typeof deletingKeys, key: string, active: boolean) => {
  const next = new Set(keys.value)

  if (active) {
    next.add(key)
  } else {
    next.delete(key)
  }

  keys.value = Array.from(next)
}

const normalizeNullableString = (value: string) => {
  const trimmed = value.trim()

  return trimmed ? trimmed : null
}

const pendingDeleteRow = computed(() =>
  rows.value.find((row) => row.localKey === pendingDeleteKey.value) ?? null,
)

const loadContacts = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await employeeService.getEmployeeEmergencyContacts(props.employeeId)
    rows.value = response.data.map((contact) => mapContactToRow(contact))
  } catch (error) {
    loadError.value = getEmployeeRequestErrorMessage(error, 'Failed to load emergency contacts.')
  } finally {
    isLoading.value = false
  }
}

const addRow = () => {
  rows.value.push({
    ...createEmptyEmergencyContact(),
    localKey: createRowKey(),
  })
}

const handlePrimaryChange = (targetIndex: number) => {
  const row = rows.value[targetIndex]

  if (!row?.is_primary) {
    return
  }

  rows.value.forEach((item, index) => {
    if (index !== targetIndex) {
      item.is_primary = false
    }
  })
}

const getRowValidationMessage = (row: ContactEditorRow, rowIndex: number) => {
  if (!row.name.trim()) {
    return 'Contact name is required.'
  }

  if (!row.relationship.trim()) {
    return 'Relationship is required.'
  }

  if (!row.phone.trim()) {
    return 'Phone is required.'
  }

  const duplicatePhone = rows.value.findIndex(
    (item, index) => index !== rowIndex && item.phone.trim() && item.phone.trim() === row.phone.trim(),
  )

  if (duplicatePhone !== -1) {
    return 'Emergency contact phone must be unique.'
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
      name: row.name.trim(),
      relationship: row.relationship.trim(),
      phone: row.phone.trim(),
      email: normalizeNullableString(row.email),
      is_primary: row.is_primary,
    }

    const response = row.id
      ? await employeeService.updateEmployeeEmergencyContact(props.employeeId, row.id, payload)
      : await employeeService.createEmployeeEmergencyContact(props.employeeId, payload)

    ElMessage.success(
      getEmployeeSuccessMessage(response, 'Emergency contact saved successfully.'),
    )
    await loadContacts()
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
    const response = await employeeService.deleteEmployeeEmergencyContact(props.employeeId, row.id)
    ElMessage.success(
      getEmployeeSuccessMessage(response, 'Emergency contact deleted successfully.'),
    )
    await loadContacts()
    emit('changed')
    closeDeleteModal()
  } catch (error) {
    ElMessage.error(getEmployeeRequestErrorMessage(error))
  } finally {
    setLoadingKey(deletingKeys, row.localKey, false)
  }
}

onMounted(loadContacts)
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div>
        <h3 class="text-lg font-semibold text-slate-900">Emergency Contacts</h3>
        <p class="text-sm text-slate-500">
          Add and maintain the people who should be contacted first.
        </p>
      </div>

      <BaseButton variant="secondary" @click="addRow">
        <Plus :size="16" />
        Add Contact
      </BaseButton>
    </div>

    <div v-if="isLoading" class="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <BaseSpinner />
    </div>

    <BaseCard v-else-if="loadError" class="border border-red-100 shadow-sm">
      <div class="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
        <h3 class="text-lg font-semibold text-slate-900">Unable to load contacts</h3>
        <p class="max-w-md text-sm text-slate-500">{{ loadError }}</p>
        <BaseButton @click="loadContacts">Try Again</BaseButton>
      </div>
    </BaseCard>

    <template v-else>
      <BaseCard v-if="!rows.length" class="border border-dashed border-slate-300 shadow-sm">
        <div class="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
          <h4 class="text-base font-semibold text-slate-900">No emergency contacts yet</h4>
          <p class="max-w-md text-sm text-slate-500">
            Add the people who should be contacted when urgent help is needed.
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
                <h4 class="text-base font-semibold text-slate-900">Contact {{ index + 1 }}</h4>
                <p class="text-sm text-slate-500">
                  {{ row.id ? 'Update this saved contact record.' : 'Complete the fields and save this new contact.' }}
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
              <BaseInput v-model="row.name" label="Name" placeholder="Contact name" required />
              <BaseDropdown
                v-model="row.relationship"
                :options="relationshipOptions"
                label="Relationship"
                placeholder="Select relationship"
                required
              />
              <BaseInput v-model="row.phone" label="Phone" placeholder="Contact phone" required />
              <BaseInput v-model="row.email" label="Email" placeholder="contact@example.com" type="email" />
            </div>

            <label class="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                v-model="row.is_primary"
                class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                type="checkbox"
                @change="handlePrimaryChange(index)"
              />
              <span>Primary contact</span>
            </label>
          </div>
        </BaseCard>
      </div>
    </template>

    <BaseModal
      :open="Boolean(pendingDeleteRow)"
      title="Delete Emergency Contact"
      @close="closeDeleteModal"
    >
      <div class="space-y-2">
        <p class="text-sm text-slate-900">
          Delete this emergency contact from the employee record?
        </p>
        <p class="text-sm text-slate-500">
          This action removes the saved emergency contact permanently.
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
