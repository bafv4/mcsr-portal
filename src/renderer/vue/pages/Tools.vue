<template>
    <v-layout style="height: 100vh">
        <v-navigation-drawer
            v-model="drawer"
            :rail="rail"
            permanent
            width="240"
        >
            <v-list>
                <v-list-item
                    :prepend-icon="!rail ? 'mdi-chevron-left' : 'mdi-menu'"
                    @click.stop="rail = !rail"
                >
                    <v-list-item-title v-if="!rail">ツール</v-list-item-title>
                </v-list-item>
            </v-list>

            <v-divider></v-divider>

            <v-list density="compact" nav class="flex-grow-1" style="overflow-y: auto;">
                <v-list-item
                    v-for="tool in tools"
                    :key="tool.title"
                    :prepend-icon="tool.icon"
                    :title="tool.title"
                    :to="tool.route"
                    link
                >
                    <v-tooltip v-if="rail" activator="parent" location="end">{{ tool.title }}</v-tooltip>
                </v-list-item>
            </v-list>

            <template v-slot:append>
                <div class="py-2">
                    <v-divider></v-divider>
                    <v-list-item
                        class="mt-2"
                        prepend-icon="mdi-home"
                        title="ホームに戻る"
                        link
                        @click="goHome"
                    >
                        <v-tooltip v-if="rail" activator="parent" location="end">ホームに戻る</v-tooltip>
                    </v-list-item>
                </div>
            </template>
        </v-navigation-drawer>
        <v-main>
            <v-container>
                <v-card class="d-flex flex-column" style="height: 100%;">
                    <router-view v-slot="{ Component }">
                        <v-fade-transition hide-on-leave>
                            <component :is="Component" />
                        </v-fade-transition>
                    </router-view>
                </v-card>
            </v-container>
        </v-main>
    </v-layout>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
const drawer = ref(true)
const rail = ref(true)
const router = useRouter()

const goHome = () => {
    router.push({ name: 'Home' })
}

const tools = [
    { title: t('mod-config'), icon: 'mdi-puzzle-edit', route: { name: 'ModConfig' } },
    // Add other tools here as they are created
]
</script>

<style scoped>
.v-container {
    height: 100%;
}
</style> 