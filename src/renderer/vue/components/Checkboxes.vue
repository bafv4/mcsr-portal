<template>
    <!-- Card Style Layout -->
    <div class="d-flex flex-column ga-2">
        <v-card
            v-for="item in items"
            :key="item.id"
            variant="outlined"
            :class="['checkbox-card', { 'is-selected': checkedItems.includes(item.id) }]"
            class="py-1 px-2"
        >
            <div class="cursor-pointer" @click="toggleCheckbox(item.id)">
                <div class="d-flex ga-2 align-center pa-0">
                    <v-checkbox
                        :value="item.id"
                        v-model="checkedItems"
                        density="compact"
                        hide-details
                        color="primary"
                        class="ma-0 pa-0 flex-grow-0"
                        readonly
                    ></v-checkbox>
                    <div class="flex-grow-1 text-left" style="min-width: 0; height: 40px; display: flex; align-items: center;">
                        <!-- @slot Use this slot to custom render the item header (name, chips, etc) -->
                        <slot name="item" :item="item">
                            <span class="d-inline-block">{{ getItemName(item.id) }}</span>
                        </slot>
                    </div>
                </div>
                <!-- Description slot, outside the main flex container -->
                <div v-if="$slots.description" class="ma-0 pb-2 pt-0 mt-0" style="padding-left: 35px">
                    <slot name="description" :item="item"></slot>
                </div>
            </div>
            <v-expand-transition>
                <div v-if="checkedItems.includes(item.id) && item.options?.length >= 2" class="pt-2 pb-3" @click.stop style="padding-left: 35px">
                    <v-btn-toggle
                        v-model="selectedOptions[item.id]"
                        @update:modelValue="emitChange"
                        color="primary"
                        variant="outlined"
                        density="compact"
                        mandatory
                    >
                        <v-btn v-for="opt in item.options" :key="opt.id" :value="opt" size="small" class="text-none">
                            {{ opt.name }}
                        </v-btn>
                    </v-btn-toggle>
                </div>
            </v-expand-transition>
        </v-card>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch, toRefs, computed, onMounted } from 'vue';
import type { Item, Option } from '../../../env';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
    items: Item[];
    modelValue: string[];
    cardStyle?: boolean;
    useTranslationOnly?: boolean;
}>();

const { modelValue } = toRefs(props);
const checkedItems = ref<string[]>([...modelValue.value]);

const getItemName = computed(() => {
    return (id: string) => {
        // useTranslationOnlyがtrueの場合、強制的に翻訳を試みる
        if (props.useTranslationOnly) {
            return t(id);
        }
        
        // デフォルトの動作：翻訳が存在すれば返し、なければitem.nameにフォールバックする
        const item = props.items.find(i => i.id === id);
        const translated = t(id);
        if (translated !== id) {
            return translated;
        }
        return item?.name;
    };
});

const selectedOptions = ref<Record<string, Option>>({});

const initializeOptions = () => {
props.items.forEach(item => {
        if (item.options?.length) {
            // Set first option as default, only if not already set
            if(!selectedOptions.value[item.id]) {
        selectedOptions.value[item.id] = item.options[0];
            }
    }
});
    emitChange(); // Emit initial state
};

onMounted(initializeOptions);
watch(() => props.items, initializeOptions, { deep: true });

watch(modelValue, (newVal) => {
    checkedItems.value = [...newVal];
});

const emit = defineEmits<{
    (e: 'update:modelValue', value: string[]): void;
    (e: 'update:selectedOptions', val: Record<string, Option>): void;
}>();

function toggleCheckbox(id: string) {
    const index = checkedItems.value.indexOf(id);
    if (index > -1) {
        checkedItems.value.splice(index, 1);
    } else {
        checkedItems.value.push(id);
    }
    emitChange();
}

function emitChange() {
    emit('update:modelValue', checkedItems.value);
    emit('update:selectedOptions', selectedOptions.value);
}
</script>

<style scoped>
.checkbox-card {
    border-color: transparent;
    transition: border-color 0.2s ease-in-out, background-color 0.2s ease-in-out;
}

.checkbox-card.is-selected {
    border-color: rgb(var(--v-theme-primary));
    background-color: rgba(var(--v-theme-primary), 0.025);
}

.checkbox-card:not(.is-selected):hover {
    border-color: rgba(var(--v-border-color), 0.5);
    background-color: rgba(var(--v-border-color), 0.025);
}
</style>