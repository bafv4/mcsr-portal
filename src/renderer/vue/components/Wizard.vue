<template>
    <v-card class="elevation-0 flex-grow-1 overflow-y-auto wizard-main" style="min-height: 0;">
        <slot name="main"></slot>
    </v-card>
    <v-card class="elevation-0 d-flex flex-column ga-2 wizard-footer mt-2" style="flex-shrink: 0;">
        <slot name="toast"></slot>
        <v-divider></v-divider>
        <div class="d-flex ga-2 justify-end">
            <slot name="btn"></slot>
        </div>
    </v-card>
</template>

<style scoped>
.wizard-main {
    scrollbar-width: thin;
    scrollbar-color: rgba(var(--v-border-color), 0.5) transparent;
}

.wizard-main::-webkit-scrollbar {
    width: 8px;
}

.wizard-main::-webkit-scrollbar-track {
    background: transparent;
}

.wizard-main::-webkit-scrollbar-thumb {
    background-color: rgba(var(--v-border-color), 0.5);
    border-radius: 4px;
}

.wizard-main::-webkit-scrollbar-thumb:hover {
    background-color: rgba(var(--v-border-color), 0.7);
}

.wizard-footer {
    background-color: inherit;
}
</style>