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
    private counter = 0;

    minifyKey(readableKey: string): string {
        const existing = this.keyMap.get(readableKey);
        if (existing) return existing;

        const minified = toBase52(this.counter++);
        this.keyMap.set(readableKey, minified);
        return minified;
    }

    getMap(): Map<string, string> {
        return this.keyMap;
    }

    getMapObject(): Record<string, string> {
        return Object.fromEntries(this.keyMap);
    }
}