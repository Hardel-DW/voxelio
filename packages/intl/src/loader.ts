import { init, addLocale, setLanguage as setLang } from '@/runtime';

type Translations = Record<string, string>;
type LocaleLoader = () => Promise<{ default: Translations }>;

const loadedLocales = new Set<string>();
let loaders: Record<string, LocaleLoader> = {};

export const initDynamic = async (localeLoaders: Record<string, LocaleLoader>, initialLocale: string, options: { fallbackLocale: string; supportedLocales: string[] }): Promise<void> => {
    loaders = localeLoaders;
    const data = await loaders[initialLocale]();
    init({ [initialLocale]: data.default }, options);
    loadedLocales.add(initialLocale);
};

export const setLanguage = async (locale: string): Promise<void> => {
    if (!loadedLocales.has(locale)) {
        const data = await loaders[locale]();
        addLocale(locale, data.default);
        loadedLocales.add(locale);
    }
    setLang(locale);
};
