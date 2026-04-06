<script setup lang="ts">
import { FileSearch } from 'lucide-vue-next'

import BaseButton from '@/components/ui/BaseButton.vue'
import BaseModal from '@/components/ui/BaseModal.vue'
import BaseSpinner from '@/components/ui/BaseSpinner.vue'

import type { AuditLog, AuditStructuredValue } from '../interface/audit.interface'
import AuditLogEventBadge from './AuditLogEventBadge.vue'

type DetailEntry = {
  label: string
  value: string
  tone?: 'default' | 'strong' | 'muted' | 'mono'
  span?: 'default' | 'full'
}

const props = defineProps<{
  open: boolean
  log: AuditLog | null
  loading?: boolean
  error?: string
}>()

const emit = defineEmits<{
  close: []
  retry: []
}>()

const hasCauser = computed(() => Boolean(props.log?.causer))
const hasSubject = computed(() => Boolean(props.log?.subject))

const generalInfoEntries = computed<DetailEntry[]>(() => [
  { label: 'ID', value: formatDisplayValue(props.log?.id), tone: 'mono' },
  { label: 'Log Name', value: formatDisplayValue(props.log?.logName), tone: 'strong' },
  { label: 'Event', value: formatDisplayValue(props.log?.event), tone: 'strong' },
  { label: 'Description', value: formatDisplayValue(props.log?.description), span: 'full' },
  {
    label: 'Batch UUID',
    value: formatDisplayValue(props.log?.batchUuid),
    tone: 'mono',
    span: 'full',
  },
  { label: 'Created At', value: formatDateTime(props.log?.createdAt) },
])

const causerEntries = computed<DetailEntry[]>(() => {
  if (!props.log?.causer) {
    return []
  }

  return [
    { label: 'Type', value: formatDisplayValue(props.log.causer.type), tone: 'mono', span: 'full' },
    { label: 'ID', value: formatDisplayValue(props.log.causer.id), tone: 'mono' },
    { label: 'Name', value: formatDisplayValue(props.log.causer.name), tone: 'strong' },
    {
      label: 'Email',
      value: formatDisplayValue(props.log.causer.email),
      tone: 'muted',
      span: 'full',
    },
  ]
})

const subjectEntries = computed<DetailEntry[]>(() => {
  if (!props.log?.subject) {
    return []
  }

  return [
    { label: 'Type', value: formatDisplayValue(props.log.subject.type), tone: 'mono', span: 'full' },
    { label: 'ID', value: formatDisplayValue(props.log.subject.id), tone: 'mono' },
    {
      label: 'Label',
      value: formatDisplayValue(props.log.subject.label),
      tone: 'strong',
      span: 'full',
    },
  ]
})

const attributesEntries = computed(() => toObjectEntries(props.log?.changes?.attributes))
const oldEntries = computed(() => toObjectEntries(props.log?.changes?.old))
const metadataEntries = computed(() => toObjectEntries(props.log?.metadata))

const hasAnyChanges = computed(() => {
  return (
    attributesEntries.value.length > 0 ||
    oldEntries.value.length > 0 ||
    showAttributesJsonFallback.value ||
    showOldJsonFallback.value
  )
})

const showAttributesJsonFallback = computed(() => {
  return shouldShowJsonFallback(props.log?.changes?.attributes, attributesEntries.value.length)
})

const showOldJsonFallback = computed(() => {
  return shouldShowJsonFallback(props.log?.changes?.old, oldEntries.value.length)
})

const showMetadataJsonFallback = computed(() => {
  return shouldShowJsonFallback(props.log?.metadata, metadataEntries.value.length)
})

const formattedCreatedAt = computed(() => formatDateTime(props.log?.createdAt))

function formatDisplayValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  return String(value)
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return '—'

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value)).replace(',', ' •')
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === '[object Object]'
}

function formatLabel(label: string) {
  return label
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function looksTechnical(value: unknown) {
  if (typeof value !== 'string') {
    return false
  }

  return (
    value.includes('\\') ||
    value.includes('{') ||
    value.includes('[') ||
    value.includes('_') ||
    value.length > 28
  )
}

function formatNestedValue(value: unknown) {
  if (value === null || value === undefined || value === '') {
    return '—'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value, null, 2)
  }

  return String(value)
}

function resolveEntryTone(value: unknown): DetailEntry['tone'] {
  return looksTechnical(value) ? 'mono' : 'default'
}

function toObjectEntries(value: AuditStructuredValue | Record<string, unknown> | null | undefined) {
  if (!isPlainObject(value)) {
    return []
  }

  return Object.entries(value).map(([entryKey, entryValue]) => ({
    label: formatLabel(entryKey),
    value: formatNestedValue(entryValue),
    tone: resolveEntryTone(entryValue),
  }))
}

function shouldShowJsonFallback(value: unknown, entriesLength: number) {
  if (entriesLength > 0) {
    return false
  }

  if (value === null || value === undefined) {
    return false
  }

  if (Array.isArray(value)) {
    return value.length > 0
  }

  return !isPlainObject(value)
}

