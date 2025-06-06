import axios from 'axios';
import { ref } from 'vue';
import type { Item } from '../../env';

export const data = ref<Item[]>([]);
export const finishedLoading = ref(false);

export const fetch = async (url: string) => {
    try {
        const res = await axios.get<Item[]>(url);
        data.value = res.data;
    } catch (e) {
        throw new Error('Error:' + e);
    } finally {
        finishedLoading.value = true;
    }
};