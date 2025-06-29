<template>
    <v-toolbar fixed density="comfortable" class="pr-4 pl-4" :title="`MCSR Portal - ${t('home')}`" :elevation="4"
        color="background">
        <template v-slot:append>
            <v-btn density="comfortable" class="text-sm-button" icon="mdi-information-slab-circle-outline"
                @click="info = true"></v-btn>
        </template>
    </v-toolbar>

    <v-main>
        <v-container class="pa-4 d-flex ga-4 flex-column align-self-center">
            <v-card class="w-100 pa-1">
                <v-card-title>{{ t('setup') }}</v-card-title>

                <v-card-text>
                    <p>{{ t('home-setup-s1') }}</p>
                    <p>{{ t('home-setup-s2') }}</p>
                    <p>{{ t('home-setup-s3') }}</p>
                </v-card-text>

                <v-card-actions>
                    <v-btn size="large" class="font-weight-bold" color="primary" variant="outlined"
                        append-icon="mdi-arrow-right" :elevation="2" to="/setup/" block>{{
                            t('setup') }}</v-btn>
                </v-card-actions>
            </v-card>

            <v-card class="w-100 pa-1">
                <v-card-title>{{ t('tools') }}</v-card-title>

                <v-card-text>
                    <p>{{ t('home-tools-s1') }}</p>
                </v-card-text>

                <v-card-actions>
                    <v-btn size="large" class="font-weight-bold" color="secondary" variant="outlined"
                        prepend-icon="mdi-pickaxe" :elevation="2" block to="/instance-tools/">{{ 
                            t('tools') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-container>
    </v-main>

    <v-dialog v-model="info" max-width="420">
        <v-card class="position-relative rounded-lg">
            <v-btn :ripple="false" density="comfortable" variant="plain"
                class="text-sm-button position-absolute info-close" icon="mdi-close" color="error"
                @click="info = false" />

            <v-card-title class="pb-4 pl-6 pt-6">MCSR Portal v{{ pkg.version }}</v-card-title>
            <v-card-text class="pt-0 pb-0">
                <table class="info-table">
                    <tbody>
                        <tr>
                            <th>Electron</th>
                            <td>{{ pkg.devDependencies.electron.replace('^', '') }}</td>
                        </tr>
                        <tr>
                            <th>Vue</th>
                            <td>{{ pkg.devDependencies.vue.replace('^', '') }}</td>
                        </tr>
                        <tr>
                            <th>Vite</th>
                            <td>{{ pkg.devDependencies.vite.replace('^', '') }}</td>
                        </tr>
                        <tr>
                            <th>{{ t('author') }}</th>
                            <td>baf</td>
                        </tr>
                    </tbody>
                </table>

            </v-card-text>

            <v-card-actions class="justify-start px-4 py-5 ga-4">
                <v-btn class="text-caption" density="comfortable" prepend-icon="mdi-github"
                    @click="openRepo">Repo</v-btn>
                <v-btn class="text-caption" density="comfortable" prepend-icon="mdi-update" @click="checkForUpdates">
                    Check for Updates</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import pkg from '../../../../package.json';

const info = ref(false);
const openRepo = () => {
    window.bafv4.openExternal('https://github.com/bafv4/mcsr-portal');
};

const checkForUpdates = async () => {
    try {
        const result = await window.bafv4.checkForUpdates();
        if (result.success && result.hasUpdate) {
            const performUpdate = await window.bafv4.performUpdate();
            if (!performUpdate.success) {
                // エラーハンドリング
            }
        } else if (result.success && !result.hasUpdate) {
            // アップデートがない場合のメッセージを表示
            alert('最新版です。');
        } else {
            // エラーハンドリング
        }
    } catch (error) {
        // エラーハンドリング
    }
};
</script>

<style scoped>
.info-close {
    top: 1rem;
    right: 1rem;
}

.info-table tr {
    margin: .25em;
    height: 1.5rem;
}

.info-table td {
    padding: .15em;
}

.info-table th {
    text-align: left;
    padding: .15em;
    padding-right: 1.5rem;
    width: max-content;
}
</style>