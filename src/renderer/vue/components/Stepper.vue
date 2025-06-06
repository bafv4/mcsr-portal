<template>
    <v-card class="d-flex pa-4 ga-2 flex-column w-100 h-100 elevation-2">
        <div class="w-100 flex-0-1 pa-0 d-flex ga-4 flex-column">
            <div>
                <v-slide-group class="w-100" style="width: max-content;" direction="horizontal" show-arrows>
                    <v-slide-group-item v-for="(s, i) in steps" class="d-flex flex-row">
                        <v-card class="align-center d-flex ga-2 pl-3 pr-3" :key="i" variant="text"
                            :class="{ 'text-high-emphasis': location == s.id, 'text-disabled': !(location == s.id) }">
                            <span class="text-subtitle-1 pa-0 ma-0">{{ i + 1 }}</span>
                            <span class="d-flex flex-column pa-0 ga-0">
                                <span class="text-subtitle-2">{{ t(s.id) }}</span>
                                <span class="text-caption" v-if="s.optional">{{ t('optional') }}</span>
                            </span>
                        </v-card>
                    </v-slide-group-item>
                </v-slide-group>
            </div>
            <v-divider></v-divider>
        </div>

        <div class="w-100 flex-1-0 pa-1 d-flex flex-column main">
            <slot name="main"></slot>
        </div>

        <div class="w-100 flex-0-1 pa-1">
            <v-divider class="mb-2"></v-divider>
            <div class="d-flex ga-2 justify-end">
                <slot name="navigation"></slot>
            </div>
        </div>
    </v-card>
</template>

<script setup lang="ts">
import type { Step } from '../../../env';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

defineProps<{
    steps: Step[],
    location: string,
}>();
</script>

<style lang="css" scoped>
.main {
    overflow-y: auto;
    box-sizing: border-box;
}
</style>