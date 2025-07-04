<template>
    <Wizard>
        <template #main>
            <v-card-title class="pl-0 pt-0 pr-0">{{ t('instance-t') }}</v-card-title>
            <v-card-text class="pl-0 pr-0">
                <p>{{ t('instance-s1') }}</p>
            </v-card-text>

            <!-- ランチャーのルートフォルダ選択 -->
            <v-card-subtitle class="pl-0 pr-0 pt-2 pb-2">{{ t('launcher-root') }}</v-card-subtitle>
            <DirInput @select="handleLauncherRootSelect" :init="selectedLauncherRoot" />
            <v-card-text class="pl-0 pr-0">
                <p>{{ t('launcher-root-s1') }}</p>
            </v-card-text>

            <!-- インスタンス名 -->
            <v-card-subtitle class="pl-0 pr-0 pt-4">{{ t('instance-name') }}</v-card-subtitle>
            <v-text-field
                v-model="instanceName"
                :placeholder="placeholderInstanceName"
                class="mb-2 mt-2"
                hide-details
            />

            <!-- インスタンスグループ -->
            <v-card-subtitle class="pl-0 pr-0 pt-4">{{ t('instance-group') }}</v-card-subtitle>
            
            <v-card-text class="pl-0 pr-0 pb-2">
                <v-combobox
                    :model-value="groupInput || null"
                    :items="availableGroups"
                    :label="t('instance-group-select')"
                    class="mb-4"
                    hide-details
                    :loading="loadingGroups"
                    clearable
                    :placeholder="t('instance-group-name-placeholder')"
                    :menu-props="{ maxHeight: 200 }"
                    :filter="() => true"
                    @update:model-value="onGroupInputChange"
                />
                <v-card-text class="pl-0 pr-0 pa-0 text-caption text-medium-emphasis">
                    <p v-if="groupInput && !isExistingGroup(groupInput) && groupInput.trim()">
                        {{ t('instance-group-new') }}: "{{ groupInput }}"
                    </p>
                    <p v-else-if="groupInput && isExistingGroup(groupInput)">
                        {{ t('instance-group-select') }}: "{{ groupInput }}"
                    </p>
                    <p v-else>
                        {{ t('instance-group-no-group') }}
                    </p>
                </v-card-text>
            </v-card-text>

            <!-- メモリ設定 -->
            <v-card-subtitle class="pl-0 pr-0 pt-4">{{ t('memory-settings') }}</v-card-subtitle>
            <v-row class="mt-2 pa-0">
                <v-col cols="12" md="6">
                    <v-text-field
                        v-model.number="memoryMin"
                        :label="t('memory-min')"
                        type="number"
                        min="1024"
                        max="32768"
                        step="128"
                        hide-details
                    />
                </v-col>
                <v-col cols="12" md="6">
                    <v-text-field
                        v-model.number="memoryMax"
                        :label="t('memory-max')"
                        type="number"
                        min="1024"
                        max="32768"
                        step="128"
                        hide-details
                    />
                </v-col>
            </v-row>

            <!-- Java Path -->
            <v-card-subtitle class="pl-0 pr-0 pt-4">{{ t('instance-java-path') }}</v-card-subtitle>
            <v-card-text class="pl-0 pr-0">
                <p>{{ t('instance-java-path-desc') }}</p>
            </v-card-text>
            <DirInput @select="handleJavaPathSelect" :init="javaPath" file :placeholder="t('instance-java-path-placeholder')" />

            <!-- Java引数 -->
            <v-card-subtitle class="pl-0 pr-0 pt-4">{{ t('java-args') }}</v-card-subtitle>
            <v-textarea
                v-model="javaArgs"
                rows="3"
                class="mb-2 mt-2"
                hide-details
                spellcheck="false"
            />

            <!-- Fabric Loader設定 -->
            <div class="d-flex align-center pt-4">
                <v-card-subtitle class="pl-0 pr-0 py-0">{{ t('fabric-loader') }}</v-card-subtitle>
                <v-chip
                    v-if="fabricVersion && !loadingVersions"
                    color="primary"
                    variant="tonal"
                    size="small"
                    class="ml-2"
                >
                    {{ fabricVersion }} ({{ t('latest-badge') }})
                </v-chip>
            </div>
            <v-card-text class="pl-0 pr-0">
                <v-switch
                    v-model="useFabric"
                    :label="t('use-fabric')"
                    color="primary"
                    hide-details
                />
                <v-progress-linear v-if="loadingVersions" indeterminate color="primary" class="my-4" />
            </v-card-text>
        </template>
        <template #btn>
            <v-btn variant="plain" class="mr-auto" prepend-icon="mdi-arrow-left" :elevation="0" color="secondary" @click="$emit('back')">
                {{ t('back') }}
            </v-btn>
            <v-btn color="primary" variant="outlined" @click="checkOrNext" append-icon="mdi-folder-plus"
                class="border-primary-md" :loading="creating">
                {{ t('create') }}
            </v-btn>
        </template>
    </Wizard>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import DirInput from '../../components/DirInput.vue';
