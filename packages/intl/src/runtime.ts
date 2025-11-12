type Translations = Record<string, string>;
type TranslationParams = Record<string, string | number>;
type ExtractParams<T extends string> = T extends `${infer _Start}{${infer Param}}${infer Rest}` ? Param | ExtractParams<Rest> : never;
type ParamsObject<T extends string> = ExtractParams<T> extends never ? never : { [K in ExtractParams<T>]: string | number };
type LocaleLoader = () => Promise<{ default: Translations }>;

const translations = new Map<string, Translations>();
const supportedLocales = new Set<string>();
const loadedLocales = new Set<string>();
let currentLocale: string | null = null;
let loaders: Record<string, LocaleLoader> = {};
let fallbackLocale = "";

const interpolate = (text: string, params: TranslationParams): string =>
	text.replace(/\{(\w+)\}/g, (_, key) => (params[key] !== undefined ? String(params[key]) : `{${key}}`));

export const detectLanguage = (fallback: string, supported: string[]): string => {
	if (typeof window === "undefined") return fallback;

	const urlParams = new URLSearchParams(window.location.search);
	const langParam = urlParams.get("lang");
	if (langParam && supported.includes(langParam)) return langParam;

	const subdomain = window.location.hostname.split(".")[0];
	if (subdomain && supported.includes(subdomain)) return subdomain;

	const pathLang = window.location.pathname.split("/")[1];
	if (pathLang && supported.includes(pathLang)) return pathLang;

	const storedLang = localStorage.getItem("locale");
	if (storedLang && supported.includes(storedLang)) return storedLang;

	if (navigator.language) {
		const browserLang = navigator.language.split("-")[0];
		if (supported.includes(browserLang)) return browserLang;
	}

	return fallback;
};

export const init = (locales: Record<string, Translations>, options?: { fallbackLocale?: string; supportedLocales?: string[] }): void => {
	for (const [locale, trans] of Object.entries(locales)) {
		translations.set(locale, trans);
		supportedLocales.add(locale);
	}
	if (options?.fallbackLocale) fallbackLocale = options.fallbackLocale;
	if (options?.supportedLocales) {
		for (const locale of options.supportedLocales) {
			supportedLocales.add(locale);
		}
	}
};

export const initDynamic = async (
	localeLoaders: Record<string, LocaleLoader>,
	initialLocale: string,
	options: { fallbackLocale: string; supportedLocales: string[] }
): Promise<void> => {
	loaders = localeLoaders;
	const data = await loaders[initialLocale]();
	init({ [initialLocale]: data.default }, options);
	loadedLocales.add(initialLocale);
	currentLocale = initialLocale;
};

export const addLocale = (locale: string, trans: Translations): void => {
	translations.set(locale, trans);
	supportedLocales.add(locale);
};

export const setLanguage = async (locale: string): Promise<void> => {
	if (!supportedLocales.has(locale))
		throw new Error(`Invalid locale: "${locale}". Supported locales: [${Array.from(supportedLocales).join(", ")}]`);

	if (loaders[locale] && !loadedLocales.has(locale)) {
		const data = await loaders[locale]();
		addLocale(locale, data.default);
		loadedLocales.add(locale);
	}

	if (typeof window !== "undefined") {
		localStorage.setItem("locale", locale);
	}
};

export const getLanguage = (): string => {
	if (currentLocale) return currentLocale;
	if (!fallbackLocale)
		throw new Error('Runtime not initialized: fallbackLocale is not set. Import "virtual:@voxelio/intl" in your app entry point.');
	return detectLanguage(fallbackLocale, Array.from(supportedLocales));
};

export const getSupportedLocales = (): string[] => Array.from(supportedLocales);

export const t = <T extends string>(key: T, ...args: ParamsObject<T> extends never ? [] : [ParamsObject<T>]): string => {
	const locale = getLanguage();
	if (!supportedLocales.has(locale))
		throw new Error(`Invalid locale detected: "${locale}". Supported locales: [${Array.from(supportedLocales).join(", ")}]`);
	const text = translations.get(locale)?.[key] ?? key;
	return args[0] ? interpolate(text, args[0]) : text;
};
