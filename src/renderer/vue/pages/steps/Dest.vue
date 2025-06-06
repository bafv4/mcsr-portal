<template>
    <v-container class="h-screen pa-6 ga-4">
        <Stepper class="h-100" :steps="SetupSteps" location="dest">
            <template #main>
                <v-card-text class="pl-0 pr-0 flex-0-1">
                    <p>{{ t('dest-s1') }}</p>
                    <p>{{ t('dest-s2') }}</p>
                </v-card-text>

                <DirInput @select="handleSelect" :init="val" class="flex-0-1" />
            </template>
            <template #navigation>
                <v-btn variant="plain" class="mr-auto" prepend-icon="mdi-cancel" :elevation="0" color="error" to="/">
                    {{ t('cancel') }}
                </v-btn>
                <v-btn color="primary" variant="outlined" @click="true" append-icon="mdi-arrow-right"
                    class="border-primary-md">
                    {{ t('next') }}
                </v-btn>
            </template>
        </Stepper>

        <v-snackbar v-model="snackbar" class="text-caption" color="error" variant="outlined" timeout="5000">
            <v-icon icon="mdi-alert-circle" />
            {{ snackbarText }}
            <template v-slot:actions>
                <v-btn color="error" density="compact" variant="outlined" @click="snackbar = false"
                    icon="mdi-close"></v-btn>
            </template>
        </v-snackbar>
    </v-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { SetupSteps } from '../../Const';
import Stepper from '../../components/Stepper.vue';
import DirInput from '../../components/DirInput.vue';

// choose destination directory
import { useDirStore } from '../../../composables/Stores';
const dir = useDirStore();
const val = ref(dir.get());

const handleSelect = (d: string) => {
    dir.set(d);
    val.value = d;
};

// i18n, routing
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
const { t } = useI18n();
const router = useRouter();

/** snackbar stats & texts */
const snackbar = ref(false);
const snackbarText = ref("");
</script>

<style lang="css" scoped>
.snack-err {
    background-color: var(--v-theme-on-secondary) !important;
}
</style>