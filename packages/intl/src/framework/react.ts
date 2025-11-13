import { useSyncExternalStore } from "react";
import { t, setLanguage, getLanguage, onLocaleChange, getSupportedLocales } from "@/runtime";

const subscribe = (callback: () => void): (() => void) => onLocaleChange(callback);
export const useLocale = (): string => useSyncExternalStore(subscribe, getLanguage, getLanguage);

export const useTranslation = (): { t: typeof t; setLanguage: typeof setLanguage; locale: string; supportedLocales: string[]; } => {
    const locale = useLocale();
    return { t, setLanguage: setLanguage, locale: locale, supportedLocales: getSupportedLocales() };
};

export { setLanguage, getLanguage, getSupportedLocales };
