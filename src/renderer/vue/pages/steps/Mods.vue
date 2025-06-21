<template>
    <LoadingView v-if="isLoading" />
    <Wizard v-else-if="isDownloading">
        <template #main>
            <v-card class="pa-0 ma-0 elevation-0">
                <v-card-title v-if="state == 4" class="pl-0 pt-0 pr-0" prepend-icon="mdi-check-circle" transition="fade-transition">{{ t('done') }}</v-card-title>
                <v-card-title v-else class="pl-0 pt-0 pr-0" prepend-icon="mdi-progress-download" transition="fade-transition">{{ t('please-wait') }}</v-card-title>

                <v-sheet class="d-flex flex-column ga-4 mt-4">
                    <ProgressItem :state="state == 0 ? 'pending' : state == 1 ? 'processing' : 'done'" :prog="percent" percent>
                        <span class="text-subtitle-1">{{ t('p-1') }}</span>
                    </ProgressItem>
                </v-sheet>
            </v-card>
        </template>
        <template #btn>
            <v-btn color="primary" variant="outlined" @click="emit('next')" append-icon="mdi-arrow-right" class="border-primary-md" :disabled="state != 4">
                {{ t('next') }}
            </v-btn>
        </template>
    </Wizard>
    <Wizard v-else>
        <template #main>
            <v-card class="pa-0 ma-0 elevation-0">
                <v-card-title class="pl-0 pt-0 pr-0">{{ t('mods-t') }}</v-card-title>
                <v-card-text class="pl-0 pr-0">{{ t('mods-s') }}</v-card-text>
                <Checkboxes v-model="selectedItems" :items="availableItems" @update:selectedOptions="onChangeOptions" card-style>
                    <template #item="{ item }">
                        <div class="d-flex flex-column flex-grow-1">
                            <div class="d-flex align-center">
                                <span class="text-body-1">{{ item.name }}</span>
                                <v-chip v-if="item.version" size="x-small" class="ml-2" label>{{ item.version }}</v-chip>
                            </div>
                            <div v-if="item.description" class="text-caption text-medium-emphasis mt-1" style="line-height: 1.25;">
                                {{ translatedDescriptions[item.id] || item.description }}
                            </div>
                        </div>
                    </template>
                </Checkboxes>
            </v-card>
        </template>
        <template #btn>
            <v-btn variant="plain" class="mr-auto" prepend-icon="mdi-arrow-left" :elevation="0" color="secondary" @click="$emit('back')">
                {{ t('back') }}
            </v-btn>
            <v-btn color="secondary" variant="outlined" @click="$emit('next')" append-icon="mdi-skip-next" class="border-secondary-md">
                {{ t('skip') }}
            </v-btn>
            <v-btn color="primary" variant="outlined" @click="startDownload" prepend-icon="mdi-tray-arrow-down" class="border-primary-md">
                {{ t('download') }}
            </v-btn>
        </template>
    </Wizard>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { ref, onMounted, watch } from 'vue';
import Checkboxes from '../../components/Checkboxes.vue';
import LoadingView from '../../components/LoadingView.vue';
import Wizard from '../../components/Wizard.vue';
import ProgressItem from '../../components/ProgressItem.vue';
import type { Item, Option } from '../../../../env';
import { useInstanceStore, useModsStore } from '../../../composables/Stores';
import axios from 'axios';
import { useTranslate } from '../../../composables/Translate';

const { t } = useI18n();
const { translate } = useTranslate();
const instanceStore = useInstanceStore();

// --- State ---
const isLoading = ref(true);
const isDownloading = ref(false);
const availableItems = ref<Item[]>([]);
const selectedItems = ref<string[]>([]);
const selectedOptions = ref<Record<string, Option>>({});
const translatedDescriptions = ref<Record<string, string>>({});

const emit = defineEmits<{
    (e: 'error', msg: string): void;
    (e: 'next'): void;
    (e: 'back'): void;
}>();

// --- Data Fetching and Processing ---
const fetchMods = async () => {
    isLoading.value = true;
    try {
        const response = await axios.get('https://raw.githubusercontent.com/tildejustin/mcsr-meta/schema-6/mods.json');
        const allMods = response.data.mods;
        availableItems.value = allMods
            .map((mod: any): Item | null => {
                const versionInfo = mod.versions.find((v: any) => v.target_version.includes('1.16.1'));
                if (!versionInfo) return null;
                return {
                    id: mod.modid,
                    name: mod.name,
                    description: mod.description,
                    version: versionInfo.version,
                    traits: mod.traits,
                    options: [{ id: mod.modid, name: mod.name, url: versionInfo.url, tag: 'jar' }]
                };
            })
            .filter((item: Item | null): item is Item => item !== null);
    } catch (error) {
        console.error('Failed to fetch mods:', error);
        emit('error', t('mods-fetch-err'));
    } finally {
        isLoading.value = false;
    }
};

watch(availableItems, (newItems) => {
    newItems.forEach(async (item) => {
        if (item.description) {
            translatedDescriptions.value[item.id] = await translate(item.description);
        }
    });
}, { deep: true });

onMounted(fetchMods);

const onChangeOptions = (val: Record<string, Option>) => {
    selectedOptions.value = val;
};

// --- Download Logic ---
const startDownload = async () => {
    const modsToDownload = selectedItems.value.map(id => selectedOptions.value[id]);
    if (modsToDownload.length === 0) {
        emit('next');
        return;
    }

    useModsStore().add(modsToDownload.map(m => m.id));

    isDownloading.value = true;
    try {
        const modsDir = `${instanceStore.getLauncherRoot()}/instances/${instanceStore.getInstanceName()}/.minecraft/mods`;
        await window.bafv4.createDirectory(modsDir);
        
        const op = JSON.parse(JSON.stringify(modsToDownload));
        const to = JSON.parse(JSON.stringify(modsDir));
        window.bafv4.startDarwin(op, to);

    } catch (error: any) {
        emit('error', error.message || 'Download failed');
        isDownloading.value = false;
    }
};

// --- Progress Tracking ---
const percent = ref(0);
const state = ref(0);
window.bafv4.tick((s, p, _t) => {
    state.value = s;
    if (s == 1) percent.value = p;
});
window.bafv4.catchDarwinErr((_s, m) => {
    emit('error', m);
    isDownloading.value = false;
});
</script>