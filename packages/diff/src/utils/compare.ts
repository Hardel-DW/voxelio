/**
 * Get type order for sorting (used in key comparison)
 */
const getTypeOrder = (value: unknown): number => {
	if (typeof value === "boolean") return 0;
	if (typeof value === "number") return 1;
	if (typeof value === "string") return 2;
	if (value === null) return 3;
	if (Array.isArray(value)) return 4;
	if (typeof value === "object") return 5;
	return -1;
};

interface CompareOptions {
	keyOrdersMap?: Map<string, number>;
}

/**
 * Compare two JSON values for sorting
 * Returns: -1 if a < b, 0 if a === b, 1 if a > b
 */
export const compare = (a: unknown, b: unknown, options: CompareOptions = {}): number => {
	// Check key order map first (for preserving object key order)
	const orderA = options.keyOrdersMap?.get(a as string);
	const orderB = options.keyOrdersMap?.get(b as string);
	if (orderA !== undefined && orderB !== undefined) {
		return orderA - orderB;
	}

	// Compare by type order
	const typeOrderA = getTypeOrder(a);
	const typeOrderB = getTypeOrder(b);
	if (typeOrderA !== typeOrderB) {
		return typeOrderA - typeOrderB;
	}

	// Same type comparison
	if (a === null && b === null) return 0;
	if (Array.isArray(a) && Array.isArray(b)) return 0;
	if (typeof a === "object" && typeof b === "object") return 0;

	switch (typeof a) {
		case "number":
			return (a as number) - (b as number);
		case "string":
			return (a as string) < (b as string) ? -1 : (a as string) > (b as string) ? 1 : 0;
		case "boolean":
			return Number(a) - Number(b);
	}

	return 0;
};

/**
 * Get the type of a JSON value
 */
export const getType = (value: unknown): string => {
	if (Array.isArray(value)) return "array";
	if (value === null) return "null";
	return typeof value;
};
