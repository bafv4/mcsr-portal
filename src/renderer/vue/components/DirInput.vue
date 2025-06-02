<template>
    <v-btn @click="openDialog" size="large" variant="tonal" block class="text-caption font-weight-regular justify-start">
        <v-icon icon="mdi-folder-outline" class="mr-2"></v-icon>
        <span v-if="!dir">{{ t('select-folder') }}</span>
        <span v-else>{{ t('folder-selected') }} {{ dir }}</span>
    </v-btn>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';

const dir = ref();
const { t } = useI18n();

const props = defineProps<{
    init: string;
}>();
const emits = defineEmits<{
    (e: 'select', dir: string) : void
}>();

onMounted(() => {
    dir.value = props.init;
});

async function openDialog() {
    dir.value = await window.bafv4.selectDest();
    emits('select', dir.value);
}
</script>
