<template>
    <v-layout style="height: 100vh; width: 100vw;">
        <v-navigation-drawer v-model="drawer" :rail="rail" :width="drawerWidth" permanent
            class="custom-navigation-drawer" :class="{ 'no-width-transition': isResizing }"
            @update:model-value="onDrawerUpdate">
            <v-list>
                <v-list-item :prepend-icon="!rail ? 'mdi-chevron-left' : 'mdi-menu'" @click.stop="rail = !rail">
                    <v-list-item-title v-if="!rail">{{ props.title }}</v-list-item-title>
                </v-list-item>
            </v-list>

            <v-divider></v-divider>

            <v-list density="compact" nav class="flex-grow-1">
                <v-list-item v-for="item in items" :key="item.title" :prepend-icon="item.icon" :title="item.title"
                    @click="currentComponent = item.component" :active="currentComponent === item.component">
                    <v-tooltip v-if="rail" activator="parent" location="end">{{ item.title }}</v-tooltip>
                </v-list-item>
            </v-list>

            <template v-slot:append>
                <div class="py-2">
                    <v-divider></v-divider>
                    <v-list-item class="mt-2" prepend-icon="mdi-home" title="ホーム" @click="goHome">
                        <v-tooltip v-if="rail" activator="parent" location="end">ホーム</v-tooltip>
                    </v-list-item>
                </div>
            </template>
            <div v-if="!rail" class="resize-handle" @mousedown="startResize"></div>
        </v-navigation-drawer>

        <v-main transition="none" class="h-100vh">
            <v-container class="pa-4 h-100 main-content">
                <component :is="currentComponent" v-if="currentComponent" />
            </v-container>
        </v-main>
    </v-layout>
</template>

<script setup lang="ts">
import { ref, type Component, watch, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';

const props = defineProps<{
    open: boolean;
    title: string;
    items: {
        title: string;
        icon: string;
        component: Component;
    }[];
}>();

const router = useRouter();

const drawer = ref(props.open);
const rail = ref(false);
const isResizing = ref(false);

// localStorageから幅を取得
const savedWidth = localStorage.getItem('drawerWidth');
const drawerWidth = ref(savedWidth ? Number(savedWidth) : 200);

const currentComponent = ref<Component | null>(props.items[0].component);

watch(props.items, () => {
    currentComponent.value = props.items[0].component;
});

const goHome = () => {
    router.push('/');
};

// --- ドラッグリサイズ用 ---
let startX = 0;
let startWidth = 0;

const startResize = (e: MouseEvent) => {
    startX = e.clientX;
    startWidth = drawerWidth.value;
    isResizing.value = true;
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', stopResize);
};

const onResize = (e: MouseEvent) => {
    const newWidth = startWidth + (e.clientX - startX);
    drawerWidth.value = Math.max(120, Math.min(newWidth, 400));
    localStorage.setItem('drawerWidth', String(drawerWidth.value));
};

const stopResize = () => {
    isResizing.value = false;
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', stopResize);
};

onBeforeUnmount(() => {
    stopResize();
});

// rail時はdrawerWidthを最小幅に固定、解除時はlocalStorageから復元
watch(rail, (val) => {
    if (val) {
        drawerWidth.value = 56;
    } else {
        const saved = localStorage.getItem('drawerWidth');
        drawerWidth.value = saved ? Number(saved) : 200;
    }
});

// drawerの開閉時にもlocalStorageから復元
const onDrawerUpdate = (val: boolean) => {
    if (val && !rail.value) {
        const saved = localStorage.getItem('drawerWidth');
        drawerWidth.value = saved ? Number(saved) : 200;
    }
};
</script>

<style scoped>
.custom-navigation-drawer {
    border-right: 1px solid #e0e0e0;
    position: relative;
    transition: width 0.2s cubic-bezier(0.4, 0, 0.2, 1);
}

.custom-navigation-drawer.no-width-transition {
    transition: none !important;
}

.resize-handle {
    position: absolute;
    top: 0;
    right: 0;
    width: 6px;
    height: 100%;
    cursor: ew-resize;
    z-index: 10;
    background: transparent;
}

.resize-handle:hover {
    background: #e0e0e0;
}

.main-content {
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.header-area {
    flex-shrink: 0;
    border-bottom: 1px solid #e0e0e0;
    background-color: #f5f5f5;
}

.content-area {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
}

.content-container {
    overflow-y: auto;
    overflow-x: hidden;
    flex: 1;
    max-height: 100%;
}
</style>