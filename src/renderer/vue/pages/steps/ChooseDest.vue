<template>
    <v-card class="pa-0 ma-0 pb-2 elevation-0">
        <v-card-title class="pl-0 pt-0 pr-0">{{ t('dest') }}</v-card-title>
        <v-card-text class="pl-0 pr-0">
            <p>{{ t('dest-s1') }}</p>
            <p>{{ t('dest-s2') }}</p>
        </v-card-text>
        <DirInput @select="handleSelect" :init="val" />
    </v-card>
</template>

<script lang="ts" setup>
import DirInput from '../../components/DirInput.vue';
import { useDirStore } from '../../../composables/Stores';
import { useI18n } from 'vue-i18n';
import { ref } from 'vue';
const { t } = useI18n();

const dir = useDirStore();
const val = ref(dir.get());

const handleSelect = (d: string) => {
    dir.set(d);
    val.value = d;
};

// validation
defineExpose({
    async validate(): Promise<string> {
        if (val.value === '') {
            return t('dest-err');
        }
        return '';
    },
});
</script>