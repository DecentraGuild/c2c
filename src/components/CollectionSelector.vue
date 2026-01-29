<template>
  <div class="relative">
    <!-- Search Input -->
    <div class="relative">
      <Icon icon="mdi:magnify" class="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-text-muted" />
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search collections..."
        class="w-full pl-10 pr-4 py-2.5 bg-secondary-bg border border-border-color rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-color focus:border-transparent"
        @focus="showDropdown = true"
        @blur="handleBlur"
      />
    </div>

    <!-- Dropdown -->
    <div
      v-if="showDropdown && filteredCollections.length > 0"
      class="absolute z-50 w-full mt-2 bg-secondary-bg border border-border-color rounded-lg shadow-lg max-h-64 overflow-y-auto"
    >
      <div
        v-for="collection in filteredCollections"
        :key="collection.id"
        @mousedown.prevent="selectCollection(collection)"
        class="px-4 py-3 hover:bg-primary-color/10 cursor-pointer transition-colors flex items-center gap-3"
      >
        <img
          v-if="collection.logo"
          :src="collection.logo"
          :alt="collection.name"
          class="w-8 h-8 object-contain rounded"
        />
        <Icon
          v-else
          icon="mdi:image-off"
          class="w-8 h-8 text-text-muted"
        />
        <div class="flex-1 min-w-0">
          <div class="font-semibold text-text-primary truncate">{{ collection.name }}</div>
          <div v-if="collection.description" class="text-xs text-text-secondary truncate">
            {{ collection.description }}
          </div>
        </div>
        <Icon
          v-if="modelValue === collection.id"
          icon="mdi:check"
          class="w-5 h-5 text-primary-color flex-shrink-0"
        />
      </div>
    </div>

    <!-- Selected Collection Display (when dropdown closed) -->
    <div
      v-if="!showDropdown && selectedCollection"
      @click="showDropdown = true"
      class="mt-2 p-3 bg-secondary-bg border border-border-color rounded-lg cursor-pointer hover:border-primary-color/50 transition-colors flex items-center gap-3"
    >
      <img
        v-if="selectedCollection.logo"
        :src="selectedCollection.logo"
        :alt="selectedCollection.name"
        class="w-10 h-10 object-contain rounded"
      />
      <Icon
        v-else
        icon="mdi:image-off"
        class="w-10 h-10 text-text-muted"
      />
      <div class="flex-1 min-w-0">
        <div class="font-semibold text-text-primary">{{ selectedCollection.name }}</div>
        <div v-if="selectedCollection.description" class="text-xs text-text-secondary truncate">
          {{ selectedCollection.description }}
        </div>
      </div>
      <Icon icon="mdi:chevron-down" class="w-5 h-5 text-text-muted" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Icon } from '@iconify/vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: null
  },
  collections: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const searchQuery = ref('')
const showDropdown = ref(false)

const selectedCollection = computed(() => {
  if (!props.modelValue) return null
  return props.collections.find(c => c.id === props.modelValue)
})

const filteredCollections = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.collections
  }
  
  const query = searchQuery.value.toLowerCase()
  return props.collections.filter(collection => {
    return (
      collection.name.toLowerCase().includes(query) ||
      (collection.description && collection.description.toLowerCase().includes(query))
    )
  })
})

const selectCollection = (collection) => {
  emit('update:modelValue', collection.id)
  showDropdown.value = false
  searchQuery.value = ''
}

const handleBlur = () => {
  // Delay to allow click events to fire
  setTimeout(() => {
    showDropdown.value = false
  }, 200)
}

watch(() => props.modelValue, () => {
  // Reset search when selection changes externally
  searchQuery.value = ''
})
</script>
