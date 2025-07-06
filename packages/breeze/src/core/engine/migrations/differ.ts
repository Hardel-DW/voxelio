import type { LogDifference } from "./types";

/**
 * Normalizes a value to be safely serializable and comparable
 */
export function normalizeValue(value: unknown): unknown {
    if (value === null || value === undefined) {
        return value;
    }

    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return value;
    }

    if (Array.isArray(value)) {
        return value.map(normalizeValue);
    }

    if (typeof value === "object") {
        const normalized: { [key: string]: unknown } = {};
        for (const [key, val] of Object.entries(value)) {
            normalized[key] = normalizeValue(val);
        }
        return normalized;
    }

    return String(value);
}

/**
 * Checks if two normalized values are equal
 */
function isEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (a === null || b === null || a === undefined || b === undefined) return false;

    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length) return false;
        return a.every((item, index) => isEqual(item, b[index]));
    }

    if (typeof a === "object" && typeof b === "object" && a !== null && b !== null) {
        const keysA = Object.keys(a);
        const keysB = Object.keys(b);

        if (keysA.length !== keysB.length) return false;

        return keysA.every((key) => keysB.includes(key) && isEqual(a[key], b[key]));
    }

    return false;
}

/**
 * Create a diff object
 */
const createDiff = (type: LogDifference["type"], path: string, value?: unknown, origin_value?: unknown): LogDifference => ({
    type,
    path,
    ...(value !== undefined && { value }),
    ...(origin_value !== undefined && { origin_value })
});

/**
 * Build a path from segments
 */
const buildPath = (segments: (string | number)[]): string => segments.join(".");

/**
 * Get structure entries
 */
const getStructureEntries = (value: unknown): [string | number, unknown][] => {
    if (Array.isArray(value)) {
        return value.map((item, index) => [index, item] as [number, unknown]);
    }
    return Object.entries(value as Record<string, unknown>);
};

const isStructure = (value: unknown): value is Record<string, unknown> | unknown[] => typeof value === "object" && value !== null;

/**
 * Unified comparison for objects and arrays
 */
function compareStructures(before: unknown, after: unknown, pathSegments: (string | number)[] = []): LogDifference[] {
    const beforeEntries = new Map(getStructureEntries(before));
    const afterEntries = new Map(getStructureEntries(after));
    const allKeys = new Set([...beforeEntries.keys(), ...afterEntries.keys()]);

    return Array.from(allKeys).flatMap((key) => {
        const newPath = buildPath([...pathSegments, key]);
        const beforeValue = beforeEntries.get(key);
        const afterValue = afterEntries.get(key);

        if (beforeValue !== undefined && afterValue === undefined) {
            return [createDiff("remove", newPath, undefined, beforeValue)];
        }

        if (beforeValue === undefined && afterValue !== undefined) {
            return [createDiff("add", newPath, afterValue)];
        }

        if (beforeValue !== undefined && afterValue !== undefined && !isEqual(beforeValue, afterValue)) {
            const bothAreStructures = isStructure(beforeValue) && isStructure(afterValue);
            const sameArrayType = Array.isArray(beforeValue) === Array.isArray(afterValue);

            if (bothAreStructures && sameArrayType) {
                return compareStructures(beforeValue, afterValue, [...pathSegments, key]);
            }

            return [createDiff("set", newPath, afterValue, beforeValue)];
        }

        return [];
    });
}

/**
 * Main diff function that compares two states and returns differences
 */
export function deepDiff(before: unknown, after: unknown): LogDifference[] {
    const normalizedBefore = normalizeValue(before);
    const normalizedAfter = normalizeValue(after);

    if (!isEqual(normalizedBefore, normalizedAfter)) {
        const bothAreStructures = isStructure(normalizedBefore) && isStructure(normalizedAfter);
        const sameArrayType = Array.isArray(normalizedBefore) === Array.isArray(normalizedAfter);

        if (bothAreStructures && sameArrayType) {
            return compareStructures(normalizedBefore, normalizedAfter, []);
        }

        return [createDiff("set", "", normalizedAfter, normalizedBefore)];
    }

    return [];
}
