import axios from 'axios';
import { ref } from 'vue';

export const data = ref<any>([]);

export const fetch = async (url: string) => {
    try {
        const res = await axios.get<any>(url);
        data.value = res.data;
    } catch (e) {
        throw new Error('Error:' + e);
    }
};

export const translate = (text: string, locale: string): Promise<string> => {
    return new Promise(async (resolve, reject) => {
        try {
            const res = await axios.get<string>(`https://script.google.com/macros/s/AKfycbw7n2mKWLhQvf_eYkmzrvcCWxxi7KLhiMZKiH2b2n-24Jb77YjDHPJMsCHiAYbgbpM1/exec?text=${text}&source=en&target=${locale}`);
            resolve(res.data);
        } catch (e) {
            reject(e);
        }
    });
}