function formatStructuredValue(value: unknown) {
  if (value === null || value === undefined) {
    return '—'
  }

  return JSON.stringify(value, null, 2)
}
</script>

<template>
  <BaseModal width="80%" :open="open" @close="emit('close')">
    <template #header>
      <div class="audit-modal-header">
        <div class="audit-modal-header-main">
          <p class="audit-modal-eyebrow">Audit Log Details</p>
          <div class="audit-modal-badges">
            <span class="audit-log-name-badge">{{ log?.logName ?? '—' }}</span>
            <AuditLogEventBadge :event="log?.event" />
          </div>
        </div>

        <p class="audit-modal-date">{{ formattedCreatedAt }}</p>
      </div>
    </template>

    <div v-if="loading" class="audit-modal-state">
      <BaseSpinner />
      <p class="audit-muted-text">Loading audit log details...</p>
    </div>

    <div v-else-if="error" class="audit-modal-state audit-modal-state-error">
      <p class="audit-muted-text">{{ error }}</p>
      <BaseButton variant="secondary" @click="emit('retry')">Try Again</BaseButton>
    </div>

    <div v-else-if="log" class="grid grid-cols-3 gap-5">
      <div class="grid grid-cols-1 gap-4">
        <section class="audit-section-card">
          <div class="audit-section-heading">
            <h4 class="audit-section-title">General Info</h4>
          </div>

          <dl class="audit-fields-grid">
            <div
              v-for="entry in generalInfoEntries"
              :key="entry.label"
              class="audit-field"
              :class="`span-${entry.span ?? 'default'}`"
            >
              <dt class="audit-detail-label">{{ entry.label }}</dt>
              <dd class="audit-detail-value" :class="`tone-${entry.tone ?? 'default'}`">
                {{ entry.value }}
              </dd>
            </div>
          </dl>
        </section>

        <section class="audit-section-card">
          <div class="audit-section-heading">
            <h4 class="audit-section-title">Causer</h4>
          </div>

          <dl v-if="hasCauser" class="audit-fields-grid">
            <div
              v-for="entry in causerEntries"
              :key="entry.label"
              class="audit-field"
              :class="`span-${entry.span ?? 'default'}`"
            >
              <dt class="audit-detail-label">{{ entry.label }}</dt>
              <dd class="audit-detail-value" :class="`tone-${entry.tone ?? 'default'}`">
                {{ entry.value }}
              </dd>
            </div>
          </dl>

          <div v-else class="audit-empty-state">
            <p class="audit-muted-text">No causer information available</p>
          </div>
        </section>

        <section class="audit-section-card">
          <div class="audit-section-heading">
            <h4 class="audit-section-title">Subject</h4>
          </div>

          <dl v-if="hasSubject" class="audit-fields-grid">
            <div
              v-for="entry in subjectEntries"
              :key="entry.label"
              class="audit-field"
              :class="`span-${entry.span ?? 'default'}`"
            >
              <dt class="audit-detail-label">{{ entry.label }}</dt>
              <dd class="audit-detail-value" :class="`tone-${entry.tone ?? 'default'}`">
                {{ entry.value }}
              </dd>
            </div>
          </dl>

          <div v-else class="audit-empty-state">
            <p class="audit-muted-text">No subject information available</p>
          </div>
        </section>
      </div>

      <section class="audit-section-card changes-section">
        <div class="audit-section-heading">
          <h4 class="audit-section-title">Changes</h4>
        </div>

        <div v-if="hasAnyChanges" class="audit-changes-layout">
          <div class="audit-subsection-card">
            <h5 class="audit-subsection-title">Attributes</h5>

            <dl v-if="attributesEntries.length" class="audit-simple-grid">
              <div
                v-for="entry in attributesEntries"
                :key="entry.label"
                class="audit-simple-row"
              >
                <dt class="audit-detail-label">{{ entry.label }}</dt>
                <dd class="audit-detail-value" :class="`tone-${entry.tone ?? 'default'}`">
                  {{ entry.value }}
                </dd>
              </div>
            </dl>

            <pre
              v-else-if="showAttributesJsonFallback"
              class="audit-json-block"
            >{{ formatStructuredValue(log.changes?.attributes) }}</pre>

            <p v-else class="audit-muted-text">No attribute changes recorded</p>
          </div>

          <div class="audit-subsection-card">
            <h5 class="audit-subsection-title">Previous Values</h5>

            <dl v-if="oldEntries.length" class="audit-simple-grid">
              <div v-for="entry in oldEntries" :key="entry.label" class="audit-simple-row">
                <dt class="audit-detail-label">{{ entry.label }}</dt>
                <dd class="audit-detail-value" :class="`tone-${entry.tone ?? 'default'}`">
                  {{ entry.value }}
                </dd>
              </div>
            </dl>

            <pre
              v-else-if="showOldJsonFallback"
              class="audit-json-block"
            >{{ formatStructuredValue(log.changes?.old) }}</pre>

            <p v-else class="audit-muted-text">No previous values recorded</p>
          </div>
        </div>

        <div v-else class="audit-empty-state">
          <FileSearch class="audit-empty-icon" />
          <p class="audit-muted-text">No changes recorded</p>
        </div>
      </section>

      <section class="audit-section-card metadata-section">
        <div class="audit-section-heading">
          <h4 class="audit-section-title">Metadata</h4>
        </div>

        <dl v-if="metadataEntries.length" class="audit-simple-grid metadata-grid">
          <div v-for="entry in metadataEntries" :key="entry.label" class="audit-simple-row">
            <dt class="audit-detail-label">{{ entry.label }}</dt>
            <dd class="audit-detail-value" :class="`tone-${entry.tone ?? 'default'}`">
              {{ entry.value }}
            </dd>
          </div>
        </dl>

        <pre
          v-else-if="showMetadataJsonFallback"
          class="audit-json-block"
        >{{ formatStructuredValue(log.metadata) }}</pre>

        <div v-else class="audit-empty-state">
          <p class="audit-muted-text">No metadata available</p>
        </div>
      </section>
    </div>

    <div v-else class="audit-modal-state">
      <p class="audit-muted-text">Select an audit log to view the full activity details.</p>
    </div>
  </BaseModal>
