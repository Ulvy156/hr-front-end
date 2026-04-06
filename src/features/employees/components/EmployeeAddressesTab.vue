<script setup lang="ts">
import { Plus, Save, Trash2 } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseCard from '@/components/ui/BaseCard.vue'
import BaseDropdown, { type BaseDropdownOption } from '@/components/ui/BaseDropdown.vue'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'
import BaseTextarea from '@/components/ui/BaseTextarea.vue'
import type {
  EmployeeAddress,
  EmployeeCommune,
  EmployeeDistrict,
  EmployeeProvince,
  EmployeeVillage,
} from '../interface/employee.interface'
import { employeeService } from '../services/employeeService'
import { locationService } from '../services/locationService'
import {
  createEmptyAddress,
  getEmployeeRequestErrorMessage,
  getEmployeeSuccessMessage,
} from '../utils/employee'

const props = defineProps<{
  employeeId: number
}>()

const emit = defineEmits<{
  changed: []
}>()

type AddressEditorRow = ReturnType<typeof createEmptyAddress> & {
  id?: number
  localKey: string
}

const rows = ref<AddressEditorRow[]>([])
const provinces = ref<EmployeeProvince[]>([])
const districtsByProvince = ref<Record<string, EmployeeDistrict[]>>({})
const communesByDistrict = ref<Record<string, EmployeeCommune[]>>({})
const villagesByCommune = ref<Record<string, EmployeeVillage[]>>({})
const isLoading = ref(false)
const isLocationLoading = ref(false)
const loadError = ref('')
const savingKeys = ref<string[]>([])
const deletingKeys = ref<string[]>([])
const pendingDeleteKey = ref<string | null>(null)

const addressTypeOptions: BaseDropdownOption[] = [
  { label: 'Select address type', value: '' },
  { label: 'Current', value: 'current' },
  { label: 'Permanent', value: 'permanent' },
  { label: 'Temporary', value: 'temporary' },
]

const provinceOptions = computed<BaseDropdownOption[]>(() =>
  provinces.value
    .map((province) => ({
      label: province.name_en || province.name_kh || `Province #${province.id}`,
      value: String(province.id),
    }))
    .sort((left, right) => left.label.localeCompare(right.label)),
)

const createRowKey = () => `address-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

const mapAddressToRow = (address?: EmployeeAddress): AddressEditorRow => ({
  ...createEmptyAddress(),
  id: address?.id,
  localKey: createRowKey(),
  address_type: address?.address_type ?? '',
  province_id: address?.province_id ? String(address.province_id) : '',
  district_id: address?.district_id ? String(address.district_id) : '',
  commune_id: address?.commune_id ? String(address.commune_id) : '',
  village_id: address?.village_id ? String(address.village_id) : '',
  address_line: address?.address_line ?? '',
  street: address?.street ?? '',
  house_no: address?.house_no ?? '',
  postal_code: address?.postal_code ?? '',
  note: address?.note ?? '',
  is_primary: Boolean(address?.is_primary),
})

const normalizeNullableString = (value: string) => {
  const trimmed = value.trim()

  return trimmed ? trimmed : null
}

const pendingDeleteRow = computed(() =>
  rows.value.find((row) => row.localKey === pendingDeleteKey.value) ?? null,
)

const setLoadingKey = (keys: typeof savingKeys | typeof deletingKeys, key: string, active: boolean) => {
  const next = new Set(keys.value)

  if (active) {
    next.add(key)
  } else {
    next.delete(key)
  }

  keys.value = Array.from(next)
}

const loadProvinces = async () => {
  if (provinces.value.length) {
    return
  }

  isLocationLoading.value = true

  try {
    const response = await locationService.getProvinces()
    provinces.value = response.data
  } finally {
    isLocationLoading.value = false
  }
}

const loadDistricts = async (provinceId: string) => {
  if (!provinceId || districtsByProvince.value[provinceId]) {
    return
  }

  isLocationLoading.value = true

  try {
    const response = await locationService.getDistricts({ province_id: Number(provinceId) })
    districtsByProvince.value = { ...districtsByProvince.value, [provinceId]: response.data }
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
    communesByDistrict.value = { ...communesByDistrict.value, [districtId]: response.data }
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
    villagesByCommune.value = { ...villagesByCommune.value, [communeId]: response.data }
  } finally {
    isLocationLoading.value = false
  }
}

const hydrateLocationOptions = async () => {
  for (const row of rows.value) {
    if (row.province_id) {
      await loadDistricts(row.province_id)
    }

    if (row.district_id) {
      await loadCommunes(row.district_id)
    }

    if (row.commune_id) {
      await loadVillages(row.commune_id)
    }
  }
}

const loadAddresses = async () => {
  isLoading.value = true
  loadError.value = ''

  try {
    const response = await employeeService.getEmployeeAddresses(props.employeeId)
    rows.value = response.data.map((address) => mapAddressToRow(address))
    await hydrateLocationOptions()
  } catch (error) {
    loadError.value = getEmployeeRequestErrorMessage(error, 'Failed to load addresses.')
  } finally {
    isLoading.value = false
  }
}

const getDistrictOptions = (row: AddressEditorRow): BaseDropdownOption[] => {
  if (!row.province_id) {
    return []
  }

  return (districtsByProvince.value[row.province_id] ?? [])
    .map((district) => ({
      label: district.name_en || district.name_kh || `District #${district.id}`,
      value: String(district.id),
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

