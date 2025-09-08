import { NumberProvider } from "@/core/calculation/NumberProvider";

/**
 * Represents a count range with minimum and maximum values
 */
export interface CountRange {
	min: number;
	max: number;
}

/**
 * Represents a minecraft:set_count function in loot tables
 */
export interface SetCountFunction {
	function: "minecraft:set_count";
	count: any; // NumberProvider or number
	add?: boolean;
	conditions?: any[];
}

/**
 * Calculate the final count range for a loot item based on its minecraft:set_count functions
 * Used to determine how many items can be dropped from a loot table entry
 * @param functions - Array of loot table functions
 * @returns CountRange representing the possible item count
 * @example
 * calculateItemCountRange([
 *   { function: "minecraft:set_count", count: { type: "minecraft:uniform", min: 1, max: 3 } }
 * ]) // { min: 1, max: 3 }
 */
export function calculateItemCountRange(functions?: any[]): CountRange {
	if (!functions || functions.length === 0) {
		return { min: 1, max: 1 };
	}

	// Filter only set_count functions
	const setCountFunctions = functions.filter((func): func is SetCountFunction => func.function === "minecraft:set_count");

	if (setCountFunctions.length === 0) {
		return { min: 1, max: 1 };
	}

	// Start with base range
	let currentRange: CountRange = { min: 1, max: 1 };

	for (const func of setCountFunctions) {
		const countRange = parseCountValue(func.count);
		const hasConditions = func.conditions && func.conditions.length > 0;
		const isAdd = func.add === true;

		if (isAdd) {
			// Add to current range
			currentRange = {
				min: currentRange.min + countRange.min,
				max: currentRange.max + countRange.max
			};
		} else {
			// Replace current range
			currentRange = countRange;
		}

		// If there are conditions, extend range from 1 to max (conditions might not be met)
		if (hasConditions) {
			currentRange = {
				min: Math.min(1, currentRange.min),
				max: Math.max(currentRange.max, currentRange.min)
			};
		}
	}

	return currentRange;
}

/**
 * Parse a count value (number or NumberProvider) into a range
 * @param count - Number or NumberProvider object
 * @returns CountRange representing the possible values
 */
function parseCountValue(count: any): CountRange {
	// If it's a simple number
	if (typeof count === "number") {
		return { min: count, max: count };
	}

	// If it's a NumberProvider object
	if (typeof count === "object" && count !== null) {
		try {
			const provider = new NumberProvider(count);
			const description = provider.getRollDescription();

			// Parse the description to extract min/max
			// Description format: "X Roll" or "X-Y Roll"
			const match = description.match(/(\d+)(?:-(\d+))?\s+Roll/);
			if (match) {
				const min = parseInt(match[1], 10);
				const max = match[2] ? parseInt(match[2], 10) : min;
				return { min, max };
			}
		} catch (_error) {
			// If NumberProvider fails, try to parse manually
			return parseCountValueManual(count);
		}
	}

	// Fallback
	return { min: 1, max: 1 };
}

/**
 * Manual parsing for NumberProvider objects when NumberProvider class fails
 * Handles the common NumberProvider types directly
 * @param count - NumberProvider object
 * @returns CountRange for the provider type
 */
function parseCountValueManual(count: any): CountRange {
	if (count.type === "minecraft:constant") {
		return { min: count.value, max: count.value };
	}

	if (count.type === "minecraft:uniform") {
		const minVal = typeof count.min === "number" ? count.min : 1;
		const maxVal = typeof count.max === "number" ? count.max : 1;
		return { min: minVal, max: maxVal };
	}

	if (count.type === "minecraft:binomial") {
		const n = typeof count.n === "number" ? count.n : 1;
		return { min: 0, max: n };
	}

	return { min: 1, max: 1 };
}

/**
 * Format a count range as a human-readable string
 * @param range - CountRange to format
 * @returns Formatted string representation
 * @example
 * formatCountRange({ min: 1, max: 1 }) // "1"
 * formatCountRange({ min: 2, max: 5 }) // "2-5"
 */
export function formatCountRange(range: CountRange): string {
	return range.min === range.max ? `${range.min}` : `${range.min}-${range.max}`;
}

/**
 * Check if a count range represents a fixed value
 * @param range - CountRange to check
 * @returns True if min equals max
 */
export function isFixedCount(range: CountRange): boolean {
	return range.min === range.max;
}

/**
 * Calculate the average count for a range
 * @param range - CountRange to calculate average for
 * @returns Average value as floating point
 */
export function getAverageCount(range: CountRange): number {
	return (range.min + range.max) / 2;
}
