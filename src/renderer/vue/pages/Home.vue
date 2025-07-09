<template>
    <v-toolbar fixed density="comfortable" class="pr-4 pl-4" :title="`MCSR Portal - ${t('home')}`" :elevation="4"
        color="background">
        <template v-slot:append>
            <v-btn density="comfortable" class="text-sm-button" icon="mdi-information-slab-circle-outline"
                @click="openInfo"></v-btn>
        </template>
    </v-toolbar>

    <v-main>
        <v-container class="pa-4 d-flex ga-4 flex-column align-self-center">
            <v-card class="w-100 pa-1">
                <v-card-title>{{ t('setup') }}</v-card-title>

                <v-card-text>
                    <p>{{ t('home-setup-s1') }}</p>
                    <p>{{ t('home-setup-s2') }}</p>
                    <p>{{ t('home-setup-s3') }}</p>
                </v-card-text>

                <v-card-actions>
                    <v-btn size="large" class="font-weight-bold" color="primary" variant="outlined"
                        append-icon="mdi-arrow-right" :elevation="2" to="/setup/" block>{{
                            t('setup') }}</v-btn>
                </v-card-actions>
            </v-card>

            <v-card class="w-100 pa-1">
                <v-card-title>{{ t('tools') }}</v-card-title>

                <v-card-text>
                    <p>{{ t('home-tools-s1') }}</p>
                </v-card-text>

                <v-card-actions>
                    <v-btn size="large" class="font-weight-bold" color="secondary" variant="outlined"
                        prepend-icon="mdi-pickaxe" :elevation="2" block to="/instance-tools/">{{ 
                            t('tools') }}</v-btn>
                </v-card-actions>
            </v-card>
        </v-container>
    </v-main>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n';
import InfoContent from '../components/InfoContent.vue';
import { useGlobalUI } from '../../composables/GlobalUI';

const { t } = useI18n();

const { showModal } = useGlobalUI();

const openInfo = () => {
    showModal({
        component: InfoContent,
    });
};
</script>

<style scoped>
</style>