const getCommuneOptions = (row: AddressEditorRow): BaseDropdownOption[] => {
  if (!row.district_id) {
    return []
  }

  return (communesByDistrict.value[row.district_id] ?? [])
    .map((commune) => ({
      label: commune.name_en || commune.name_kh || `Commune #${commune.id}`,
      value: String(commune.id),
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

const getVillageOptions = (row: AddressEditorRow): BaseDropdownOption[] => {
  if (!row.commune_id) {
    return []
  }

  return (villagesByCommune.value[row.commune_id] ?? [])
    .map((village) => ({
      label: village.name_en || village.name_kh || `Village #${village.id}`,
      value: String(village.id),
    }))
    .sort((left, right) => left.label.localeCompare(right.label))
}

const addRow = () => {
  rows.value.push({
    ...createEmptyAddress(),
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

const handleProvinceChange = async (index: number) => {
  const row = rows.value[index]

  if (!row) {
    return
  }

  row.district_id = ''
  row.commune_id = ''
  row.village_id = ''

  if (row.province_id) {
    await loadDistricts(row.province_id)
  }
}

const handleDistrictChange = async (index: number) => {
  const row = rows.value[index]

  if (!row) {
    return
  }

  row.commune_id = ''
  row.village_id = ''

  if (row.district_id) {
    await loadCommunes(row.district_id)
  }
}

const handleCommuneChange = async (index: number) => {
  const row = rows.value[index]

  if (!row) {
    return
  }

  row.village_id = ''

  if (row.commune_id) {
    await loadVillages(row.commune_id)
  }
}

const getRowValidationMessage = (row: AddressEditorRow) => {
  if (!row.address_type.trim()) {
    return 'Address type is required.'
  }

  if (!row.province_id.trim()) {
    return 'Province is required.'
  }

  if (!row.district_id.trim()) {
    return 'District is required.'
  }

  if (!row.commune_id.trim()) {
    return 'Commune is required.'
  }

  if (!row.village_id.trim()) {
    return 'Village is required.'
  }

  return ''
}

const buildPayload = (row: AddressEditorRow) => ({
  address_type: row.address_type.trim(),
  province_id: Number(row.province_id),
  district_id: Number(row.district_id),
  commune_id: Number(row.commune_id),
  village_id: Number(row.village_id),
  address_line: normalizeNullableString(row.address_line),
  street: normalizeNullableString(row.street),
  house_no: normalizeNullableString(row.house_no),
  postal_code: normalizeNullableString(row.postal_code),
  note: normalizeNullableString(row.note),
  is_primary: row.is_primary,
})

const saveRow = async (index: number) => {
  const row = rows.value[index]

  if (!row) {
    return
  }

  const validationMessage = getRowValidationMessage(row)

  if (validationMessage) {
    ElMessage.error(validationMessage)
    return
  }

  setLoadingKey(savingKeys, row.localKey, true)

  try {
    const response = row.id
      ? await employeeService.updateEmployeeAddress(props.employeeId, row.id, buildPayload(row))
      : await employeeService.createEmployeeAddress(props.employeeId, buildPayload(row))

    ElMessage.success(getEmployeeSuccessMessage(response, 'Address saved successfully.'))
    await loadAddresses()
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
    const response = await employeeService.deleteEmployeeAddress(props.employeeId, row.id)
    ElMessage.success(getEmployeeSuccessMessage(response, 'Address deleted successfully.'))
    await loadAddresses()
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
    await Promise.all([loadProvinces(), loadAddresses()])
  } catch (error) {
    if (!loadError.value) {
      loadError.value = getEmployeeRequestErrorMessage(error, 'Failed to load addresses.')
    }
  }
})
</script>

<template>
  <div class="space-y-4">
    <div class="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
      <div>
        <h3 class="text-lg font-semibold text-slate-900">Addresses</h3>
        <p class="text-sm text-slate-500">
          Maintain employee addresses one record at a time using the structured location fields.
        </p>
      </div>

      <BaseButton variant="secondary" @click="addRow">
        <Plus :size="16" />
        Add Address
      </BaseButton>
    </div>

    <div v-if="isLoading" class="flex min-h-72 items-center justify-center rounded-2xl border border-slate-200 bg-white">
      <BaseSpinner />
    </div>

    <BaseCard v-else-if="loadError" class="border border-red-100 shadow-sm">
      <div class="flex min-h-64 flex-col items-center justify-center gap-3 p-8 text-center">
        <h3 class="text-lg font-semibold text-slate-900">Unable to load addresses</h3>
        <p class="max-w-md text-sm text-slate-500">{{ loadError }}</p>
        <BaseButton @click="loadAddresses">Try Again</BaseButton>
      </div>
    </BaseCard>

    <template v-else>
      <BaseCard v-if="!rows.length" class="border border-dashed border-slate-300 shadow-sm">
        <div class="flex min-h-56 flex-col items-center justify-center gap-3 p-8 text-center">
          <h4 class="text-base font-semibold text-slate-900">No addresses yet</h4>
          <p class="max-w-md text-sm text-slate-500">
            Add the employee’s current, permanent, or temporary address here.
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
                <h4 class="text-base font-semibold text-slate-900">Address {{ index + 1 }}</h4>
                <p class="text-sm text-slate-500">
                  {{ row.id ? 'Update this saved address record.' : 'Complete the fields and save this new address.' }}
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

            <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              <BaseDropdown
                v-model="row.address_type"
                :options="addressTypeOptions"
                label="Address Type"
                required
              />
              <BaseInput
                v-model="row.address_line"
                label="Address Line"
                placeholder="Apartment, building, or area details"
              />
              <BaseDropdown
                v-model="row.province_id"
                :loading="isLocationLoading"
                :options="provinceOptions"
                filterable
                label="Province"
                placeholder="Select province"
                required
                @change="handleProvinceChange(index)"
              />
              <BaseDropdown
                v-model="row.district_id"
                :disabled="!row.province_id"
                :loading="isLocationLoading"
                :options="getDistrictOptions(row)"
                filterable
                label="District"
                placeholder="Select district"
                required
                @change="handleDistrictChange(index)"
              />
              <BaseDropdown
                v-model="row.commune_id"
                :disabled="!row.district_id"
                :loading="isLocationLoading"
                :options="getCommuneOptions(row)"
                filterable
                label="Commune"
                placeholder="Select commune"
                required
                @change="handleCommuneChange(index)"
              />
              <BaseDropdown
                v-model="row.village_id"
                :disabled="!row.commune_id"
                :loading="isLocationLoading"
                :options="getVillageOptions(row)"
                filterable
                label="Village"
                placeholder="Select village"
                required
              />
              <BaseInput v-model="row.street" label="Street" placeholder="Street name or number" />
              <BaseInput v-model="row.house_no" label="House No" placeholder="House or unit number" />
              <BaseInput v-model="row.postal_code" label="Postal Code" placeholder="Postal code" />
            </div>

            <BaseTextarea
              v-model="row.note"
              :rows="3"
              label="Note"
              placeholder="Extra address notes"
            />

            <label class="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
              <input
                v-model="row.is_primary"
                class="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                type="checkbox"
                @change="handlePrimaryChange(index)"
              />
              <span>Primary address</span>
            </label>
          </div>
        </BaseCard>
      </div>
    </template>

    <BaseModal :open="Boolean(pendingDeleteRow)" title="Delete Address" @close="closeDeleteModal">
      <div class="space-y-2">
        <p class="text-sm text-slate-900">
          Delete this address from the employee record?
        </p>
        <p class="text-sm text-slate-500">
          This action removes the saved address entry permanently.
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
