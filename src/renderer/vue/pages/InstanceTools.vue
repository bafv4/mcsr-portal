<template>
    <SidebarLayout :items="items" :open="true" :title="t('instance-tools')" />
</template>

<script setup lang="ts">
import SidebarLayout from '../layouts/SidebarLayout.vue';
import { useI18n } from 'vue-i18n';
import ModCheck from './instance-tools/ModCheck.vue';
import ModsSettings from './instance-tools/ModsSettings.vue';
import McConfigs from './instance-tools/McConfigs.vue';

const { t } = useI18n();

const items = [
  {
    title: t('mod-check'),
    icon: 'mdi-folder-arrow-down',
    component: ModCheck
  },
  {
    title: t('mod-settings'),
    icon: 'mdi-file-cog-outline',
    component: ModsSettings
  },
  {
    title: t('options'),
    icon: 'mdi-keyboard',
    component: McConfigs
  }
];
</script>

<style scoped>
.instance-tools-container {
  position: relative;
  width: 100%;
  height: 100%;
}
</style>