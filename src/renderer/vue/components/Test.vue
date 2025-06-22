<template>
  <v-card class="mx-auto" max-width="600">
    <v-card-title class="text-h5">
      AutoUpdater テスト
    </v-card-title>
    
    <v-card-text>
      <v-alert
        v-if="message"
        :type="messageType"
        :text="message"
        class="mb-4"
      ></v-alert>
      
      <v-list>
        <v-list-item>
          <v-list-item-title>現在のバージョン</v-list-item-title>
          <v-list-item-subtitle>{{ currentVersion }}</v-list-item-subtitle>
        </v-list-item>
        
        <v-list-item v-if="latestVersion">
          <v-list-item-title>最新バージョン</v-list-item-title>
          <v-list-item-subtitle>{{ latestVersion }}</v-list-item-subtitle>
        </v-list-item>
        
        <v-list-item v-if="hasUpdate !== null">
          <v-list-item-title>更新の有無</v-list-item-title>
          <v-list-item-subtitle>
            <v-chip
              :color="hasUpdate ? 'success' : 'info'"
              size="small"
            >
              {{ hasUpdate ? '更新あり' : '更新なし' }}
            </v-chip>
          </v-list-item-subtitle>
        </v-list-item>
      </v-list>
    </v-card-text>
    
    <v-card-actions>
      <v-btn
        color="primary"
        @click="testUpdateFlow"
        :loading="loading"
        :disabled="loading"
      >
        テストフロー実行
      </v-btn>
      
      <v-btn
        color="secondary"
        @click="testGitHubAPI"
        :loading="loading"
        :disabled="loading"
      >
        GitHub API テスト
      </v-btn>
      
      <v-btn
        color="info"
        @click="checkForUpdates"
        :loading="loading"
        :disabled="loading"
      >
        更新チェック
      </v-btn>
      
      <v-btn
        color="warning"
        @click="performUpdate"
        :loading="loading"
        :disabled="loading || !hasUpdate"
      >
        更新実行
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

const currentVersion = ref('');
const latestVersion = ref('');
const hasUpdate = ref<boolean | null>(null);
const loading = ref(false);
const message = ref('');
const messageType = ref<'success' | 'error' | 'info' | 'warning'>('info');

onMounted(async () => {
  // 現在のバージョンを取得
  try {
    const result = await window.bafv4.checkForUpdates();
    if (result.success) {
      hasUpdate.value = result.hasUpdate || false;
      latestVersion.value = result.latestVersion || '';
    }
  } catch (error) {
    console.error('Failed to get current version:', error);
  }
});

const showMessage = (text: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
  message.value = text;
  messageType.value = type;
  setTimeout(() => {
    message.value = '';
  }, 5000);
};

const testUpdateFlow = async () => {
  loading.value = true;
  try {
    const result = await window.bafv4.testUpdateFlow();
    if (result.success) {
      showMessage('テストフローが正常に実行されました', 'success');
    } else {
      showMessage(`テストフローでエラーが発生しました: ${result.error}`, 'error');
    }
  } catch (error) {
    showMessage(`テストフローでエラーが発生しました: ${error}`, 'error');
  } finally {
    loading.value = false;
  }
};

const testGitHubAPI = async () => {
  loading.value = true;
  try {
    const result = await window.bafv4.testGitHubAPI();
    if (result.success) {
      showMessage('GitHub APIテストが正常に実行されました', 'success');
    } else {
      showMessage(`GitHub APIテストでエラーが発生しました: ${result.error}`, 'error');
    }
  } catch (error) {
    showMessage(`GitHub APIテストでエラーが発生しました: ${error}`, 'error');
  } finally {
    loading.value = false;
  }
};

const checkForUpdates = async () => {
  loading.value = true;
  try {
    const result = await window.bafv4.checkForUpdates();
    if (result.success) {
      hasUpdate.value = result.hasUpdate || false;
      latestVersion.value = result.latestVersion || '';
      showMessage(
        result.hasUpdate 
          ? `新しいバージョン ${result.latestVersion} が利用可能です` 
          : '更新はありません',
        result.hasUpdate ? 'info' : 'success'
      );
    } else {
      showMessage(`更新チェックでエラーが発生しました: ${result.error}`, 'error');
    }
  } catch (error) {
    showMessage(`更新チェックでエラーが発生しました: ${error}`, 'error');
  } finally {
    loading.value = false;
  }
};

const performUpdate = async () => {
  loading.value = true;
  try {
    const result = await window.bafv4.performUpdate();
    if (result.success) {
      showMessage('更新プロセスが開始されました', 'success');
    } else {
      showMessage(`更新でエラーが発生しました: ${result.error}`, 'error');
    }
  } catch (error) {
    showMessage(`更新でエラーが発生しました: ${error}`, 'error');
  } finally {
    loading.value = false;
  }
};
</script>