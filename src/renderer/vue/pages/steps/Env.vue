<template>
    <v-card class="pa-0 ma-0">
        <v-card-title class="pl-0 pt-0 pr-0">{{ t('env-t') }}</v-card-title>
        <v-card-text class="pl-0 pr-0">{{ t('env-s1') }}</v-card-text>

        <Checkboxes v-model="selected" :items="items" @update:selectedOptions="onChangeOptions" />
        <div style="margin-top: 16px;">
            <div>選択中: {{ selected }}</div>
            <div>ドロップダウン選択: {{ selectedOptions }}</div>
        </div>
    </v-card>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';
import Checkboxes from '../../components/Checkboxes.vue';
import type { Item, Option } from '../../../../env';
import apps from '../../../data/apps.json'
const { t } = useI18n();

const items: Item[] = apps as Item[];

const selected = ref<string[]>([]);
const selectedOptions = ref<Record<string, Option>>({});

function onChangeOptions(val: Record<string, Option>) {
    selectedOptions.value = val;
}
</script>

<style scoped></style>