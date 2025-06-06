<template>
    <v-container class="container overflow-y-auto" fluid>
        <v-row>
            <v-col v-for="item in items" :key="item.id" cols="12" class="d-flex ga-4 chk-block">
                <label class="d-flex ga-2 align-center cursor-pointer flex-0-0" style="width: 32%;">
                    <v-checkbox :value="item.id" v-model="checkedItems" density="compact" hide-details color="primary"
                        class="ma-0 pa-0" @change="emitChange"></v-checkbox>
                    <span class="d-inline-block">{{ getItemName(item.id) }}</span>
                </label>
                <Selector v-if="item.options.length >= 2" v-model="selectedOptions[item.id]" :options="item.options"
                    :label="item.optionsName ? t(item.optionsName) : t('type')"
                    @change="(o) => handleOptionsChange(item.id, o)" inline />
            </v-col>
        </v-row>
    </v-container>
</template>

<script lang="ts" setup>
import { ref, watch, toRefs, computed } from 'vue';
import type { Item, Option } from '../../../env';
import Selector from './Selector.vue'
import { useI18n } from 'vue-i18n';
const { t } = useI18n();

const props = defineProps<{
    items: Item[];
    modelValue: string[];
}>();

const { modelValue } = toRefs(props);
const checkedItems = ref<string[]>([...modelValue.value]);

const getItemName = computed(() => {
    return (id: string) => {
        return t(id);
    }
});

const selectedOptions = ref<Record<string, Option>>({});
props.items.forEach(item => {
    if (item.options.length >= 2) {
        selectedOptions.value[item.id] = { id: "", name: "", url: "" };
    } else {
        selectedOptions.value[item.id] = item.options[0];
    }
});

const handleOptionsChange = (id: string, opt: Option) => {
    selectedOptions.value[id] = opt;
    emitChange();
};

watch(modelValue, (newVal) => {
    checkedItems.value = [...newVal];
});

// itemsが変わった時もselectedOptionsを初期化
watch(() => props.items, (newItems) => {
    newItems.forEach(item => {
        if (item.options && item.options.length >= 2) {
            if (!selectedOptions.value[item.id]) {
                selectedOptions.value[item.id] = item.selectedOption || item.options[0];
            }
        }
    });
}, { immediate: true });

const emit = defineEmits<{
    (e: 'update:modelValue', value: string[]): void;
    (e: 'update:selectedOptions', val: Record<string, Option>): void;
}>();

function emitChange() {
    emit('update:modelValue', checkedItems.value);
    emit('update:selectedOptions', selectedOptions.value);
}
</script>

<style scoped>
</style>