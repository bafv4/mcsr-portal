<template>
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
        <v-btn class="text-caption" density="comfortable" prepend-icon="mdi-github" @click="openRepo">Repo</v-btn>
        <v-btn class="text-caption" density="comfortable" prepend-icon="mdi-update" @click="checkForUpdates">
            Check for Updates</v-btn>
    </v-card-actions>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
const { t } = useI18n();
import pkg from '../../../../package.json';
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