<template>
    <!-- Card Style Layout -->
    <div v-if="cardStyle" class="d-flex flex-column ga-2">
        <v-card v-for="item in items" :key="item.id" variant="outlined">
            <div class="d-flex ga-4 align-center pa-4">
                <label class="d-flex ga-4 align-center cursor-pointer flex-grow-1">
                    <v-checkbox
                        :value="item.id"
                        v-model="checkedItems"
                        density="compact"
                        hide-details
                        color="primary"
                        class="ma-0 pa-0 flex-grow-0"
                        @change="emitChange"
                    ></v-checkbox>

                    <!-- @slot Use this slot to custom render the item label -->
                    <slot name="item" :item="item">
                        <span class="d-inline-block">{{ getItemName(item.id) }}</span>
                    </slot>
                </label>

                <Selector
                    v-if="item.options.length >= 2"
                    v-model="selectedOptions[item.id]"
                    :options="item.options"
                    :label="getOptionName(item)"
                    @change="(o: Option) => handleOptionsChange(item.id, o)"
                    inline
                    :disabled="!checkedItems.includes(item.id)"
                    style="max-width: 200px;"
                    class="flex-shrink-1"
                />
            </div>
        </v-card>
    </div>

    <!-- Default List Style Layout -->
    <v-container v-else class="container overflow-y-auto" fluid>
        <v-row>
            <v-col v-for="item in items" :key="item.id" cols="12" class="d-flex ga-4 chk-block">
                <label class="d-flex ga-2 align-center cursor-pointer flex-0-0" style="width: 32%;">
                    <v-checkbox
                        :value="item.id"
                        v-model="checkedItems"
                        density="compact"
                        hide-details
                        color="primary"
                        class="ma-0 pa-0"
                        @change="emitChange"
                    ></v-checkbox>
                    <!-- @slot Use this slot to custom render the item label -->
                    <slot name="item" :item="item">
                        <span class="d-inline-block">{{ getItemName(item.id) }}</span>
                    </slot>
                </label>
                <Selector
                    v-if="item.options.length >= 2"
                    v-model="selectedOptions[item.id]"
                    :options="item.options"
                    :label="getOptionName(item)"
                    @change="(o: Option) => handleOptionsChange(item.id, o)"
                    inline
                    :disabled="!checkedItems.includes(item.id)"
                />
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
    cardStyle?: boolean;
}>();

const { modelValue } = toRefs(props);
const checkedItems = ref<string[]>([...modelValue.value]);

const getItemName = computed(() => {
    return (id: string) => {
        // @ts-ignore
        const item = props.items.find(i => i.id === id);
        if (t(id) == id) {
            return item?.name || item?.options[0].name;
        } else {
            return t(id);
        }
    };
});

const getOptionName = (item: Item): string => {
    const option = item.options.find(o => o.optionsName);
    if (option && option.optionsName) {
        return t(option.optionsName);
    }
    return t('type');
}

const selectedOptions = ref<Record<string, Option>>({});
props.items.forEach(item => {
    if (item.options.length >= 2) {
        // 以前に保存した値があればそれを使う、なければ空のオブジェクト
        selectedOptions.value[item.id] = selectedOptions.value[item.id] || { id: "", name: "", url: "" };
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
                const defaultOption = item.options.find(o => o.id === item.id) || item.options[0];
                selectedOptions.value[item.id] = defaultOption;
            }
        } else if (item.options.length === 1) {
            selectedOptions.value[item.id] = item.options[0];
        }
    });
}, { immediate: true, deep: true });

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