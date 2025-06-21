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
                        <div class="d-flex align-center flex-wrap">
                            <span class="text-body-1 mr-2">{{ item.name }}</span>
                            <v-chip v-if="item.version" size="x-small" label class="mr-1 mb-1" rounded="pill" color="grey-lighten-3" text-color="grey-darken-2">{{ item.version }}</v-chip>
                            <div v-if="item.traits && item.traits.length > 0" class="d-flex align-center flex-wrap ml-2">
                                <v-chip
                                    v-for="trait in item.traits"
                                    :key="trait"
                                    :color="getTraitColor(trait)"
                                    size="x-small"
                                    label
                                    class="mr-1 mb-1"
                                    :class="{ 'font-weight-bold': trait === 'recommended' }"
                                >
                                    {{ getTraitDisplayName(trait) }}
                                </v-chip>
                            </div>
                        </div>
                    </template>
                    <template #description="{ item }">
                        <div v-if="item.description" class="text-caption text-medium-emphasis mt-2" style="line-height: 1.4; overflow-wrap: break-word;">
                            {{ translatedDescriptions[item.id] || item.description }}
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

const traitColors: Record<string, string> = {
    'recommended': 'success-lighten-4',
    'required': 'error-lighten-4',
    'optional': 'info-lighten-4',
    'performance': 'warning-lighten-4',
    'visual': 'secondary-lighten-4',
    'rsg-only': 'primary-lighten-4',
    'ssg-only': 'purple-lighten-4',
    'accessibility': 'teal-lighten-4',
};

const getTraitColor = (trait: string): string => {
    if (traitColors[trait]) {
        return traitColors[trait];
    }
    // Simple hash function to get a color from a limited palette
    let hash = 0;
    for (let i = 0; i < trait.length; i++) {
        hash = trait.charCodeAt(i) + ((hash << 5) - hash);
    }
    const colors = ['info-lighten-4', 'warning-lighten-4', 'error-lighten-4', 'secondary-lighten-4'];
    const index = Math.abs(hash % colors.length);
    return colors[index];
};

const getTraitDisplayName = (trait: string): string => {
    const traitTranslations: Record<string, string> = {
        'recommended': t('recommended'),
        'rsg-only': t('rsg-only'),
        'ssg-only': t('ssg-only'),
        'accessibility': t('accessibility')
    };
    
    return traitTranslations[trait] || trait;
};

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
        
        // デバッグ用：最初の数個のモッドの構造を確認
        console.log('APIレスポンスの最初の3つのモッド:', allMods.slice(0, 3));
        
        // 推奨モッドの識別方法を調査
        const recommendedMods = allMods.filter((mod: any) => {
            // mac-onlyのモッドは除外
            if (mod.traits && mod.traits.includes('mac-only')) {
                return false;
            }
            
            return mod.recommended !== false && (
                mod.recommended === true || 
                mod.recommended === 'true' || 
                mod.recommended === 1 ||
                mod.recommended === undefined ||
                mod.recommended === null ||
                (mod.traits && mod.traits.includes('recommended')) ||
                (mod.tags && mod.tags.includes('recommended'))
            );
        });
        console.log('推奨モッド候補:', recommendedMods.map((m: any) => ({ name: m.name, modid: m.modid, recommended: m.recommended, traits: m.traits })));
        
        availableItems.value = allMods
            .map((mod: any): Item | null => {
                const versionInfo = mod.versions.find((v: any) => v.target_version.includes('1.16.1'));
                if (!versionInfo) return null;

                // 推奨モッドの識別を修正
                const traits: string[] = [];
                
                // mac-onlyのモッドは除外
                if (mod.traits && mod.traits.includes('mac-only')) {
                    return null;
                }
                
                // accessibilityのモッドは推奨にしない
                const isAccessibility = mod.traits && mod.traits.includes('accessibility');
                
                // 推奨モッドの識別（recommended: falseでないものが推奨、ただしaccessibilityは除く）
                const isRecommended = !isAccessibility && (
                    mod.recommended === true || 
                    mod.recommended === 'true' || 
                    mod.recommended === 1 ||
                    mod.recommended === undefined ||  // recommendedプロパティが存在しない場合
                    mod.recommended === null ||       // recommendedプロパティがnullの場合
                    (mod.traits && mod.traits.includes('recommended')) ||
                    (mod.tags && mod.tags.includes('recommended'))
                );
                
                if (isRecommended) {
                    traits.push('recommended');
                    console.log(`推奨モッドを識別: ${mod.name} (${mod.modid}) - recommended = ${mod.recommended}`);
                }
                
                // 既存のtraitsがある場合は追加（mac-onlyとaccessibilityは特別処理）
                if (mod.traits && Array.isArray(mod.traits)) {
                    const filteredTraits = mod.traits.filter((trait: string) => 
                        trait !== 'mac-only' && trait !== 'accessibility'
                    );
                    traits.push(...filteredTraits);
                }
                
                // accessibilityは最後に追加
                if (isAccessibility) {
                    traits.push('accessibility');
                }
                
                // デバッグ用：各モッドのプロパティを確認
                console.log(`モッド ${mod.name}: recommended = ${mod.recommended}, isRecommended = ${isRecommended}, traits = ${traits.join(', ')}`);

                return {
                    id: mod.modid,
                    name: mod.name,
                    description: mod.description,
                    version: versionInfo.version,
                    traits: traits,
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