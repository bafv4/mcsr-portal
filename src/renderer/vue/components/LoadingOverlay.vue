<template>
  <div class="loading-overlay-container">
    <div class="loading-overlay">
      <v-progress-circular
        :size="64"
        :width="8"
        color="primary"
        indeterminate
      />
      <div class="loading-text mt-4">
        {{ message || t('loading') }}
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
  message?: string;
}>();
</script>

<style scoped>
.loading-overlay-container {
  position: relative;
  width: 100%;
  height: 100%;
}

.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.v-theme--dark .loading-overlay {
  background-color: rgba(0, 0, 0, 0.8);
}

.loading-text {
  font-size: 1rem;
  font-weight: 500;
  color: rgba(0, 0, 0, 0.87);
}

.v-theme--dark .loading-text {
  color: rgba(255, 255, 255, 0.87);
}
</style> 