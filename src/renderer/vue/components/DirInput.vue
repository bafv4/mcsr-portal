<template>
    <v-card variant="tonal" density="comfortable" class="pa-3 cursor-pointer" @click="openDialog">
        <div class="d-flex align-center">
            <v-icon icon="mdi-folder-settings-outline" class="mr-2" />
            <span v-if="selectedPath" class="text-caption">{{ selectedPath }}</span>
            <span v-else class="text-caption">{{ placeholder }}</span>
        </div>
    </v-card>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue';

const props = defineProps<{
    init?: string;
    file?: boolean;
    placeholder?: string;
}>();

const selectedPath = ref(props.init || '');

const emit = defineEmits(['select']);

const openDialog = async () => {
    let path;
    if (props.file) {
        path = await window.bafv4.selectJavaExecutable();
    } else {
        path = await window.bafv4.selectDest();
    }
    
    if (path) {
        selectedPath.value = path;
        emit('select', path);
    }
};

watch(() => props.init, (newVal) => {
    selectedPath.value = newVal || '';
});
</script>

<style lang="css" scoped>
.cursor-pointer {
    cursor: pointer;
}
</style>
