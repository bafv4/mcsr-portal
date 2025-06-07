<template>
    <Wizard>
        <template #main>
            <v-card-title class="pl-0 pt-0 pr-0">{{ t('dest') }}</v-card-title>
            <v-card-text class="pl-0 pr-0">
                <p>{{ t('dest-s1') }}</p>
                <p>{{ t('dest-s2') }}</p>
            </v-card-text>
            <DirInput @select="handleSelect" :init="val" />
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
import Wizard from '../../components/Wizard.vue';
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

const emit = defineEmits<{
    error: [msg: string],
    next: [],
    cancel: []
}>();

// validation
defineExpose({
    async validate(): Promise<string> {
        if (val.value === '') {
            return t('dest-err');
        }
        return '';
    },
});

const checkOrNext = () => {
    if (val.value === '') {
        emit('error', t('dest-err'));
    } else {
        emit('next');
    }
}
</script>