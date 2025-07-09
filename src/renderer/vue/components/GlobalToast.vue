<template>
    <div class="toast-container" :class="{ 'toast-fixed': toasts.length > 0 && toasts[0].position === 'fixed' }">
        <TransitionGroup name="toast" appear>
            <div 
                v-for="(toast, index) in toasts" 
                :key="toast.id"
                v-show="toast.show"
                class="toast-notification" 
                :class="{ 'toast-success': toast.type === 'success' }"
                :style="{ 
                    bottom: `${92 + (toasts.length - 1 - index) * 56}px`,
                    right: '28px'
                }"
                elevation="4"
            >
                <div class="d-flex align-center">
                    <v-icon 
                        :icon="toast.type === 'success' ? 'mdi-check-circle' : 'mdi-alert-circle'" 
                        :color="toast.type === 'success' ? 'success' : 'error'"
                        class="mr-2"
                        size="small"
                    />
                    <span class="text-caption">{{ toast.message }}</span>
                </div>
                <v-btn
                    icon="mdi-close"
                    variant="text"
                    size="x-small"
                    @click="hideToast(toast.id)"
                    class="ml-2"
                />
            </div>
        </TransitionGroup>
    </div>
</template>

<script lang="ts" setup>
import { useGlobalUI } from '../../composables/GlobalUI';

const { toasts, hideToast } = useGlobalUI();
</script>

<style scoped>
.toast-container {
    position: relative;
    z-index: 9999;
    pointer-events: none;
}

.toast-notification {
    position: fixed;
    background-color: #ffebee;
    border: 1px solid #f44336;
    border-radius: 4px;
    padding: 6px 10px;
    max-width: 350px;
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #c62828;
    z-index: 9999;
}

.toast-success {
    background-color: #e8f5e8;
    border: 1px solid #4caf50;
    border-radius: 4px;
    padding: 6px 10px;
    max-width: 350px;
    pointer-events: auto;
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #2e7d32;
}

/* カスタムトランジション */
.toast-enter-active {
    transition: all 0.2s ease-in-out;
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

/* 移動アニメーション */
.toast-move {
    transition: all 0.3s ease-in-out;
}
</style> 