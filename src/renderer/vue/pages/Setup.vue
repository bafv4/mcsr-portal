<template>
    <v-container class="h-screen pa-4 d-flex flex-column">
        <v-stepper v-model="step" class="steps ga-2 d-flex flex-column w-100 h-100 flex-grow-1">
            <v-stepper-header class="w-100 hd" style="flex-shrink: 0;">
                <v-slide-group ref="headRef" class="w-100" v-model="step" direction="horizontal" show-arrows>
                    <v-slide-group-item v-for="(s, i) in steps" :key="i" :value="i + 1"
                        :ref="el => headItemRefs[i + 1] = el">
                        <v-stepper-item class="text-body-2 pa-4" :value="i + 1" completeIcon="mdi-check-circle">
                            <v-card-title class="ma-0 pa-0 text-subtitle-1 text-start">
                                {{ s.name }}
                            </v-card-title>
                            <v-card-subtitle class="text-caption pa-0 ma-0 text-start" v-show="s.skipable">
                                {{ t('optional') }}
                            </v-card-subtitle>
                        </v-stepper-item>
                    </v-slide-group-item>
                </v-slide-group>
            </v-stepper-header>

            <v-stepper-window class="flex-grow-1 d-flex flex-column ma-4 pa-1" style="min-height: 0;">
                <div class="flex-grow-1 d-flex flex-column ga-2" style="min-height: 0;">
                    <component :is="steps[step - 1].card" :ref="stepRefs[step - 1]" @next="step++" @back="step--"
                        @cancel="cancel" @error="error" @complete="goToComplete"/>
                </div>
            </v-stepper-window>
        </v-stepper>

        <v-snackbar v-model="snackbar" class="text-caption mb-6 elevation-4" timeout="5000">
            <v-icon icon="mdi-alert-circle" color="error" />
            {{ snackbarText }}
            <template v-slot:actions>
                <v-btn color="error" density="compact" variant="plain" @click="snackbar = false"
                    icon="mdi-close"></v-btn>
            </template>
        </v-snackbar>
    </v-container>
</template>

<script lang="ts" setup>
import { nextTick, ref, shallowRef, watch } from 'vue';

// choose destination directory
import ChooseDest from './steps/ChooseDest.vue';
import Env from './steps/Env.vue';
import ExtTools from './steps/ExtTools.vue';
import Instance from './steps/Instance.vue';
import Mods from './steps/Mods.vue';

import { useDirStore } from '../../composables/Stores';
const dir = useDirStore();

// i18n, routing
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
const { t } = useI18n();
const router = useRouter();

interface Step {
    name: string,
    card: any,
    skipable: boolean,
};

const steps: Step[] = [
    {
        name: t('dest'),
        card: ChooseDest,
        skipable: false
    },
    {
        name: t('env'),
        card: Env,
        skipable: true
    },
    {
        name: t('ext-tools'),
        card: ExtTools,
        skipable: true
    },
    {
        name: t('instance'),
        card: Instance,
        skipable: false
    },
    {
        name: t('mods'),
        card: Mods,
        skipable: true
    },
];

/** for stepper locations */
const step = ref(1);

/** for stepper header scroll */
const headRef = ref<InstanceType<typeof import('vuetify/components')['VSlideGroup']> | null>(null);
const headItemRefs: Record<number, any> = {};
const stepRefs = steps.map(() => shallowRef());

/** snackbar stats & texts */
const snackbar = ref(false);
const snackbarText = ref("");

/** cancel */
const cancel = () => {
    dir.$reset();
    router.push('/');
};

const goToComplete = () => {
    router.push({ path: '/complete/' });
};

const error = (err: string) => {
    snackbarText.value = err;
    snackbar.value = true;
}

/** header scroll */
const scrollToItem = (target: number) => {
    const itemEl = headItemRefs[target]?.$el as HTMLElement;
    const wrapperEl = headRef.value?.$el?.querySelector('.v-slide-group__content') as HTMLElement;

    if (itemEl && wrapperEl) {
        const itemOffset = itemEl.offsetLeft - wrapperEl.offsetWidth / 2 + itemEl.offsetWidth / 2;
        wrapperEl.scrollTo({ left: itemOffset, behavior: 'smooth' });
    }
};

watch(step, async (val) => {
    await nextTick();
    scrollToItem(val);
});
</script>

<style lang="css" scoped>
.hd {
    overflow-x: auto;
}

::v-deep(.v-window__container) {
    display: flex !important;
    flex-direction: column;
    height: 100%;
}

.steps {
    max-height: 100%;
}

.snack-err {
    background-color: var(--v-theme-on-secondary) !important;
}
</style>