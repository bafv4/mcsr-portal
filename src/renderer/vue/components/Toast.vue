<template>
    <div class="toast-container" :class="{ 'toast-fixed': position === 'fixed' }">
        <Transition name="toast" appear>
            <div v-if="show" class="toast-notification" :class="{ 'toast-success': type === 'success' }">
                <div class="d-flex align-center">
                    <v-icon 
                        :icon="type === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'" 
                        :color="type === 'success' ? 'success' : 'error'"
                        class="mr-2"
                        size="small"
                    />
                    <span class="text-caption">{{ message }}</span>
                </div>
                <v-btn
                    icon="mdi-close"
                    variant="text"
                    size="x-small"
                    @click="dismiss"
                    class="ml-2"
                />
            </div>
        </Transition>
    </div>
</template>

<script lang="ts" setup>
import { ref, watch, onUnmounted } from 'vue';

interface Props {
    modelValue: boolean;
    message: string;
    type?: 'error' | 'success';
    timeout?: number;
    position?: 'fixed' | 'relative';
}

const props = withDefaults(defineProps<Props>(), {
    type: 'error',
    timeout: 3500,
    position: 'fixed'
});

const emit = defineEmits<{
    'update:modelValue': [value: boolean];
}>();

const show = ref(props.modelValue);
let timeoutId: number | null = null;

const dismiss = () => {
    show.value = false;
    if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
    }
};

const startTimeout = () => {
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    timeoutId = window.setTimeout(() => {
        dismiss();
    }, props.timeout);
};

watch(() => props.modelValue, (newVal) => {
    show.value = newVal;
    if (newVal) {
        startTimeout();
    } else {
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    }
});

watch(show, (newVal) => {
    emit('update:modelValue', newVal);
});

onUnmounted(() => {
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
});
</script>

<style scoped>
.toast-container {
    position: relative;
    z-index: 9999;
    pointer-events: none;
}

.toast-fixed {
    position: fixed;
    bottom: 92px;
    right: 28px;
}

.toast-notification {
    background-color: #ffebee;
    border: 1px solid #f44336;
    border-radius: 4px;
    padding: 6px 10px;
    max-width: 350px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #c62828;
}

.toast-success {
    background-color: #e8f5e8;
    border: 1px solid #4caf50;
    border-radius: 4px;
    padding: 6px 10px;
    max-width: 350px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #2e7d32;
}

/* カスタムトランジション */
.toast-enter-active {
    transition: all 0.3s ease-out;
}

.toast-leave-active {
    transition: all 0.3s ease-in;
}

.toast-enter-from {
    transform: translateX(100%);
    opacity: 0;
}

.toast-enter-to {
    transform: translateX(0);
    opacity: 1;
}

.toast-leave-from {
    transform: translateX(0) translateY(0);
    opacity: 1;
}

.toast-leave-to {
    transform: translateX(0) translateY(-20px);
    opacity: 0;
}
</style> 