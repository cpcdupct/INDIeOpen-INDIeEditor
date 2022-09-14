/* eslint-disable no-underscore-dangle */
import transformTranslations from './transform-strings.json';

export interface TranslationItem {
    language: string;
    key: string;
    value: string;
}

export class TranslationService {
    private static instance: any;
    private translations: TranslationItem[] = transformTranslations as TranslationItem[];

    private constructor() {}

    public static getInstance(): TranslationService {
        if (!TranslationService.instance) {
            TranslationService.instance = new TranslationService();
        }

        return TranslationService.instance;
    }

    translate(key: string, language: string): string {
        const translation = this.translations.find(
            (t: TranslationItem) => t.language === language && t.key === key
        );

        if (translation) return translation.value;

        if (!translation) {
            const defaultTranslation = this.translations.find(
                (t: TranslationItem) => t.language === 'en' && t.key === key
            );

            if (!defaultTranslation) return '';
            else return defaultTranslation.value;
        }
    }
}
