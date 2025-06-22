<template>
  <v-list-item>
    <v-list-item-title>{{ displayName }}</v-list-item-title>
    <v-list-item-subtitle>{{ props.keyName }}</v-list-item-subtitle>

    <template v-slot:append>
      <!-- Boolean type -->
      <v-switch
        v-if="props.type === 'boolean'"
        v-model="localValue"
        color="primary"
        inset
        hide-details
        @update:model-value="updateValue"
      />

      <!-- Number type -->
      <div
        v-else-if="props.type === 'number'"
        class="d-flex align-center"
        style="width: 200px"
      >
        <v-slider
          v-if="showSlider"
          v-model="localValue"
          :min="props.min || 0"
          :max="props.max || 100"
          :step="props.step || 1"
          hide-details
          class="flex-grow-1"
          style="z-index: 1"
          @update:model-value="updateValue"
        />
        <v-text-field
          v-model.number="localValue"
          type="number"
          :min="props.min || 0"
          :max="props.max || 100"
          :step="props.step || 1"
          hide-details
          density="compact"
          class="ml-4 flex-shrink-1"
          style="width: 80px"
          @update:model-value="updateValue"
        />
      </div>

      <!-- String type -->
      <v-text-field
        v-else-if="props.type === 'string'"
        v-model="localValue"
        hide-details
        density="compact"
        style="width: 200px"
        @update:model-value="updateValue"
      />

      <!-- Object type (display as JSON) -->
      <v-textarea
        v-else-if="props.type === 'object'"
        v-model="jsonValue"
        rows="3"
        density="compact"
        style="width: 300px"
        @update:model-value="updateJsonValue"
        hide-details
      />

      <!-- Default fallback -->
      <v-text-field
        v-else
        v-model="localValue"
        hide-details
        density="compact"
        style="width: 200px"
        @update:model-value="updateValue"
      />
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  keyName: string
  value: any
  type: 'boolean' | 'number' | 'string' | 'object'
  min?: number
  max?: number
  step?: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  update: [key: string, value: any]
}>()

// Local state
const localValue = ref<any>(props.value)
const jsonValue = ref<string>('')

// Computed properties
const displayName = computed(() => {
  return props.keyName
    .replace(/[:_]/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim()
})

const showSlider = computed(() => {
  if (props.type !== 'number') return false
  
  const keyLower = props.keyName.toLowerCase()
  const sliderKeys = ['fov', 'gamma', 'distance', 'sensitivity', 'scale']
  return sliderKeys.some(key => keyLower.includes(key))
})

// Methods
const updateValue = (newValue: any) => {
  emit('update', props.keyName, newValue)
}

const updateJsonValue = () => {
  try {
    const parsed = JSON.parse(jsonValue.value)
    emit('update', props.keyName, parsed)
  } catch (error) {
    // Invalid JSON, keep as string
    emit('update', props.keyName, jsonValue.value)
  }
}

// Watchers
watch(() => props.value, (newValue) => {
  localValue.value = newValue
  if (props.type === 'object' && newValue !== null) {
    jsonValue.value = JSON.stringify(newValue, null, 2)
  }
}, { immediate: true, deep: true })
</script> 