import Wizard from '../../layouts/Wizard.vue';
import { useInstanceStore, useDirStore } from '../../../composables/Stores';

const { t } = useI18n();
const instanceStore = useInstanceStore();
const dirStore = useDirStore();

// パスをスラッシュ区切りに変換するヘルパー
const toSlash = (path: string) => path.replace(/\\/g, '/');

const placeholderInstanceName = 'MCSR-1.16.1';

// フォームデータ
const selectedLauncherRoot = computed(() => instanceStore.getLauncherRoot());
const instanceName = ref(instanceStore.getInstanceName());
const memoryMin = ref(instanceStore.memoryMin);
const memoryMax = ref(instanceStore.memoryMax);
const useFabric = ref(instanceStore.useFabric);
const fabricVersion = ref(instanceStore.fabricVersion);
const javaArgs = ref(instanceStore.javaArgs);
const javaPath = ref(instanceStore.javaPath);
const creating = ref(false);
const loadingVersions = ref(false);

// グループ関連
const groupInput = ref<string | null>(null);
const availableGroups = ref<string[]>([]);
const loadingGroups = ref(false);

const emit = defineEmits<{
    error: [msg: string],
    next: [],
    back: [],
    cancel: [],
    complete: []
}>();

const fetchFabricVersions = async () => {
    loadingVersions.value = true;
    try {
        const { data } = await axios.get<any[]>('https://meta.fabricmc.net/v2/versions/loader', {
            timeout: 10000,
            headers: {
                'Accept': 'application/json'
            }
        });
        
        if (!Array.isArray(data)) {
            throw new Error('Invalid response format from Fabric API');
        }

        const stableLoaders = data.filter((v: any) => {
            return v && v.stable === true && v.version;
        });

        if (stableLoaders.length > 0) {
            // Use the latest stable version
            const latestVersion = stableLoaders[0].version;
            fabricVersion.value = latestVersion;
            instanceStore.setFabricVersion(latestVersion);
        } else {
            // Fallback to hardcoded version
            const fallbackVersion = '0.14.24';
            fabricVersion.value = fallbackVersion;
            instanceStore.setFabricVersion(fallbackVersion);
        }
    } catch (e: any) {
        // Fallback to hardcoded version
        const fallbackVersion = '0.14.24';
        fabricVersion.value = fallbackVersion;
        instanceStore.setFabricVersion(fallbackVersion);
    } finally {
        loadingVersions.value = false;
    }
};

const handleLauncherRootSelect = (path: string) => {
    instanceStore.setLauncherRoot(toSlash(path));
};

const handleJavaPathSelect = (path: string) => {
    javaPath.value = toSlash(path);
};

