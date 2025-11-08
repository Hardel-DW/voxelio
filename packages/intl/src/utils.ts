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