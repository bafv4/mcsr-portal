<template>
    <v-card class="elevation-0">
        <v-row align="center">
            <v-col cols="1" align-self="start">
                <v-progress-circular v-if="state=='pending'" model-value="0" :size="24" :width="4"></v-progress-circular>
                <v-progress-circular v-else-if="state=='processing'" indeterminate color="primary" :size="24" :width="5" />
                <v-icon v-else-if="state=='done'" icon="mdi-check-circle" color="success" />
            </v-col>
            <v-col cols="9">
                <slot></slot>
            </v-col>
            <v-col cols="2" justify="end" class="text-right">
                <span class="d-inline">{{ percentRef.prog }}</span>
                <span v-if="percent" class="d-inline text-caption"> %</span>
                <span v-else class="d-inline text-caption"> /{{ total }}</span>
            </v-col>
        </v-row>
    </v-card>
</template>

<script setup lang="ts">
import { toRefs } from 'vue';

const props = withDefaults(defineProps<{
    state: "pending" | "processing" | "done" | "error",
    prog?: number,
    percent?: boolean,
    total?: number
}>(), {
    percent: false,
});

const percentRef = toRefs(props);
</script>