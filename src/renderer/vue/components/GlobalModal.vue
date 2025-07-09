<template>
    <v-dialog
        v-model="modal.show"
        :max-width="modal.maxWidth"
        :persistent="modal.persistent"
        :retain-focus="false"
        @click:outside="handleOverlayClick"
        transition="dialog-bottom-transition"
    >
        <v-card class="modal-card" :elevation="4">
            <v-btn v-if="modal.closable" icon="mdi-close" variant="text" size="small" @click="closeModal" position="fixed" style="top: 1rem; right: 1rem;" />
            <component v-if="modal.component" :is="modal.component" v-bind="modal.props" @close="closeModal" />
            <p v-else-if="modal.content" class="text-body-1">{{ modal.content }}</p>
        </v-card>
    </v-dialog>
</template>

<script lang="ts" setup>
import { useGlobalUI } from '../../composables/GlobalUI';

const { modal, closeModal } = useGlobalUI();

const handleOverlayClick = () => {
    if (modal.closable) {
        closeModal();
    }
};
</script>

<style scoped>
.modal-card {
    position: relative;
    overflow: hidden;
}

/* カスタムダイアログトランジション */
:deep(.dialog-bottom-transition-enter-active) {
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.dialog-bottom-transition-leave-active) {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

:deep(.dialog-bottom-transition-enter-from) {
    transform: scale(0.95);
    opacity: 0;
}

:deep(.dialog-bottom-transition-enter-to) {
    transform: scale(1);
    opacity: 1;
}

:deep(.dialog-bottom-transition-leave-from) {
    transform: scale(1);
    opacity: 1;
}

:deep(.dialog-bottom-transition-leave-to) {
    transform: scale(0.95);
    opacity: 0;
}

/* オーバーレイアニメーション */
:deep(.v-overlay__scrim) {
    transition: opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>