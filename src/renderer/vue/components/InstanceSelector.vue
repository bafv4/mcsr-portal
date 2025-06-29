<template>
  <v-btn
    @click="selectInstance"
    color="secondary"
    class="text-caption"
    variant="tonal"
    prepend-icon="mdi-minecraft"
  >
    {{ buttonText }}
  </v-btn>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { useInstanceStore } from '../../composables/Stores';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const instanceStore = useInstanceStore();

const buttonText = computed(() => {
  if (instanceStore.instanceName) {
    return `${t('instance')}: ${instanceStore.instanceName}`;
  }
  return t('choose-instance');
});

async function selectInstance() {
  const path = await window.bafv4.selectDest();
  if (path) {
    const normalizedPath = path.replace(/\\/g, '/');
    const pathParts = normalizedPath.split('/');
    
    // Check if the selected path ends with 'instances' or is an instance folder
    let instanceName = '';
    let launcherRoot = '';
    
    if (pathParts[pathParts.length - 1] === 'instances') {
      // User selected the instances folder, we need to select an instance
      launcherRoot = pathParts.slice(0, -1).join('/');
      instanceName = ''; // Will be set by user selecting an instance
    } else {
      // User selected an instance folder
      instanceName = pathParts.pop() || '';
      launcherRoot = pathParts.join('/');
      
      // Check if launcherRoot ends with 'instances' and remove it
      if (launcherRoot.endsWith('/instances')) {
        launcherRoot = launcherRoot.slice(0, -10); // Remove '/instances'
      }
    }

    console.log('Instance selection:', {
      originalPath: path,
      normalizedPath,
      pathParts,
      instanceName,
      launcherRoot
    });

    instanceStore.setLauncherRoot(launcherRoot);
    instanceStore.setInstanceName(instanceName);
  }
}
</script> 