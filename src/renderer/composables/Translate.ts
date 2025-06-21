import { useI18n } from 'vue-i18n';

/**
 * テキストを翻訳するためのコンポーザブル（現在はプレースホルダー）
 */
export function useTranslate() {
    const { locale } = useI18n();

    /**
     * テキストを翻訳します。
     * @param text 翻訳するテキスト
     * @returns 翻訳されたテキスト
     */
    const translate = async (text: string): Promise<string> => {
        if (locale.value === 'ja') {
            // 注意: これは実際の翻訳API呼び出しのプレースホルダーです。
            // 本番環境では、DeepL、Google翻訳などの外部サービスを呼び出す必要があります。
            // 現時点では、APIキーが不要なため原文をそのまま返します。
            return text;
        }
        return text;
    };

    return { translate };
} 