<template>
    <v-card class="elevation-0 flex-grow-1 overflow-y-auto" style="min-height: 0;">
        <slot name="main"></slot>
    </v-card>
    <v-card class="elevation-0 d-flex flex-column ga-2" style="flex-shrink: 0;">
        <v-divider></v-divider>
        <div class="d-flex ga-2 justify-end">
            <slot name="btn"></slot>
        </div>
    </v-card>
</template>