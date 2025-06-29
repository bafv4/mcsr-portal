<template>
  <div class="mod-config-panel">
    <div v-if="loading" class="text-center pa-8">
      <v-progress-circular indeterminate size="32" color="primary"></v-progress-circular>
      <p class="text-body-2 mt-2">{{ t('loading-config') }}</p>
    </div>
    
    <div v-else>
      <v-card class="pa-2">
        <div class="d-flex justify-space-between align-center mb-4">
          <h3 class="text-h6">{{ getModDisplayName(modId) }} {{ t('configuration') }}</h3>
          <div>
            <v-btn
              v-if="hasChanges"
              color="grey"
              variant="text"
              class="mr-2"
              @click="discardChanges"
            >
              {{ t('discard-changes') }}
            </v-btn>
            <v-btn 
              color="primary" 
              @click="saveConfig"
              :loading="saving"
              :disabled="!hasChanges"
            >
              {{ t('save-config') }}
            </v-btn>
          </div>
        </div>
        
        <v-divider class="mb-4"></v-divider>
        
        <div v-if="Object.keys(config).length === 0" class="text-center pa-8">
          <v-icon size="48" color="grey" class="mb-4">mdi-cog-off</v-icon>
          <p class="text-body-1 text-grey">{{ t('no-config-available') }}</p>
        </div>
        
        <div v-else>
          <v-form @submit.prevent="saveConfig">
            <div class="config-items">
              <ConfigItem 
                v-for="(value, key) in localConfig" 
                :key="key"
                :key-name="key"
                :value="value"
                :type="getValueType(value)"
                :min="getMinValue(key)"
                :max="getMaxValue(key)"
                :step="getStepValue(key)"
                @update="updateConfig"
              />
            </div>
          </v-form>
        </div>
      </v-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import ConfigItem from './ConfigItem.vue';

interface Props {
  modId: string;
  config: Record<string, any>;
  defaultConfig: Record<string, any>;
}

const props = defineProps<Props>();
const emit = defineEmits<{
  save: [modId: string, config: any];
}>();

const { t } = useI18n();

// Reactive data
const loading = ref(false);
const saving = ref(false);
const localConfig = ref<Record<string, any>>({});

// Computed
const hasChanges = computed(() => {
  return JSON.stringify(localConfig.value) !== JSON.stringify(props.config);
});

// Methods
const getModDisplayName = (modId: string): string => {
  const displayNames: Record<string, string> = {
    'sodium': 'Sodium',
    'seedqueue': 'SeedQueue',
    'extra-options': 'Extra Options',
    'standardsettings': 'Standard Settings',
    'worldpreview': 'World Preview'
  };
  return displayNames[modId] || modId;
};

const getValueType = (value: any): 'boolean' | 'number' | 'string' | 'object' => {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'object' && value !== null) return 'object';
  return 'string'; // fallback
};

const getMinValue = (key: string): number => {
  const keyLower = key.toLowerCase();
  if (keyLower.includes('fov')) return 30;
  if (keyLower.includes('renderdistance') || keyLower.includes('distance')) return 2;
  if (keyLower.includes('fps')) return 10;
  if (keyLower.includes('thread')) return 1;
  if (keyLower.includes('gamma')) return 0.0;
  if (keyLower.includes('sensitivity')) return 0.01;
  return 0;
};

const getMaxValue = (key: string): number => {
  const keyLower = key.toLowerCase();
  if (keyLower.includes('fov')) return 110;
  if (keyLower.includes('renderdistance') || keyLower.includes('distance')) return 32;
  if (keyLower.includes('fps')) return 260;
  if (keyLower.includes('thread')) return 32;
  if (keyLower.includes('gamma')) return 1.0;
  if (keyLower.includes('sensitivity')) return 1.0;
  return 100;
};

const getStepValue = (key: string): number => {
  const keyLower = key.toLowerCase();
  if (keyLower.includes('gamma')) return 0.1;
  if (keyLower.includes('sensitivity')) return 0.01;
  if (keyLower.includes('fps')) return 10;
  return 1;
};

const updateConfig = (key: string, value: any) => {
  localConfig.value[key] = value;
};

const saveConfig = async () => {
  saving.value = true;
  try {
    emit('save', props.modId, localConfig.value);
  } catch (error) {
    console.error('Failed to save config:', error);
  } finally {
    saving.value = false;
  }
};

const discardChanges = () => {
  localConfig.value = JSON.parse(JSON.stringify(props.config));
};

// Watchers
watch(() => props.config, (newConfig) => {
  localConfig.value = { ...newConfig };
}, { immediate: true, deep: true });
</script>

<style scoped>
.mod-config-panel {
  max-width: 800px;
  margin: 0 auto;
}

.config-items {
  /* max-height and overflow-y are removed to allow parent scrolling */
}
</style> 