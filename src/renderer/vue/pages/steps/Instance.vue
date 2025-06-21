<template>
    <Wizard>
        <template #main>
            <v-card-title class="pl-0 pt-0 pr-0">{{ t('instance-t') }}</v-card-title>
            <v-card-text class="pl-0 pr-0">
                <p>{{ t('instance-s1') }}</p>
                <p>{{ t('instance-s2') }}</p>
            </v-card-text>

            <!-- ランチャーのルートフォルダ選択 -->
            <v-card-subtitle class="pl-0 pr-0 pt-4">{{ t('launcher-root') }}</v-card-subtitle>
            <v-card-text class="pl-0 pr-0">
                <p>{{ t('launcher-root-s1') }}</p>
            </v-card-text>
            <DirInput @select="handleLauncherRootSelect" :init="selectedLauncherRoot" />

            <!-- インスタンス名 -->
            <v-card-subtitle class="pl-0 pr-0 pt-4">{{ t('instance-name') }}</v-card-subtitle>
            <v-card-text class="pl-0 pr-0">
                <p>{{ t('instance-name-s1') }}</p>
            </v-card-text>
            <v-text-field
                v-model="instanceName"
                :placeholder="placeholderInstanceName"
                variant="outlined"
                density="comfortable"
                class="mb-4"
                hide-details
            />

            <!-- メモリ設定 -->
            <v-card-subtitle class="pl-0 pr-0 pt-4">{{ t('memory-settings') }}</v-card-subtitle>
            <v-row class="mt-2">
                <v-col cols="6">
                    <v-text-field
                        v-model.number="memoryMin"
                        :label="t('memory-min')"
                        type="number"
                        variant="outlined"
                        density="comfortable"
                        min="1024"
                        max="32768"
                        hide-details
                    />
                </v-col>
                <v-col cols="6">
                    <v-text-field
                        v-model.number="memoryMax"
                        :label="t('memory-max')"
                        type="number"
                        variant="outlined"
                        density="comfortable"
                        min="1024"
                        max="32768"
                        hide-details
                    />
                </v-col>
            </v-row>

            <!-- Fabric Loader設定 -->
            <v-card-subtitle class="pl-0 pr-0 pt-4">{{ t('fabric-loader') }}</v-card-subtitle>
            <v-card-text class="pl-0 pr-0">
                <p>{{ t('fabric-loader-s1') }}</p>
                <v-checkbox
                    v-model="useFabric"
                    :label="t('use-fabric')"
                    class="mb-2"
                    hide-details
                />
                <v-progress-linear v-if="loadingVersions" indeterminate color="primary" class="mb-4"></v-progress-linear>
                <Selector
                    v-else-if="useFabric"
                    :options="fabricVersionOptions"
                    :model-value="selectedFabricVersion"
                    :label="t('fabric-version')"
                    @change="onFabricVersionChange"
                    class="mb-4"
                />
            </v-card-text>

            <!-- Java引数 -->
            <v-card-subtitle class="pl-0 pr-0 pt-4">{{ t('java-args') }}</v-card-subtitle>
            <v-card-text class="pl-0 pr-0">
                <p>{{ t('java-args-s1') }}</p>
            </v-card-text>
            <v-textarea
                v-model="javaArgs"
                :placeholder="t('java-args-placeholder')"
                variant="outlined"
                density="comfortable"
                rows="3"
                class="mb-4"
                hide-details
                spellcheck="false"
            />
        </template>
        <template #btn>
            <v-btn variant="plain" class="mr-auto" prepend-icon="mdi-cancel" :elevation="0" color="error"
                @click="$emit('cancel')">
                {{ t('cancel') }}
            </v-btn>
            <v-btn color="secondary" variant="text" @click="$emit('back')">
                {{ t('back') }}
            </v-btn>
            <v-btn color="primary" variant="outlined" @click="checkOrNext" append-icon="mdi-arrow-right"
                class="border-primary-md" :loading="creating">
                {{ t('next') }}
            </v-btn>
        </template>
    </Wizard>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import DirInput from '../../components/DirInput.vue';
import Wizard from '../../components/Wizard.vue';
import Selector from '../../components/Selector.vue';
import { useInstanceStore } from '../../../composables/Stores';
import type { Option } from '../../../../env';

const { t } = useI18n();
const instanceStore = useInstanceStore();

const placeholderInstanceName = 'MCSR-1.16.1';

// フォームデータ
const selectedLauncherRoot = computed(() => instanceStore.getLauncherRoot());
const instanceName = ref(instanceStore.getInstanceName());
const memoryMin = ref(instanceStore.memoryMin);
const memoryMax = ref(instanceStore.memoryMax);
const useFabric = ref(instanceStore.useFabric);
const fabricVersion = ref(instanceStore.fabricVersion);
const javaArgs = ref(instanceStore.javaArgs);
const creating = ref(false);
const loadingVersions = ref(false);

