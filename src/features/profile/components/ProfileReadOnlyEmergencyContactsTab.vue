<script setup lang="ts">
import BaseCard from '@/components/ui/BaseCard.vue'
import type { EmployeeEmergencyContact } from '@/features/employees/interface/employee.interface'

defineProps<{
  contacts: EmployeeEmergencyContact[]
}>()
</script>

<template>
  <BaseCard class="border border-slate-200 shadow-sm">
    <div class="space-y-4 p-5">
      <div>
        <h3 class="text-lg font-semibold text-slate-900">Emergency Contacts</h3>
        <p class="text-sm text-slate-500">
          Review the contacts linked to your employee profile.
        </p>
      </div>

      <div v-if="contacts.length" class="space-y-4">
        <div
          v-for="contact in contacts"
          :key="contact.id ?? `${contact.name}-${contact.phone}`"
          class="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div class="mb-4 flex items-center justify-between gap-3">
            <h4 class="text-base font-semibold text-slate-900">{{ contact.name }}</h4>
            <span
              v-if="contact.is_primary"
              class="inline-flex rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary"
            >
              Primary
            </span>
          </div>

          <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div class="space-y-1">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Relationship</p>
              <p class="text-sm font-medium text-slate-900">{{ contact.relationship || '--' }}</p>
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Phone</p>
              <p class="text-sm font-medium text-slate-900">{{ contact.phone || '--' }}</p>
            </div>
            <div class="space-y-1 md:col-span-2 xl:col-span-2">
              <p class="text-xs font-medium uppercase tracking-wide text-slate-500">Email</p>
              <p class="text-sm font-medium text-slate-900">{{ contact.email || '--' }}</p>
            </div>
          </div>
        </div>
      </div>

      <div v-else class="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
        <h4 class="text-base font-semibold text-slate-900">No emergency contacts available</h4>
        <p class="max-w-md text-sm text-slate-500">
          There are no emergency contact records linked to this profile yet.
        </p>
      </div>
    </div>
  </BaseCard>
</template>
