<template>
    <v-container class="h-screen pa-4 ga-4">
        <v-stepper v-model="step" class="steps">
            <v-stepper-header class="w-100 hd">
                <v-slide-group ref="headRef" class="w-100" v-model="step" direction="horizontal" show-arrows>
                    <v-slide-group-item v-for="(s, i) in steps" :key="i" :value="i + 1"
                        :ref="el => headItemRefs[i + 1] = el">
                        <v-stepper-item class="text-body-2 align-left pa-4" :value="i + 1" :title="s.name"
                            completeIcon="mdi-check-circle">
                            <v-card-subtitle class="text-caption pl-0 ml-0" v-show="s.skipable">
                                {{ t('optional') }}
                            </v-card-subtitle>
                        </v-stepper-item>
                    </v-slide-group-item>
                </v-slide-group>
            </v-stepper-header>

            <v-stepper-window class="step-win">
                <v-container class="d-flex flex-column ga-4 ma-0 pa-0 h-100">
                    <v-sheet class="w-100 ma-0 pa-0">
                        <component :is="steps[step - 1].card" :ref="stepRefs[step - 1]" />
                    </v-sheet>

                    <v-sheet class="w-100 ma-0 pa-0">
                        <div class="d-flex ga-2 justify-end">
                            <v-btn variant="plain" v-show="!(step === 1)" @click="step--" class="mr-auto"
                                prepend-icon="mdi-arrow-left" :elevation="0">
                                {{ t('back') }}
                            </v-btn>
                            <v-btn variant="plain" v-show="step === 1" @click="cancel" class="mr-auto" prepend-icon="mdi-cancel"
                                :elevation="0" color="error">
                                {{ t('cancel') }}
                            </v-btn>
                            <v-btn color="secondary" variant="outlined" @click="next(true)"
                                append-icon="mdi-skip-next">
                                {{ t('skip') }}
                            </v-btn>
                            <v-btn color="secondary" variant="outlined" @click="next(true)"
                                :disabled="step === steps.length" v-show="steps[step - 1].skipable"
                                append-icon="mdi-skip-next">
                                {{ t('skip') }}
                            </v-btn>
                            <v-btn color="primary" variant="outlined" @click="next(false)"
                                v-show="!(step === steps.length)" append-icon="mdi-arrow-right"
                                class="border-primary-md">
                                {{ t('next') }}
                            </v-btn>
                        </div>
                    </v-sheet>
                </v-container>
            </v-stepper-window>
        </v-stepper>

        <v-snackbar v-model="snackbar" class="text-caption" color="error" variant="outlined" timeout="5000">
            <v-icon icon="mdi-alert-circle" />
            {{ snackbarText }}
            <template v-slot:actions>
                <v-btn color="error" density="compact" variant="outlined" @click="snackbar = false" icon="mdi-close"></v-btn>
            </template>
        </v-snackbar>
    </v-container>
</template>

<script lang="ts" setup>
import { nextTick, ref, shallowRef, watch } from 'vue';

// choose destination directory
import ChooseDest from './steps/ChooseDest.vue';
import { useDirStore } from '../../scripts/Stores';
const dir = useDirStore();

// env
import Env from './steps/Env.vue';

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
        name: t('env'),
        card: null,
        skipable: false
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

/** next step */
const next = async (isSkip: boolean) => {
    if (!isSkip) {
        const currentRef = stepRefs[step.value - 1];
        const comp = currentRef.value?.$?.exposed;
        if (comp?.validate) {
            const msg = await comp.validate();
            if (msg) {
                snackbarText.value = msg;
                snackbar.value = true;
                return;
            }
        }
    }
    if (step.value < steps.length) step.value++;
};

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

.steps {
    max-height: 100%;
}

.snack-err {
    background-color: var(--v-theme-on-secondary) !important;
}
</style>