// Fabric Loaderのバージョン一覧（Option型）
const fabricVersionOptions = ref<Option[]>([]);

const selectedFabricVersion = computed(() => {
    if (fabricVersionOptions.value.length === 0) {
        return { id: fabricVersion.value, name: fabricVersion.value, url: '' };
    }
    return fabricVersionOptions.value.find(opt => opt.id === fabricVersion.value) || fabricVersionOptions.value[0];
});

const onFabricVersionChange = (option: Option) => {
    fabricVersion.value = option.id;
};

const emit = defineEmits<{
    error: [msg: string],
    next: [],
    back: [],
    cancel: []
}>();

const fetchFabricVersions = async () => {
    loadingVersions.value = true;
    const fallbackOptions: Option[] = [
        { id: '0.16.14', name: `0.16.14 (${t('latest-badge')})`, url: '' },
        { id: '0.16.13', name: '0.16.13', url: '' },
        { id: '0.15.11', name: '0.15.11', url: '' },
    ];
    try {
        const { data } = await axios.get<any[]>('https://meta.fabricmc.net/v2/versions/loader');
        const loaders = data.filter((v: any) => v.stable === true);

        if (loaders.length > 0) {
            const newOptions: Option[] = [];
            const addedIds = new Set<string>();

            const addOption = (version: string, isLatest = false) => {
                if (!addedIds.has(version)) {
                    const name = isLatest ? `${version} (${t('latest-badge')})` : version;
                    newOptions.push({ id: version, name: name, url: '' });
                    addedIds.add(version);
                }
            };

            // 1. 最新バージョン
            const latest = loaders[0];
            addOption(latest.version, true);

            // 2. 1つ前のバージョン
            if (loaders.length > 1) {
                const previous = loaders[1];
                addOption(previous.version);
            }

            // 3. 1つ前のメジャーバージョンの最新版
            const latestMajor = parseInt(latest.version.split('.')[1]);
            if (latestMajor > 0) {
                const prevMajor = latestMajor - 1;
                const prevMajorVersionPattern = `0.${prevMajor}.`;
                
                const latestOfPrevMajor = loaders.find((v: any) => v.version.startsWith(prevMajorVersionPattern));

                if (latestOfPrevMajor) {
                    addOption(latestOfPrevMajor.version);
                }
            }

            fabricVersionOptions.value = newOptions;

            if (!instanceStore.fabricVersion || !newOptions.some(opt => opt.id === instanceStore.fabricVersion)) {
                fabricVersion.value = latest.version;
                instanceStore.setFabricVersion(latest.version);
            }
        } else {
            fabricVersionOptions.value = fallbackOptions;
        }
    } catch (e) {
        console.error("Failed to fetch Fabric versions:", e);
        emit('error', t('fabric-version-fetch-err'));
        fabricVersionOptions.value = fallbackOptions;
    } finally {
        loadingVersions.value = false;
    }
};

// ランチャーのルートフォルダ選択
const handleLauncherRootSelect = (path: string) => {
    instanceStore.setLauncherRoot(path);
};

// 初期化時にPrism Launcherの確認とバージョン取得
onMounted(async () => {
    fetchFabricVersions();
    if (!selectedLauncherRoot.value) {
        const prismPath = await window.bafv4.checkPrismLauncher();
        if (prismPath) {
            instanceStore.setLauncherRoot(prismPath);
        }
    }
});

// バリデーションとインスタンス作成
const checkOrNext = async () => {
    // バリデーション
    if (!selectedLauncherRoot.value) {
        emit('error', t('launcher-root-err'));
        return;
    }

    const finalInstanceName = instanceName.value.trim() || placeholderInstanceName;

    if (memoryMin.value < 1024 || memoryMax.value < 1024 || memoryMin.value > memoryMax.value) {
        emit('error', t('memory-err'));
        return;
    }

    if (useFabric.value && !fabricVersion.value) {
        emit('error', t('fabric-version-err'));
        return;
    }

    // ストアに保存
    instanceStore.setInstanceName(finalInstanceName);
    instanceStore.setMemory(memoryMin.value, memoryMax.value);
    instanceStore.setUseFabric(useFabric.value);
    instanceStore.setFabricVersion(fabricVersion.value);
    instanceStore.setJavaArgs(javaArgs.value);

    // インスタンス作成
    creating.value = true;
    try {
        const result = await window.bafv4.createInstance({
            launcherRoot: selectedLauncherRoot.value,
            instanceName: finalInstanceName,
            memoryMin: memoryMin.value,
            memoryMax: memoryMax.value,
            useFabric: useFabric.value,
            fabricVersion: fabricVersion.value,
            javaArgs: javaArgs.value
        });

        if (result.success) {
            emit('next');
        } else {
            emit('error', result.error || t('instance-creation-err'));
        }
    } catch (error: any) {
        emit('error', error.message || t('instance-creation-err'));
    } finally {
        creating.value = false;
    }
};
</script>

<style scoped>
</style>
