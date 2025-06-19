<template>
    <LoadingView v-if="!finishedLoading" transition="fade-transition" />
    <Wizard v-else-if="error">
        <template #main>
            <v-card class="pa-0 ma-0 elevation-0">
                <v-card-title class="pl-0 pt-0 pr-0" prepend-icon="mdi-alert-circle">An Error Has</v-card-title>
                <v-card-text class="pl-0 pr-0">noway please make sure the internet connection is avalible</v-card-text>
            </v-card>
        </template>
        <template #btn>
            <v-btn color="primary" variant="outlined" @click="retry" prepend-icon="mdi-reload"
                class="border-primary-md">
                {{ t('retry') }}
            </v-btn>
        </template>
    </Wizard>
    <Wizard v-else-if="downloading">
        <template #main>
            <v-card class="pa-0 ma-0 elevation-0">
                <v-card-title v-if="state == 4" class="pl-0 pt-0 pr-0" prepend-icon="mdi-alert-circle"
                    transition="fade-transition">{{ t('done') }}</v-card-title>
                <v-card-title v-else class="pl-0 pt-0 pr-0" prepend-icon="mdi-alert-circle"
                    transition="fade-transition">{{ t('please-wait') }}</v-card-title>

                <v-sheet class="d-flex flex-column ga-4">
                    <ProgressItem :state="state == 0 ? `pending` : state == 1 ? `processing` : `done`" :prog="percent"
                        percent>
                        <span class="text-subtitle-1">{{ t('p-1') }}</span>
                    </ProgressItem>
                    <ProgressItem :state="state in [0, 1] ? `pending` : state == 2 ? `processing` : `done`"
                        v-if="totalZips > 0" :total="totalZips" :prog="progZip">
                        <span class="text-subtitle-1">{{ t('p-2') }}</span>
                    </ProgressItem>
                    <ProgressItem :state="state in [0, 1, 2] ? `pending` : state == 3 ? `processing` : `done`"
                        v-if="totalInstallers > 0" :total="totalInstallers" :prog="progInstaller">
                        <span class="text-subtitle-1">{{ t('p-3') }}</span>
                    </ProgressItem>
                </v-sheet>
            </v-card>
        </template>
        <template #btn>
            <v-btn color="primary" variant="outlined" @click="emit('next')" append-icon="mdi-arrow-right"
                class="border-primary-md" :disabled="state != 4">
                {{ t('next') }}
            </v-btn>
        </template>
    </Wizard>
    <Wizard v-else>
        <template #main>
            <v-card class="pa-0 ma-0 elevation-0">
                <v-card-title class="pl-0 pt-0 pr-0">{{ t('env-t') }}</v-card-title>
                <v-card-text class="pl-0 pr-0">{{ t('env-s1') }}</v-card-text>

                <Checkboxes v-model="selected" :items="[]" @update:selectedOptions="onChangeOptions" />
            </v-card>
        </template>
        <template #btn>
            <v-btn variant="plain" class="mr-auto" prepend-icon="mdi-arrow-left" :elevation="0" color="secondary"
                @click="$emit('back')">
                {{ t('back') }}
            </v-btn>
            <v-btn color="secondary" variant="outlined" @click="$emit('next')" append-icon="mdi-skip-next"
                class="border-secondary-md">
                {{ t('skip') }}
            </v-btn>
            <v-btn color="primary" variant="outlined" @click="tryDownload" prepend-icon="mdi-tray-arrow-down"
                class="border-primary-md">
                {{ t('download') }}
            </v-btn>
        </template>
    </Wizard>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import { ref, onMounted, type Ref } from 'vue';
import Checkboxes from '../../components/Checkboxes.vue';
import LoadingView from '../../components/LoadingView.vue';
import ProgressItem from '../../components/ProgressItem.vue';
import type { Item, Option } from '../../../../env';
import { fetch, data, translate } from '../../../composables/GetMetaJson';
import Wizard from '../../components/Wizard.vue';
import { useDirStore } from '../../../composables/Stores';

const dir = useDirStore();
const { t } = useI18n();
const error = ref(false);
const finishedLoading = ref(false);

const emit = defineEmits<{
    error: [msg: string],
    next: [],
    back: [],
}>();

onMounted(() => {
    tryFetch();
});

const selected = ref<string[]>([]);
const selectedOptions = ref<Record<string, Option>>({});

const onChangeOptions = (val: Record<string, Option>) => {
    selectedOptions.value = val;
}

const itemRef: Ref<Item[]> = ref([]);

const tryFetch = async () => {
    try {
        await fetch('https://raw.githubusercontent.com/bafv4/mcsr-portal/refs/heads/main/meta/ext-tools.json');
    } catch (e) {
        console.error(e);
        error.value = true;
    } finally {
        
        itemRef.value = [];
        finishedLoading.value = true;
    }
};

const retry = async () => {
    error.value = false;
    await tryFetch();
};

const downloading = ref(false);

const tryDownload = () => {
    // validate
    const chks: string[] = selected.value;
    const ops: Record<string, Option> = selectedOptions.value;
    let options: Option[] = chks.map((key) => ops[key]);

    // validate & process
    if (options.length === 0) {
        emit('error', t('env-err-1'))
    } else if (options.includes({ id: "", url: "", name: "" })) {
    } else {
        try {
            const op = JSON.parse(JSON.stringify(options));
            const to = JSON.parse(JSON.stringify(dir.get()));
            window.bafv4.startDarwin(op, to);
            downloading.value = true;
        } catch (error) {
            console.error(error);
        }
    }
};

const totalZips = ref(0);
const totalInstallers = ref(0);
const percent = ref(0);
const progZip = ref(0);
const progInstaller = ref(0);
const state = ref(0);
const target = ref('');

window.bafv4.sendTotal((z, i) => {
    totalZips.value = z;
    totalInstallers.value = i;
});

window.bafv4.tick((s, p, t) => {
    state.value = s;
    if (s == 1) {
        percent.value = p;
    } else if (s == 2) {
        progZip.value = p;
        target.value = t;
    } else if (s == 3) {
        progInstaller.value = p;
        target.value = t;
    }
});

window.bafv4.catchDarwinErr((_s, m) => {
    emit('error', m);
});
</script>