// グループ一覧を取得
const fetchGroups = async () => {
    if (!selectedLauncherRoot.value) {
        console.log('No launcher root selected');
        return;
    }
    
    loadingGroups.value = true;
    try {
        console.log('Fetching groups for:', selectedLauncherRoot.value);
        const result = await window.bafv4.getInstanceGroups(selectedLauncherRoot.value);
        console.log('Groups API result:', result);
        
        if (result.success && result.groups && result.groups.groups) {
            availableGroups.value = Object.keys(result.groups.groups);
            console.log('Available groups:', availableGroups.value);
        } else {
            availableGroups.value = [];
            console.log('No groups found or invalid response');
        }
    } catch (error) {
        console.error('Error fetching groups:', error);
        availableGroups.value = [];
    } finally {
        loadingGroups.value = false;
    }
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
    // Set default java path if graalvm is downloaded
    if (!javaPath.value && dirStore.graalvm) {
        javaPath.value = toSlash(`${dirStore.graalvm}/bin/javaw.exe`);
    }
    
    // グループ一覧を取得
    await fetchGroups();
});

// ランチャールートが変更されたらグループ一覧を再読み込み
watch(selectedLauncherRoot, async (newRoot, oldRoot) => {
    if (newRoot && newRoot !== oldRoot) {
        // グループ入力をクリア
        groupInput.value = null;
        // グループ一覧を再読み込み
        await fetchGroups();
    }
});

// バリデーションとインスタンス作成
const checkOrNext = async () => {
    // バリデーション
    if (!selectedLauncherRoot.value) {
        emit('error', t('launcher-root-err'));
        return;
    }

    // Javaパスのバリデーション
    if (!javaPath.value || javaPath.value.trim() === '') {
        emit('error', t('java-path-required'));
        return;
    }

    // Fabricローダーのバリデーション
    if (useFabric.value && (!fabricVersion.value || fabricVersion.value.trim() === '')) {
        emit('error', t('fabric-version-required'));
        return;
    }

    const finalInstanceName = instanceName.value.trim() || placeholderInstanceName;

    if (memoryMin.value < 1024 || memoryMax.value < 1024 || memoryMin.value > memoryMax.value) {
        emit('error', t('memory-err'));
        return;
    }

    // ストアに保存
    instanceStore.setInstanceName(finalInstanceName);
    instanceStore.setMemory(memoryMin.value, memoryMax.value);
    instanceStore.setUseFabric(useFabric.value);
    if (useFabric.value) {
        instanceStore.setFabricVersion(fabricVersion.value);
    }
    instanceStore.setJavaArgs(javaArgs.value);
    instanceStore.setJavaPath(javaPath.value);
    
    // グループ情報をストアに保存
    if (groupInput.value && !isExistingGroup(groupInput.value)) {
        instanceStore.setSelectedGroup('');
        instanceStore.setNewGroupName(groupInput.value);
    } else if (groupInput.value && isExistingGroup(groupInput.value)) {
        instanceStore.setSelectedGroup(groupInput.value);
        instanceStore.setNewGroupName('');
    } else {
        instanceStore.setSelectedGroup('');
        instanceStore.setNewGroupName('');
    }

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
            javaArgs: javaArgs.value,
            javaPath: javaPath.value,
            selectedGroup: groupInput.value && isExistingGroup(groupInput.value) ? groupInput.value : '',
            newGroupName: groupInput.value && !isExistingGroup(groupInput.value) ? groupInput.value : ''
        });

        if (result.success) {
            if (useFabric.value) {
                emit('next');
            } else {
                emit('complete');
            }
        } else {
            emit('error', result.error || t('instance-creation-err'));
        }
    } catch (error: any) {
        emit('error', error.message || t('instance-creation-err'));
    } finally {
        creating.value = false;
    }
};

const isExistingGroup = (group: string) => {
    return availableGroups.value.includes(group);
};

const onGroupInputChange = (value: string | null) => {
    if (value === null || value === undefined || value === '') {
        groupInput.value = null;
    } else {
        groupInput.value = value;
    }
};
</script>

<style scoped>
</style>
