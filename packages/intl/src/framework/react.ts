import { useSyncExternalStore } from "react";
import { t, setLanguage, getLanguage, onLocaleChange, getSupportedLocales } from "@/runtime";

type ExtractParams<T extends string> = T extends `${infer _Start}{${infer Param}}${infer Rest}` ? Param | ExtractParams<Rest> : never;
type ParamsObject<T extends string> = ExtractParams<T> extends never ? never : { [K in ExtractParams<T>]: string | number };
type TranslationFunction = <T extends string>(key: T, ...args: ParamsObject<T> extends never ? [] : [ParamsObject<T>]) => string;
type SetLanguageFunction = (locale: string) => Promise<void>;

interface UseTranslationResult {
	t: TranslationFunction;
	setLanguage: SetLanguageFunction;
	locale: string;
	supportedLocales: string[];
}

const subscribe = (callback: () => void): (() => void) => onLocaleChange(callback);
export const useLocale = (): string => useSyncExternalStore(subscribe, getLanguage, getLanguage);

export const useTranslation = (): UseTranslationResult => {
	const locale = useLocale();
	return { t, setLanguage, locale, supportedLocales: getSupportedLocales() };
};
