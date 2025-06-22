import { useI18n } from 'vue-i18n';

/**
 * テキストを翻訳するためのコンポーザブル（現在はプレースホルダー）
 */
export const useTranslate = () => {
    const { t, locale } = useI18n();

    /**
     * テキストを翻訳します。
     * @param text 翻訳するテキスト
     * @returns 翻訳されたテキスト
     */
    const translate = async (text: string): Promise<string> => {
        if (locale.value === 'ja') {
            try {
                const translatedText = await window.bafv4.translate(text);
                return translatedText;
            } catch (e) {
                return text; // Return original text on error
            }
        }
        return text;
    };

    return {
        t,
        translate
    };
}; 