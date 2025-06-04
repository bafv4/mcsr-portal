<template>
    <v-menu v-model="menu" :close-on-content-click="false" content-class="elevation-4">
        <template #activator="{ props }">
            <div :class="{ 'd-inline-block': inline }" :style="customStyle" class="">
                <v-text-field v-bind="props" :label="label" readonly hide-details :model-value="selectedLabel"
                    :disabled="disabled" :clearable="clearable" density="comfortable" @click:clear="clear" class="">
                    <template #append-inner>
                        <v-icon icon="mdi-menu-down" class="me-2 transition-transform" :class="{ 'rotate-180': menu }"
                            @click.stop="toggleMenu" />
                    </template>
                </v-text-field>
            </div>
        </template>

        <v-list>
            <v-list-item v-for="(option, index) in options" :key="index" :value="option.id" @click="select(option)"
                :class="{ 'bg-primary text-white': option.id === modelValue?.id }">
                <v-list-item-title>{{ option.name }}</v-list-item-title>
            </v-list-item>
        </v-list>
    </v-menu>
</template>

<script setup lang="ts">
import { ref, computed, toRefs, type Ref } from 'vue';
import type { Option } from '../../../env';

const props = withDefaults(defineProps<{
    options: Option[];
    modelValue: Option;
    label?: string;
    clearable?: boolean;
    disabled?: boolean;
    width?: string;
    height?: string;
    inline?: boolean;
}>(), {
    clearable: false,
    disabled: false,
    width: '320px',
    height: '',
    inline: false,
});

const emit = defineEmits<{
    (e: 'change', value: Option): void;
}>();

const menu = ref(false);

const { modelValue } = toRefs(props);

const selected: Ref<Option,Option> = ref({
    id: "",
    name: "",
    url: ""
});

const selectedLabel = computed(() => {
    const match = props.options.find((option) => option.id === selected.value.id);
    return match ? selected.value.name : '';
});

function select(option: Option) {
    selected.value = option;
    emit('change', selected.value);
    menu.value = false;
}

function clear() {
    selected.value = {id:"", name:"", url:""}
    emit('change', selected.value);
}

function toggleMenu() {
    if (!props.disabled) {
        menu.value = !menu.value;
    }
}

const customStyle = computed(() => ({
    width: props.width,
    height: props.height,
}));
</script>

<style scoped>
.rotate-180 {
    transform: rotate(180deg);
    transition: transform .3s ease;
}

.v-input {
    cursor: pointer;
}
</style>