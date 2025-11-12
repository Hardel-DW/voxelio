export const safeTry = <T>(fn: () => T): T | undefined => {
    try {
        return fn();
    } catch {
        return undefined;
    }
};

export const safeTryAsync = async <T>(fn: () => Promise<T>): Promise<T | undefined> => {
    try {
        return await fn();
    } catch {
        return undefined;
    }
};

export class KeyMinifier {
    private keyMap = new Map<string, string>();
    private paramMap = new Map<string, string>();
    private keyCounter = 0;
    private paramCounter = 0;

    private createKey(num: number): string {
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let result = '';
        do {
            result = chars[num % 52] + result;
            num = Math.floor(num / 52);
        } while (num > 0);
        return result || 'a';
    }

    minifyKey(readableKey: string): string {
        const existing = this.keyMap.get(readableKey);
        if (existing) return existing;

        const minified = this.createKey(this.keyCounter++);
        this.keyMap.set(readableKey, minified);
        return minified;
    }

    minifyParam(param: string): string {
        const existing = this.paramMap.get(param);
        if (existing) return existing;

        const minified = this.createKey(this.paramCounter++);
        this.paramMap.set(param, minified);
        return minified;
    }

    minifyTextParams(text: string): string {
        return text.replace(/\{(\w+)\}/g, (_, param) => `{${this.minifyParam(param)}}`);
    }

    minifyTranslations(translations: Record<string, string>): Record<string, string> {
        const minified: Record<string, string> = {};
        for (const [key, text] of Object.entries(translations)) {
            const minifiedKey = this.minifyKey(key);
            const minifiedText = this.minifyTextParams(text);
            minified[minifiedKey] = minifiedText;
        }
        return minified;
    }
}