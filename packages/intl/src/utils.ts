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

export const toBase52 = (num: number): string => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let result = '';
    do {
        result = chars[num % 52] + result;
        num = Math.floor(num / 52);
    } while (num > 0);
    return result || 'a';
};

export class KeyMinifier {
    private keyMap = new Map<string, string>();
    private paramMap = new Map<string, string>();
    private keyCounter = 0;
    private paramCounter = 0;

    minifyKey(readableKey: string): string {
        const existing = this.keyMap.get(readableKey);
        if (existing) return existing;

        const minified = toBase52(this.keyCounter++);
        this.keyMap.set(readableKey, minified);
        return minified;
    }

    minifyParam(param: string): string {
        const existing = this.paramMap.get(param);
        if (existing) return existing;

        const minified = toBase52(this.paramCounter++);
        this.paramMap.set(param, minified);
        return minified;
    }

    minifyTextParams(text: string): string {
        return text.replace(/\{(\w+)\}/g, (_, param) => `{${this.minifyParam(param)}}`);
    }

    getKeyMap(): Map<string, string> {
        return this.keyMap;
    }

    getParamMap(): Map<string, string> {
        return this.paramMap;
    }

    getKeyMapObject(): Record<string, string> {
        return Object.fromEntries(this.keyMap);
    }
}