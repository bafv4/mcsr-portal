<template>
    <v-container fluid>
        <v-row>
            <v-col v-for="item in items" :key="item.id" cols="12" class="d-flex align-center">
                <!-- チェックボックス -->
                <v-checkbox :label="item.label" :value="item.id" v-model="checkedItems" density="compact" hide-details
                    class="ma-0 pa-0" @change="emitChange"></v-checkbox>

                <v-select v-if="item.options.length >= 2" :items="item.options" :label="item.optionsName"
                    item-title="label" item-value="id" v-model="selectedOptions[item.id]" density="comfortable"
                    hide-details class="ml-4" @change="emitChange" :elevation="2"></v-select>
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts" setup>
import { ref, watch, toRefs } from 'vue';

type Option = {
    id: string;
    label: string;
    [key: string]: any;
};

type Item = {
    id: string;
    label: string;
    optionsName?: string,
    options: Option[];
    selectedOption?: string;
    [key: string]: any;
};

const props = defineProps<{
    items: Item[];
    modelValue: string[];
}>();

const { modelValue } = toRefs(props);
const checkedItems = ref<string[]>([...modelValue.value]);

const selectedOptions = ref<Record<string, string>>({});
props.items.forEach(item => {
    if (item.options && item.options.length >= 1) {
        // 既定値: optionの1要素目
        selectedOptions.value[item.id] = item.selectedOption || item.options[0].id;
    }
});

watch(modelValue, (newVal) => {
    checkedItems.value = [...newVal];
});

// itemsが変わった時もselectedOptionsを初期化
watch(() => props.items, (newItems) => {
    newItems.forEach(item => {
        if (item.options && item.options.length >= 2) {
            if (!selectedOptions.value[item.id]) {
                selectedOptions.value[item.id] = item.selectedOption || item.options[0].id;
            }
        }
    });
}, { immediate: true });

const emit = defineEmits<{
    (e: 'update:modelValue', value: string[]): void;
    (e: 'update:selectedOptions', value: Record<string, string>): void;
}>();

function emitChange() {
    emit('update:modelValue', checkedItems.value);
    emit('update:selectedOptions', { ...selectedOptions.value });
}
</script>

<style scoped>
.v-select .v-field__input {
    display: flex !important;
    justify-content: center !important;
}
</style>