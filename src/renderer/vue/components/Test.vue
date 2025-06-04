<template>
    <div>
        <BSelect
            v-model="selected"
            :options="options"
            placeholder="選択してください"
        />
        <p>選択された値: {{ selected }}</p>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import BSelect from './BSelect.vue'

const selected = ref(null)
const options = [
    { value: 'apple', label: 'りんご' },
    { value: 'banana', label: 'バナナ' },
    { value: 'orange', label: 'オレンジ' }
]
</script>