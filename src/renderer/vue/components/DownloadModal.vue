<template>
  <v-dialog
    v-model="isVisible"
    persistent
    max-width="500"
    :scrim="false"
  >
    <v-card>
      <v-card-title class="d-flex align-center">
        <v-icon icon="mdi-tray-arrow-down" class="mr-2" />
        {{ title }}
      </v-card-title>
      
      <v-card-text>
        <DownloadProgressView :state="state" :percent="percent">
          <ProgressItem 
            :state="state == 0 ? 'pending' : state == 1 ? 'processing' : 'done'" 
            :prog="percent" 
            percent
          >
            <span class="text-subtitle-1">{{ progressMessage }}</span>
          </ProgressItem>
        </DownloadProgressView>
      </v-card-text>
      
      <v-card-actions>
        <v-spacer />
        <v-btn
          v-if="state === 4"
          color="primary"
          @click="onComplete"
          prepend-icon="mdi-check"
        >
          {{ completeText }}
        </v-btn>
        <v-btn
          v-else
          color="error"
          variant="outlined"
          @click="onCancel"
          prepend-icon="mdi-close"
        >
          {{ cancelText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import DownloadProgressView from './DownloadProgressView.vue';
import ProgressItem from './ProgressItem.vue';

interface Props {
  modelValue: boolean;
  state: number;
  percent: number;
  title?: string;
  progressMessage?: string;
  completeText?: string;
  cancelText?: string;
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void;
  (e: 'complete'): void;
  (e: 'cancel'): void;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'ダウンロード中',
  progressMessage: 'ファイルをダウンロード中...',
  completeText: '完了',
  cancelText: 'キャンセル'
});

const emit = defineEmits<Emits>();

const isVisible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value)
});

const onComplete = () => {
  emit('complete');
  isVisible.value = false;
};

const onCancel = () => {
  emit('cancel');
  isVisible.value = false;
};
</script> 