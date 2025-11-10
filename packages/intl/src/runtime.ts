type Translations = Record<string, string>;
type TranslationParams = Record<string, string | number>;
type ExtractParams<T extends string> = T extends `${infer _Start}{${infer Param}}${infer Rest}` ? Param | ExtractParams<Rest> : never;
type ParamsObject<T extends string> = ExtractParams<T> extends never ? never : { [K in ExtractParams<T>]: string | number };

class I18nRuntime {
    private currentLocale: string | null = null;
    private translations: Map<string, Translations> = new Map();
    private supportedLocales: Set<string> = new Set();
    private fallbackLocale: string | undefined;
    private isInitialized = false;

    private isValidLocale(locale: string): boolean {
        return this.supportedLocales.has(locale);
    }

    private detectLanguage(): string {
        if (this.currentLocale) return this.currentLocale;
        if (!this.fallbackLocale) throw new Error('Runtime not initialized: fallbackLocale is not set. Import "virtual:@voxelio/intl" in your app entry point.');
        if (typeof window === 'undefined') return this.fallbackLocale;

        const urlParams = new URLSearchParams(window.location.search);
        const langParam = urlParams.get('lang');
        if (langParam && this.isValidLocale(langParam)) return langParam;

        const subdomain = window.location.hostname.split('.')[0];
        if (subdomain && this.isValidLocale(subdomain)) return subdomain;

        const pathLang = window.location.pathname.split('/')[1];
        if (pathLang && this.isValidLocale(pathLang)) return pathLang;

        const storedLang = localStorage.getItem('locale');
        if (storedLang && this.isValidLocale(storedLang)) return storedLang;

        if (navigator.language) {
            const browserLang = navigator.language.split('-')[0];
            if (this.isValidLocale(browserLang)) return browserLang;
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

    init(locales: Record<string, Translations>, options?: { fallbackLocale?: string }): void {
        for (const [locale, translations] of Object.entries(locales)) {
            this.translations.set(locale, translations);
            this.supportedLocales.add(locale);
        }
        if (options?.fallbackLocale) {
            this.fallbackLocale = options.fallbackLocale;
        }
        this.isInitialized = true;
    }

    translate(key: string, params?: TranslationParams): string {
        if (!this.isInitialized) return key;

        const locale = this.detectLanguage();
        if (!this.isValidLocale(locale)) {
            throw new Error(`Invalid locale detected: "${locale}". Supported locales: [${Array.from(this.supportedLocales).join(', ')}]`);
        }
        const translations = this.translations.get(locale) ?? {};
        const text = translations[key] ?? key;
        return this.interpolate(text, params);
    }
    setLanguage(locale: string): void {
        if (!this.isValidLocale(locale)) {
            throw new Error(`Invalid locale: "${locale}". Supported locales: [${Array.from(this.supportedLocales).join(', ')}]`);
        }
        this.currentLocale = locale;
        if (typeof window !== 'undefined') {
            localStorage.setItem('locale', locale);
        }
    }

    getLanguage(): string {
        return this.detectLanguage();
    }

    getSupportedLocales(): string[] {
        return Array.from(this.supportedLocales);
    }
}

const runtime = new I18nRuntime();
export const init = (locales: Record<string, Translations>, options?: { fallbackLocale?: string }): void => runtime.init(locales, options);
export const setLanguage = (locale: string): void => runtime.setLanguage(locale);
export const getLanguage = (): string => runtime.getLanguage();
export const getSupportedLocales = (): string[] => runtime.getSupportedLocales();
export const t = <T extends string>(text: T, ...args: ParamsObject<T> extends never ? [] : [ParamsObject<T>]): string => runtime.translate(text, args[0]);