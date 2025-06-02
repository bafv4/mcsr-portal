<template>
    <v-card class="pa-0 ma-0">
        <v-card-title class="pl-0 pt-0 pr-0">{{ t('env-t') }}</v-card-title>
        <v-card-text class="pl-0 pr-0">{{ t('env-s1') }}</v-card-text>

        <Checkboxes v-model="selected" :items="checkboxItems" @update:selectedOptions="onSelectedOptions" />
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
const { t } = useI18n();

const selected = ref<string[]>([]);
const selectedOptions = ref<Record<string, string>>({});

const checkboxItems = [
    {
        id: 'a',
        label: 'A項目',
        options: [
            { id: 'a1', label: 'HOGE' },
        ],
    },
    {
        id: 'b',
        label: 'B項目',
        optionsName: "Type of B",
        options: [
            { id: 'b1', label: 'B-1' },
            { id: 'b2', label: 'B-2' },
        ],
        selectedOption: 'b2',
    },
    {
        id: 'c',
        label: 'C項目',
        optionsName: "Type of C",
        options: [
            { id: 'c1', label: 'C-1' },
            { id: 'c2', label: 'C-2' },
            { id: 'c3', label: 'C-3' },
        ],
    },
];

function onSelectedOptions(val: Record<string, string>) {
    selectedOptions.value = val;
}
</script>

<style scoped></style>