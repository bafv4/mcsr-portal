<template>
    <LoadingOverlay v-if="isLoading" />
    <Wizard v-else-if="error">
        <template #main>
            <v-card class="pa-0 ma-0 elevation-0">
                <v-card-title class="pl-0 pt-0 pr-0" prepend-icon="mdi-alert-circle">An Error Has</v-card-title>
                <v-card-text class="pl-0 pr-0">noway please make sure the internet connection is avalible</v-card-text>
            </v-card>
        </template>
        <template #btn>
            <v-btn color="primary" variant="outlined" @click="retry" prepend-icon="mdi-reload"
                class="border-primary-md">
                {{ t('retry') }}
            </v-btn>
        </template>
    </Wizard>
    <Wizard v-else-if="isDownloading">
        <template #main>
            <DownloadProgressView
                :state="state"
                :percent="percent"
                :total-zips="totalZips"
                :prog-zip="progZip"
                :total-installers="totalInstallers"
                :prog-installer="progInstaller"
            >
                <ProgressItem :state="state == 0 ? `pending` : state == 1 ? `processing` : `done`" :prog="percent" percent>
                    <span class="text-subtitle-1">{{ t('p-1') }}</span>
                </ProgressItem>
                <ProgressItem :state="state in [0, 1] ? `pending` : state == 2 ? `processing` : `done`" v-if="totalZips > 0" :total="totalZips" :prog="progZip">
                    <span class="text-subtitle-1">{{ t('p-2') }}</span>
                </ProgressItem>
                <ProgressItem :state="state in [0, 1, 2] ? `pending` : state == 3 ? `processing` : `done`" v-if="totalInstallers > 0" :total="totalInstallers" :prog="progInstaller">
                    <span class="text-subtitle-1">{{ t('p-3') }}</span>
                </ProgressItem>
            </DownloadProgressView>
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
                <v-card-title class="pl-0 pt-0 pr-0">{{ t('ext-tools-t') }}</v-card-title>
                <v-card-text class="pl-0 pr-0">{{ t('ext-tools-s') }}</v-card-text>

                <v-card-text class="pl-0 pr-0">
                    <Checkboxes v-model="selectedItems" :items="availableItems" @update:selectedOptions="onChangeOptions" card-style>
                        <template #item="{ item }">
                            <span class="text-body-1">{{ item.name }}</span>
                        </template>
                        <template #description="{ item }">
                            <div v-if="item.description" class="text-caption text-medium-emphasis mt-2">
                                {{ translatedDescriptions[item.id] || item.description }}
                            </div>
                        </template>
                    </Checkboxes>
                </v-card-text>
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
import LoadingOverlay from '../../components/LoadingOverlay.vue';
import ProgressItem from '../../components/ProgressItem.vue';
import Wizard from '../../components/Wizard.vue';
import DownloadProgressView from '../../components/DownloadProgressView.vue';
import type { Item, Option } from '../../../../env';
import { useDirStore, useResourcesStore } from '../../../composables/Stores';
import { useTranslate } from '../../../composables/Translate';
import axios from 'axios';

const { t } = useI18n();
const { translate } = useTranslate();
const dirStore = useDirStore();

// State
const isLoading = ref(true);
const error = ref(false);
const isDownloading = ref(false);
const availableItems = ref<Item[]>([]);
const selectedItems = ref<string[]>([]);
const selectedOptions = ref<Record<string, Option>>({});
const translatedDescriptions = ref<Record<string, string>>({});

// Progress tracking
const totalZips = ref(0);
const totalInstallers = ref(0);
const percent = ref(0);
const progZip = ref(0);
const progInstaller = ref(0);
const state = ref(0);

// Emits
const emit = defineEmits<{
    (e: 'error', msg: string): void;
    (e: 'next'): void;
    (e: 'back'): void;
}>();

// Data fetching
const loadData = async () => {
    isLoading.value = true;
    error.value = false;
    try {
        const response = await axios.get('https://raw.githubusercontent.com/bafv4/mcsr-portal/refs/heads/main/meta/ext-tools.json');
        availableItems.value = response.data['ext-tools'] || [];
    } catch (e) {
        error.value = true;
    } finally {
        isLoading.value = false;
    }
};

// Watch for translations
watch(availableItems, (newItems) => {
    newItems.forEach(async (item) => {
        if (item.description) {
            translatedDescriptions.value[item.id] = await translate(item.description);
        }
    });
}, { deep: true });

// Methods
const onChangeOptions = (val: Record<string, Option>) => {
    selectedOptions.value = val;
};

const startDownload = () => {
    const optionsToDownload: Option[] = selectedItems.value.map(id => selectedOptions.value[id]);

    if (optionsToDownload.length === 0) {
        emit('error', t('env-err-1'));
        return;
    }
    
    if (optionsToDownload.some(opt => !opt.id)) return;

    useResourcesStore().add(selectedItems.value);
    try {
        const op = JSON.parse(JSON.stringify(optionsToDownload));
        const to = JSON.parse(JSON.stringify(dirStore.get()));
        window.bafv4.startDarwin(op, to);
        isDownloading.value = true;
    } catch (err) {
        emit('error', 'Download failed to start');
    }
};

const retry = async () => {
    error.value = false;
    await loadData();
};

// Progress tracking setup
window.bafv4.sendTotal((z: number, i: number) => {
    totalZips.value = z;
    totalInstallers.value = i;
});
window.bafv4.tick((s, p, _t) => {
    state.value = s;
    if (s == 1) percent.value = p;
    else if (s == 2) progZip.value = p;
    else if (s == 3) progInstaller.value = p;
});
window.bafv4.catchDarwinErr((_s, m) => emit('error', m));

// Initialize
onMounted(loadData);
</script>

<style scoped>
.ext-tools-content {
  height: 100%;
}
</style>