<template>
    <div class="loading">
        <v-progress-circular indeterminate color="primary" />
        <div>{{ t('loading') }}</div>
    </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
</script>

<style scoped>
.loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
}
</style>