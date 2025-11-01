import { randomUUID } from "node:crypto";

// Generates a random integer in the inclusive range [min, max].
export function randomInt(min: number, max: number): number {
	return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generates a random unique ID with an optional prefix.
 * @param prefix - Optional prefix for the ID (e.g., "item", "group")
 * @returns A unique ID string like "item_a1b2c3d4" or "a1b2c3d4" if no prefix
 */
export function randomId(prefix?: string): string {
	const uuid = randomUUID().split("-")[0];
	return prefix ? `${prefix}_${uuid}` : uuid;
}
