<template>
  <div class="space-y-3">
    <!-- Current UTC Time Display -->
    <div v-if="showCurrentTime" class="bg-secondary-bg/30 rounded-lg p-2 border border-border-color/50">
      <div class="flex items-center justify-between text-xs">
        <span class="text-text-muted">Current UTC Time:</span>
        <span class="text-text-primary font-mono font-medium">{{ currentUTCTime }}</span>
      </div>
    </div>

    <!-- Quick Time Presets -->
    <div v-if="showCurrentTime" class="flex flex-wrap gap-1.5">
      <button
        v-for="preset in timePresets"
        :key="preset.label"
        @click="applyPreset(preset.minutes)"
        class="px-2 py-1 text-xs font-medium rounded bg-secondary-bg/50 text-text-secondary hover:bg-secondary-bg transition-colors"
        type="button"
      >
        {{ preset.label }}
      </button>
    </div>

    <!-- Combined Date and Time Picker -->
    <div>
      <label class="block text-xs font-semibold text-text-secondary mb-1.5">Date & Time (UTC)</label>
      <VueDatePicker
        v-model="localDateTime"
        :min-date="minDate"
        :enable-time-picker="true"
        timezone="UTC"
        :dark="true"
        format="yyyy-MM-dd HH:mm"
        auto-apply
        :close-on-auto-apply="true"
        placeholder="Select date and time (UTC)"
        class="datetime-picker"
        @update:model-value="updateDateTime"
      />
    </div>

    <!-- Validation Error -->
    <div v-if="validationError" class="text-xs text-red-400 mt-1">
      <Icon icon="mdi:alert-circle" class="w-3 h-3 inline mr-1" />
      {{ validationError }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import { VueDatePicker } from '@vuepic/vue-datepicker'
import '@vuepic/vue-datepicker/dist/main.css'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  showCurrentTime: {
    type: Boolean,
    default: true
  },
  minMinutesFromNow: {
    type: Number,
    default: 5
  }
})

const emit = defineEmits(['update:modelValue', 'validation-change'])

const localDateTime = ref(null)
const validationError = ref(null)
const currentUTCTime = ref('')
let timeUpdateInterval = null

// Calculate minimum date (now + minMinutesFromNow in UTC)
const minDate = computed(() => {
  const now = new Date()
  const minTime = new Date(now.getTime() + props.minMinutesFromNow * 60 * 1000)
  return new Date(Date.UTC(
    minTime.getUTCFullYear(),
    minTime.getUTCMonth(),
    minTime.getUTCDate(),
    minTime.getUTCHours(),
    minTime.getUTCMinutes()
  ))
})

// Time presets for quick selection
const timePresets = [
  { label: '+12 hours', minutes: 720 },
  { label: '+1 day', minutes: 1440 },
  { label: '+3 days', minutes: 4320 },
  { label: '+7 days', minutes: 10080 },
  { label: '+30 days', minutes: 43200 }
]

// Update current UTC time display
function updateCurrentUTCTime() {
  const now = new Date()
  const year = now.getUTCFullYear()
  const month = String(now.getUTCMonth() + 1).padStart(2, '0')
  const day = String(now.getUTCDate()).padStart(2, '0')
  const hours = String(now.getUTCHours()).padStart(2, '0')
  const minutes = String(now.getUTCMinutes()).padStart(2, '0')
  const seconds = String(now.getUTCSeconds()).padStart(2, '0')
  currentUTCTime.value = `${year}-${month}-${day} ${hours}:${minutes}:${seconds} UTC`
}

// Parse datetime-local format to Date object
function parseDateTime(value) {
  if (!value) {
    return null
  }
  
  // Handle datetime-local format: YYYY-MM-DDTHH:mm
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/)
  if (!match) {
    return null
  }
  
  const [year, month, day] = match[1].split('-').map(Number)
  const [hours, minutes] = match[2].split(':').map(Number)
  
  // Create Date object in UTC
  return new Date(Date.UTC(year, month - 1, day, hours, minutes, 0))
}

// Convert Date object to datetime-local format
function formatDateTime(date) {
  if (!date) {
    return null
  }
  
  // Extract UTC components from Date object
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const hours = String(date.getUTCHours()).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

// Validate the selected date/time (all comparisons in UTC)
function validateDateTime(dateTime) {
  if (!dateTime) {
    validationError.value = null
    emit('validation-change', { valid: true, error: null })
    return true
  }
  
  const selectedDate = dateTime instanceof Date ? dateTime : new Date(dateTime)
  
  if (isNaN(selectedDate.getTime())) {
    validationError.value = 'Invalid date or time'
    emit('validation-change', { valid: false, error: 'Invalid date or time' })
    return false
  }
  
  // Get current UTC time
  const now = new Date()
  const nowUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  )
  
  // Calculate minimum date in UTC (now + minMinutesFromNow)
  const minDateUTC = nowUTC + (props.minMinutesFromNow * 60 * 1000)
  
  // Get selected date in UTC
  const selectedUTC = Date.UTC(
    selectedDate.getUTCFullYear(),
    selectedDate.getUTCMonth(),
    selectedDate.getUTCDate(),
    selectedDate.getUTCHours(),
    selectedDate.getUTCMinutes(),
    0
  )
  
  if (selectedUTC <= nowUTC) {
    validationError.value = 'Expiration time must be in the future'
    emit('validation-change', { valid: false, error: 'Expiration time must be in the future' })
    return false
  }
  
  if (selectedUTC < minDateUTC) {
    const minTime = new Date(minDateUTC)
    const minHours = String(minTime.getUTCHours()).padStart(2, '0')
    const minMinutes = String(minTime.getUTCMinutes()).padStart(2, '0')
    validationError.value = `Expiration must be at least ${props.minMinutesFromNow} minutes from now (${minHours}:${minMinutes} UTC)`
    emit('validation-change', { valid: false, error: validationError.value })
    return false
  }
  
  validationError.value = null
  emit('validation-change', { valid: true, error: null })
  return true
}

// Update the combined datetime value
function updateDateTime() {
  if (localDateTime.value) {
    const formatted = formatDateTime(localDateTime.value)
    validateDateTime(localDateTime.value)
    emit('update:modelValue', formatted)
  } else {
    emit('update:modelValue', null)
    validationError.value = null
  }
}

// Apply time preset (adds time to current UTC time)
function applyPreset(minutes) {
  const now = new Date()
  
  // Get current UTC timestamp
  const currentUTC = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate(),
    now.getUTCHours(),
    now.getUTCMinutes(),
    now.getUTCSeconds()
  )
  
  // Add minutes to UTC time (in milliseconds)
  const futureUTC = currentUTC + (minutes * 60 * 1000)
  
  // Create Date object from UTC timestamp
  // When VueDatePicker has :utc="true", it will interpret this as UTC
  localDateTime.value = new Date(futureUTC)
  
  // Force update to trigger validation and emit
  updateDateTime()
}

// Watch for external changes to modelValue
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    const parsed = parseDateTime(newValue)
    localDateTime.value = parsed
    if (parsed) {
      validateDateTime(parsed)
    }
  } else {
    localDateTime.value = null
    validationError.value = null
  }
}, { immediate: true })

// Initialize current UTC time and update it every second
onMounted(() => {
  updateCurrentUTCTime()
  if (props.showCurrentTime) {
    timeUpdateInterval = setInterval(updateCurrentUTCTime, 1000)
  }
})

onUnmounted(() => {
  if (timeUpdateInterval) {
    clearInterval(timeUpdateInterval)
  }
})
</script>
