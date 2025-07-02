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
            <DownloadProgressView :state="state" :percent="percent" :total-zips="totalZips" :prog-zip="progZip"
                :total-installers="totalInstallers" :prog-installer="progInstaller">
                <ProgressItem :state="state == 0 ? `pending` : state == 1 ? `processing` : `done`" :prog="percent"
                    percent>
                    <span class="text-subtitle-1">{{ t('p-1') }}</span>
                </ProgressItem>
                <ProgressItem :state="state in [0, 1] ? `pending` : state == 2 ? `processing` : `done`"
                    v-if="totalZips > 0" :total="totalZips" :prog="progZip">
                    <span class="text-subtitle-1">{{ t('p-2') }}</span>
                </ProgressItem>
                <ProgressItem :state="state in [0, 1, 2] ? `pending` : state == 3 ? `processing` : `done`"
                    v-if="totalInstallers > 0" :total="totalInstallers" :prog="progInstaller">
                    <span class="text-subtitle-1">{{ t('p-3') }}</span>
                </ProgressItem>
            </DownloadProgressView>
        </template>
        <template #btn>
            <v-btn color="primary" variant="outlined" @click="onDownloadComplete" append-icon="mdi-arrow-right"
                class="border-primary-md" :disabled="state != 4">
                {{ t('next') }}
            </v-btn>
        </template>
    </Wizard>
    <Wizard v-else>
        <template #main>
            <v-card class="pa-0 ma-0 elevation-0 h-100" color="background" style="overflow-y: auto;">
                <v-card-title class="pl-0 pt-0 pr-0 mb-2">{{ t('mod-check') }}</v-card-title>
                <v-card-text class="pl-0 pr-0 pb-0 pt-0">
                    <div class="d-flex align-center justify-space-between mb-4">
                        <v-btn-toggle v-model="selectedFilter" color="primary" variant="outlined" density="compact"
                            mandatory>
                            <v-btn v-for="filter in filters" :key="filter.value" :value="filter.value" size="small">
                                {{ filter.label }}
                            </v-btn>
                        </v-btn-toggle>

                        <v-btn color="secondary" variant="outlined" size="small" prepend-icon="mdi-check-all"
                            @click="selectAllRecommended">
                            {{ t('recommended-mods') }}
                        </v-btn>
                    </div>
                </v-card-text>

                <v-divider></v-divider>

                <v-card-text class="mt-2 pt-0 pl-0 pr-0">
                    <Checkboxes v-model="selectedItems" :items="filteredItems" @update:selectedOptions="onChangeOptions"
                        card-style>
                        <template #item="{ item }">
                            <div class="d-flex align-center flex-wrap">
                                <span class="text-body-1 mr-2">{{ item.name }}</span>
                                <v-chip 
                                    v-if="item.version" 
                                    size="x-small" 
                                    label 
                                    variant="outlined"
                                    class="mr-1 mb-1 rounded-pill" 
                                    color="on-background" 
                                    text-color="on-background"
                                >
                                    {{ item.version }}
                                </v-chip>
                                <div v-if="item.traits && item.traits.length > 0"
                                    class="d-flex align-center flex-wrap ml-2">
                                    <v-chip v-for="trait in item.traits" :key="trait" :color="getTraitColor(trait)"
                                        size="x-small" label class="mr-1 mb-1"
                                        :class="{ 'font-weight-bold': trait === 'recommended' }">
                                        {{ getTraitDisplayName(trait) }}
                                    </v-chip>
                                </div>
                            </div>
                        </template>
                        <template #description="{ item }">
                            <div v-if="item.description" class="text-caption text-medium-emphasis">
                                {{ translatedDescriptions[item.id] || item.description }}
                            </div>
                        </template>
                    </Checkboxes>
                </v-card-text>
            </v-card>
        </template>
        <template #btn>
            <v-btn color="secondary" variant="outlined" @click="updateMods" prepend-icon="mdi-update"
                class="border-secondary-md" :loading="isUpdating">
                {{ t('update-mods') }}
            </v-btn>
            <v-btn color="primary" variant="outlined" @click="handleDownload" prepend-icon="mdi-tray-arrow-down"
                class="border-primary-md">
                {{ t('download') }}
            </v-btn>
        </template>
    </Wizard>
    
    <Toast v-model="showToast" :message="toastMessage" :type="toastType" position="fixed" />
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { ref, computed, onMounted, watch } from 'vue';
import { useTheme } from 'vuetify';
import Checkboxes from '../../components/Checkboxes.vue';
import LoadingOverlay from '../../components/LoadingOverlay.vue';
import ProgressItem from '../../components/ProgressItem.vue';
import Wizard from '../../layouts/Wizard.vue';
import DownloadProgressView from '../../components/DownloadProgressView.vue';
import Toast from '../../components/Toast.vue';
import { useModsComposable } from '../../../composables/Mods';
import { useInstanceStore } from '../../../composables/Stores';

