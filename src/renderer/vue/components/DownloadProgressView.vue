<template>
    <v-card class="pa-0 ma-0 elevation-0">
        <v-card-title v-if="state >= 4" class="pl-0 pt-0 pr-0" prepend-icon="mdi-check-circle" transition="fade-transition">
            {{ t('done') }}
        </v-card-title>
        <v-card-title v-else class="pl-0 pt-0 pr-0" prepend-icon="mdi-progress-download" transition="fade-transition">
            {{ t('please-wait') }}
        </v-card-title>

        <v-sheet class="d-flex flex-column ga-4 mt-4">
            <slot name="extra"></slot>
            <slot></slot>
        </v-sheet>
    </v-card>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps<{
    state: number;
}>();
</script> 