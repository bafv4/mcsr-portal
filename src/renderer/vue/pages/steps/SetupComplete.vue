<template>
    <v-main>
        <v-container class="fill-height d-flex justify-center align-center">
            <v-card class="pa-4" width="100%" max-width="500px" elevation="2">
                <div class="d-flex align-center mb-4">
                    <v-icon size="x-large" color="success" class="mr-3">mdi-check-decagram</v-icon>
                    <h1 class="text-h5 font-weight-bold">{{ t('setup-complete-t') }}</h1>
                </div>
                <v-card-text class="pa-0">
                    <p class="text-body-1">{{ t('setup-complete-s1') }}</p>
                    <p class="text-body-1 mt-4">{{ t('setup-complete-s2') }}</p>
                </v-card-text>
                <v-card-actions class="pa-0 mt-6 d-flex flex-column gap-3">
                    <v-btn
                        color="primary"
                        variant="outlined"
                        @click="goToTools"
                        prepend-icon="mdi-tools"
                        class="border-primary-md"
                        block
                    >
                        {{ t('go-to-tools') }}
                    </v-btn>
                    <v-btn
                        color="secondary"
                        variant="outlined"
                        @click="goHome"
                        prepend-icon="mdi-home"
                        class="border-secondary-md"
                        block
                    >
                        {{ t('home') }}
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-container>
    </v-main>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useDirStore, useResourcesStore, useModsStore, useInstanceStore } from '../../../composables/Stores';

const { t } = useI18n();
const router = useRouter();

// ストアのインスタンスを取得
const dirStore = useDirStore();
const resourcesStore = useResourcesStore();
const modsStore = useModsStore();
const instanceStore = useInstanceStore();

// ツール画面に遷移（ストアの情報は保持）
const goToTools = () => {
    router.push({ path: '/tools/' });
};

// ホームに戻る（ストアの情報を削除）
const goHome = () => {
    // すべてのストアをリセット
    dirStore.$reset();
    resourcesStore.$reset();
    modsStore.$reset();
    instanceStore.$reset();
    
    router.push({ path: '/' });
};
</script>