const { t } = useI18n();
const theme = useTheme();

// Mods Composable
const {
    isLoading,
    isDownloading,
    selectedItems,
    translatedDescriptions,
    selectedFilter,
    filters,
    fetchMods,
    filteredItems,
    onChangeOptions,
    startDownload,
    percent,
    state,
    selectAllRecommended,
    updateModsFolder,
} = useModsComposable();

// Progress tracking
const totalZips = ref(0);
const totalInstallers = ref(0);
const progZip = ref(0);
const progInstaller = ref(0);
const error = ref(false);
const isUpdating = ref(false);

// Toast state
const showToast = ref(false);
const toastMessage = ref('');
const toastType = ref<'error' | 'success'>('error');

// Instance store
const instanceStore = useInstanceStore();

// Methods
const retry = async () => {
    error.value = false;
    await fetchMods();
};

const onDownloadComplete = () => {
    // ダウンロード完了後の処理
    console.log('Download completed');
};

const handleDownload = async () => {
    // インスタンスストアからパスを取得
    const launcherRoot = instanceStore.getLauncherRoot();
    const instanceName = instanceStore.getInstanceName();
    
    if (!launcherRoot || !instanceName) {
        showToastMessage('error', t('instance-path-not-set'));
        return;
    }
    
    // 元のstartDownload関数を呼び出し
    startDownload((type: string, message?: string) => {
        if (type === 'error' && message) {
            showToastMessage('error', message);
        }
    });
};

const updateMods = async () => {
    isUpdating.value = true;
    try {
        // インスタンスストアからパスを取得
        const launcherRoot = instanceStore.getLauncherRoot();
        const instanceName = instanceStore.getInstanceName();
        
        if (!launcherRoot || !instanceName) {
            showToastMessage('error', t('instance-path-not-set'));
            return;
        }
        
        // modsフォルダのパスを構築
        const modsDir = `${launcherRoot}/instances/${instanceName}/.minecraft/mods`;
        
        // modsフォルダの存在確認
        try {
            await window.bafv4.listFiles(modsDir);
        } catch (error) {
            showToastMessage('error', t('mods-folder-not-found'));
            return;
        }
        
        // モッド更新を実行
        await updateModsFolder(modsDir);
        showToastMessage('success', t('mods-updated-successfully'));
        
    } catch (error: any) {
        console.error('Mod update error:', error);
        showToastMessage('error', error.message || t('mods-update-failed'));
    } finally {
        isUpdating.value = false;
    }
};

// Toast functionality
const showToastMessage = (type: 'error' | 'success', message: string) => {
    toastMessage.value = message;
    toastType.value = type;
    showToast.value = true;
};

// Trait colors
const traitColors = computed<Record<string, string>>(() => {
    const isDark = theme.global.current.value.dark;
    return {
        'recommended': isDark ? 'success-lighten-4' : 'success-darken-1',
        'rsg-only': isDark ? 'primary-lighten-4' : 'primary-darken-1',
        'ssg-only': isDark ? 'purple-lighten-4' : 'purple-darken-1',
        'accessibility': isDark ? 'teal-lighten-4' : 'teal-darken-1',
        'ranked': isDark ? 'light-green-lighten-4' : 'light-green-darken-2',
    };
});

const getTraitColor = (trait: string): string => {
    return traitColors.value[trait] || 'grey-lighten-2';
};

const getTraitDisplayName = (trait: string): string => {
    const translations: Record<string, string> = {
        'recommended': t('recommended'),
        'rsg-only': t('rsg-only'),
        'ssg-only': t('ssg-only'),
        'accessibility': t('accessibility'),
        'ranked': 'MCSR Ranked',
    };
    return translations[trait] || trait;
};

// Initialize
onMounted(() => {
    fetchMods();
});

// Watch for changes in selectedFilter
watch(selectedFilter, () => {
    selectedItems.value = [];
});
</script>