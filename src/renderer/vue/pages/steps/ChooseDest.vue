<template>
    <Wizard>
        <template #main>
            <v-card-title class="pl-0 pt-0 pr-0">{{ t('dest') }}</v-card-title>
            <v-card-text class="pl-0 pr-0">
                <p>{{ t('dest-s1') }}</p>
                <p>{{ t('dest-s2') }}</p>
            </v-card-text>
            <DirInput @select="handleSelect" :init="selected" :placeholder="t('select-folder')" />
        </template>
        <template #btn>
            <v-btn variant="plain" class="mr-auto" prepend-icon="mdi-cancel" :elevation="0" color="error"
                @click="$emit('cancel')">
                {{ t('cancel') }}
            </v-btn>
            <v-btn color="primary" variant="outlined" @click="checkOrNext" append-icon="mdi-arrow-right"
                class="border-primary-md">
                {{ t('next') }}
            </v-btn>
        </template>
    </Wizard>
</template>

<script lang="ts" setup>
import DirInput from '../../components/DirInput.vue';
import Wizard from '../../layouts/Wizard.vue';
import { useDirStore } from '../../../composables/Stores';
import { useI18n } from 'vue-i18n';
import { computed } from 'vue';
const { t } = useI18n();

const dir = useDirStore();
const selected = computed(() => dir.get());

const handleSelect = (d: string) => {
    dir.set(d);
};

const emit = defineEmits<{
    error: [msg: string],
    next: [],
    cancel: []
}>();

const checkOrNext = () => {
    if (dir.get() === '') {
        emit('error', t('dest-err'));
    } else {
        emit('next');
    }
}
</script>