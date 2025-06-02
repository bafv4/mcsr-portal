<template>
    <v-app>
        <router-view />
    </v-app>
</template>

<script setup lang="ts">
import { useTheme } from 'vuetify';

const theme = useTheme();
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    theme.global.name.value = e.matches ? 'dark' : 'light';
})
</script>

<style></style>