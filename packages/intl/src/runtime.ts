type Translations = Record<string, string>;
type TranslationParams = Record<string, string | number>;

type ExtractParams<T extends string> = T extends `${infer _Start}{${infer Param}}${infer Rest}`
    ? Param | ExtractParams<Rest>
    : never;

type ParamsObject<T extends string> = ExtractParams<T> extends never
    ? never
    : { [K in ExtractParams<T>]: string | number };

class I18nRuntime {
    private currentLocale: string | null = null;
    private translations: Map<string, Translations> = new Map();
    private fallbackLocale = 'en';
    private isInitialized = false;

    private detectLanguage(): string {
        if (this.currentLocale) return this.currentLocale;
        if (typeof window === 'undefined') return this.fallbackLocale;

        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        if (langParam) return langParam;

        const subdomain = window.location.hostname.split('.')[0];
        if (subdomain && subdomain.length === 2 && subdomain !== 'www') {
            return subdomain;
        }

        const pathLang = window.location.pathname.split('/')[1];
        if (pathLang && pathLang.length === 2) {
            return pathLang;
        }

        const storedLang = localStorage.getItem('locale');
        if (storedLang) return storedLang;

        if (navigator.language) {
            return navigator.language.split('-')[0];
        }

        return this.fallbackLocale;
    }

    private interpolate(text: string, params?: TranslationParams): string {
        if (!params) return text;

        return text.replace(/\{(\w+)\}/g, (_, key) => {
            const value = params[key];
            return value !== undefined ? String(value) : `{${key}}`;
        });
    }

    init(locales: Record<string, Translations>): void {
        for (const [locale, translations] of Object.entries(locales)) {
            this.translations.set(locale, translations);
        }
        this.isInitialized = true;
    }

    translate(key: string, params?: TranslationParams): string {
        if (!this.isInitialized) return key;

        const locale = this.detectLanguage();
        const translations = this.translations.get(locale) ?? this.translations.get(this.fallbackLocale) ?? {};
        const text = translations[key] ?? key;
        return this.interpolate(text, params);
    }

    setLanguage(locale: string): void {
        this.currentLocale = locale;
        if (typeof window !== 'undefined') {
            localStorage.setItem('locale', locale);
        }
    }

    getLanguage(): string {
        return this.detectLanguage();
    }

    configure(options: { fallbackLocale?: string }): void {
        if (options.fallbackLocale) this.fallbackLocale = options.fallbackLocale;
    }
}

const runtime = new I18nRuntime();

export const init = (locales: Record<string, Translations>): void => runtime.init(locales);

export function t<T extends string>(
    text: T,
    ...args: ParamsObject<T> extends never ? [] : [ParamsObject<T>]
): string {
    return runtime.translate(text, args[0]);
}

export const setLanguage = (locale: string): void => runtime.setLanguage(locale);
export const getLanguage = (): string => runtime.getLanguage();
export const configure = (options: { fallbackLocale?: string }): void => runtime.configure(options);
