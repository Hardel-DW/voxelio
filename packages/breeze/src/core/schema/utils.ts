import type { IdentifierObject } from "@/core/Identifier";
import { tagsToIdentifiers } from "@/core/Tag";
import type { Analysers } from "@/core/engine/Analyser";

/**
 * Utility function to extract unknown fields from an object, excluding known fields
 */
export function extractUnknownFields(obj: Record<string, any>, knownFields: Set<string>): Record<string, any> | undefined {
    const unknownFields: Record<string, any> = {};
    let hasUnknownFields = false;

    for (const [key, value] of Object.entries(obj)) {
        if (!knownFields.has(key)) {
            unknownFields[key] = value;
            hasUnknownFields = true;
        }
    }

    return hasUnknownFields ? unknownFields : undefined;
}

/**
 * Common utility to process tags for compilation
 */
export function processElementTags(tags: string[], config: keyof Analysers): IdentifierObject[] {
    if (tags.length === 0) return [];
    const tagRegistry = `tags/${config}`;
    return tagsToIdentifiers(tags, tagRegistry);
}
/**
 * Utility to merge multiple sets of known fields
 */
export function mergeKnownFields(...fieldSets: Set<string>[]): Set<string> {
    const merged = new Set<string>();
    for (const fieldSet of fieldSets) {
        for (const field of fieldSet) {
            merged.add(field);
        }
    }
    return merged;
}