</template>

<style scoped>
:deep(.base-modal-panel) {
  width: 80%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.base-modal-header) {
  align-items: flex-start;
  flex: 0 0 auto;
}

:deep(.base-modal-body) {
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1 1 auto;
  min-height: 0;
  padding-top: 0.75rem;
}

.audit-modal-header {
  display: flex;
  width: 100%;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.audit-modal-header-main {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.audit-modal-eyebrow {
  color: hsl(var(--foreground));
  font-size: var(--text-lg);
  font-weight: 700;
}

.audit-modal-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.audit-log-name-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.35rem 0.75rem;
  border-radius: 999px;
  background: hsl(var(--secondary));
  color: hsl(var(--foreground));
  font-size: var(--text-xs);
  font-weight: 700;
  text-transform: capitalize;
}

.audit-modal-date {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-sm);
  font-weight: 600;
  text-align: right;
  white-space: nowrap;
}

.audit-modal-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: start;
}

.audit-top-grid {
  display: grid;
  width: 100%;
  grid-template-columns: 1fr;
  gap: 1rem;
}

.audit-section-card {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 1rem;
  border: 1px solid hsl(var(--border-gray));
  border-radius: 1rem;
  background: hsl(var(--secondary) / 0.4);
}

.audit-section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}

.audit-section-title {
  color: hsl(var(--foreground));
  font-size: var(--text-sm);
  font-weight: 700;
}

.audit-fields-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.875rem 1.25rem;
}

.audit-field,
.audit-simple-row {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
}

.audit-simple-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.875rem 1.25rem;
}

.audit-detail-label {
  color: hsl(var(--muted-foreground));
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.08em;
  margin: 0;
  text-transform: uppercase;
}

.audit-detail-value {
  margin: 0;
  color: hsl(var(--foreground));
  font-size: var(--text-sm);
  font-weight: 500;
  line-height: 1.35;
  white-space: pre-wrap;
  word-break: normal;
  overflow-wrap: break-word;
}

.tone-strong {
  font-size: var(--text-base);
  font-weight: 700;
}

.tone-muted {
  color: hsl(var(--muted-foreground));
}

.tone-mono {
  font-family: ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: var(--text-xs);
  overflow-wrap: anywhere;
}

.audit-changes-layout {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

.audit-subsection-card {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
  padding: 0.875rem;
  border-radius: 0.875rem;
  background: hsl(var(--card) / 0.7);
}

.audit-subsection-title {
  color: hsl(var(--foreground));
  font-size: var(--text-sm);
  font-weight: 700;
}

.audit-json-block {
  margin: 0;
  padding: 0.875rem;
  overflow-x: auto;
  border: 1px solid hsl(var(--border-gray) / 0.7);
  border-radius: 0.875rem;
  background: hsl(var(--muted) / 0.5);
  color: hsl(var(--foreground));
  font-family: ui-monospace, SFMono-Regular, SFMono-Regular, Menlo, Monaco, Consolas,
    'Liberation Mono', 'Courier New', monospace;
  font-size: var(--text-xs);
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
}

.audit-empty-state {
  display: flex;
  min-height: 3.5rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem;
  border-radius: 0.875rem;
  background: hsl(var(--card));
  border: 1px dashed hsl(var(--border-gray));
}

.audit-empty-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: hsl(var(--muted-foreground));
}

.audit-muted-text {
  color: hsl(var(--muted-foreground));
}

.audit-modal-state {
  display: flex;
  min-height: 12rem;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.audit-modal-state-error {
  gap: 1rem;
}

@media (max-width: 768px) {
  :deep(.base-modal-panel) {
    width: min(80vw, 80rem);
    max-height: 80vh;
  }

  .audit-modal-header {
    flex-direction: column;
  }

  .audit-modal-date {
    text-align: left;
    white-space: normal;
  }
}

@media (min-width: 640px) {
  .audit-fields-grid,
  .audit-simple-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .span-full {
    grid-column: 1 / -1;
  }
}

@media (min-width: 768px) {
  .audit-changes-layout {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .metadata-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (min-width: 1024px) {
  .audit-top-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
