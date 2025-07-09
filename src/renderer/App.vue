<template>
    <v-app>
        <router-view />
        
        <!-- Global Toast -->
        <GlobalToast />
        
        <!-- Global Modal -->
        <GlobalModal />
    </v-app>
</template>

<script setup lang="ts">
import { useTheme } from 'vuetify';
import { useRouter } from 'vue-router';
import { onMounted } from 'vue';
import GlobalToast from './vue/components/GlobalToast.vue';
import GlobalModal from './vue/components/GlobalModal.vue';
import { useGlobalUI } from './composables/GlobalUI';

const theme = useTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    theme.global.name.value = e.matches ? 'dark' : 'light';
});

const router = useRouter();
const { hideModal, hideAllToasts } = useGlobalUI();

onMounted(() => {
  router.afterEach(() => {
    hideModal();
    hideAllToasts();
  });
});
</script>

<style></style>