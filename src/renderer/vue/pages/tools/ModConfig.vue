<template>
  <ToolPageLayout>
    <template #header>
      <div class="d-flex align-center justify-space-between">
        <h2 class="text-h5 font-weight-bold">{{ t('mod-config') }}</h2>
        <InstanceSelector />
      </div>
    </template>
    
    <div v-if="!instanceStore.instanceName" class="text-center pa-8">
      <v-icon size="64" color="grey" class="mb-4">mdi-cog</v-icon>
      <p class="text-body-1 text-grey">{{ t('select-instance-first') }}</p>
      <p class="text-caption text-grey mt-2">{{ t('select-instance-hint') }}</p>
    </div>
    
    <div v-else>
      <div v-if="loading" class="text-center pa-8">
        <v-progress-circular indeterminate size="64" color="primary"></v-progress-circular>
        <p class="text-body-1 mt-4">{{ t('loading-mods') }}</p>
      </div>
      
      <div v-else-if="installedMods.length === 0" class="text-center pa-8">
        <v-icon size="64" color="grey" class="mb-4">mdi-package-variant</v-icon>
        <p class="text-body-1 text-grey">{{ t('no-mods-installed') }}</p>
      </div>
      
      <div v-else>
        <v-tabs v-model="activeTab" color="primary" grow>
          <v-tab 
            v-for="modId in installedMods" 
            :key="modId"
            :value="modId"
            class="text-capitalize"
          >
            {{ getModDisplayName(modId) }}
          </v-tab>
        </v-tabs>
        
        <v-window v-model="activeTab" class="mt-4">
          <v-window-item 
            v-for="modId in installedMods" 
            :key="modId"
            :value="modId"
          >
            <ModConfigPanel 
              :mod-id="modId"
              :config="modConfigs[modId]"
              :default-config="defaultConfigs[modId]"
              @save="saveModConfig"
            />
          </v-window-item>
        </v-window>
      </div>
    </div>
  </ToolPageLayout>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import ToolPageLayout from '../../components/ToolPageLayout.vue';
import InstanceSelector from '../../components/InstanceSelector.vue';
import ModConfigPanel from './ModConfigPanel.vue';
import { useI18n } from 'vue-i18n';
import { useInstanceStore } from '../../../composables/Stores';

const { t } = useI18n();
const instanceStore = useInstanceStore();

// Reactive data
const loading = ref(false);
const installedMods = ref<string[]>([]);
const activeTab = ref<string>('');
const modConfigs = ref<Record<string, any>>({});
const defaultConfigs = ref<Record<string, any>>({});

// Computed
const instancePath = computed(() => {
  if (!instanceStore.launcherRoot || !instanceStore.instanceName) return '';
  
  let launcherRoot = instanceStore.launcherRoot;
  
  // Remove trailing 'instances' if it exists
  if (launcherRoot.endsWith('/instances')) {
    launcherRoot = launcherRoot.slice(0, -10);
  }
  
  const path = `${launcherRoot}/instances/${instanceStore.instanceName}`;
  console.log('Computed instance path:', {
    originalLauncherRoot: instanceStore.launcherRoot,
    cleanedLauncherRoot: launcherRoot,
    instanceName: instanceStore.instanceName,
    fullPath: path
  });
  return path;
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

const loadInstalledMods = async () => {
  if (!instancePath.value) return;
  
  console.log('Loading installed mods for instance path:', instancePath.value);
  loading.value = true;
  try {
    const mods = await window.bafv4.getInstalledMods(instancePath.value);
    console.log('Detected mods:', mods);
    installedMods.value = mods;
    
    if (mods.length > 0) {
      activeTab.value = mods[0];
      await loadModConfigs(mods);
    }
  } catch (error) {
    console.error('Failed to load installed mods:', error);
  } finally {
    loading.value = false;
  }
};

const loadModConfigs = async (modIds: string[]) => {
  for (const modId of modIds) {
    try {
      // Load current config
      const config = await window.bafv4.getModConfig(instancePath.value, modId);
      modConfigs.value[modId] = config || {};
      
      // Load default config from settings
      const defaultConfig = await window.bafv4.getDefaultModConfig(modId);
      if (defaultConfig) {
        defaultConfigs.value[modId] = defaultConfig;
        
        // If no current config exists, use default
        if (!config) {
          modConfigs.value[modId] = { ...defaultConfig };
        }
      }
    } catch (error) {
      console.error(`Failed to load config for ${modId}:`, error);
      modConfigs.value[modId] = {};
      defaultConfigs.value[modId] = {};
    }
  }
};

const saveModConfig = async (modId: string, config: any) => {
  if (!instancePath.value) return;
  
  try {
    await window.bafv4.saveModConfig(instancePath.value, modId, config);
    modConfigs.value[modId] = { ...config };
    // Show success message
    console.log(`Config saved for ${modId}`);
  } catch (error) {
    console.error(`Failed to save config for ${modId}:`, error);
    // Show error message
  }
};

// Watchers
watch(() => instanceStore.instanceName, () => {
  if (instanceStore.instanceName) {
    loadInstalledMods();
  } else {
    installedMods.value = [];
    modConfigs.value = {};
    defaultConfigs.value = {};
    activeTab.value = '';
  }
});

// Lifecycle
onMounted(() => {
  if (instanceStore.instanceName) {
    loadInstalledMods();
  }
});
</script>

<style scoped>
</style> 