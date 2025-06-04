<template>
    <LoadingView v-if="!finishedLoading" transition="fade-transition" />
    <v-card v-else class="pa-0 ma-0" transition="fade-transition">
        <v-card-title class="pl-0 pt-0 pr-0">{{ t('env-t') }}</v-card-title>
        <v-card-text class="pl-0 pr-0">{{ t('env-s1') }}</v-card-text>

        <Checkboxes v-model="selected" :items="data" @update:selectedOptions="onChangeOptions" />
    </v-card>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { ref, onMounted } from 'vue';
import Checkboxes from '../../components/Checkboxes.vue';
import LoadingView from '../../components/LoadingView.vue';
import type { Option } from '../../../../env';
import { fetch, finishedLoading, data } from '../../../composables/GetMetaJson';

const { t } = useI18n();

onMounted(() => {
    fetch('https://raw.githubusercontent.com/bafv4/mcsr-portal/refs/heads/main/meta/apps.json');
});

const selected = ref<string[]>([]);
const selectedOptions = ref<Record<string, Option>>({});

const onChangeOptions = (val: Record<string, Option>) => {
    selectedOptions.value = val;
}
</script>

<style scoped></style>