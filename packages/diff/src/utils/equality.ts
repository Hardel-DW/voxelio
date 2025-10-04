/**
 * Deep equality check for JSON values
 */
export const isEqual = (a: unknown, b: unknown): boolean => {
	if (a === b) {
		return true;
	}

	if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
		return false;
	}

	if (Array.isArray(a) !== Array.isArray(b)) {
		return false;
	}

	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) {
			return false;
		}
		for (let i = 0; i < a.length; i++) {
			if (!isEqual(a[i], b[i])) {
				return false;
			}
		}
		return true;
	}

	const keysA = Object.keys(a as object);
	const keysB = Object.keys(b as object);
	if (keysA.length !== keysB.length) {
		return false;
	}

	for (const key of keysA) {
		if (!keysB.includes(key)) {
			return false;
		}
		if (!isEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
			return false;
		}
	}

	return true;
};

/**
 * Calculate shallow similarity between two objects (used for LCS optimization)
 */
export const shallowSimilarity = (left: unknown, right: unknown): number => {
	if (left === right) {
		return 1;
	}
	if (left === null || right === null) {
		return 0;
	}
	if (typeof left !== "object" || typeof right !== "object") {
		return 0;
	}
	let intersection = 0;
	for (const key in left) {
		if (
			Object.hasOwn(left, key) &&
			Object.hasOwn(right, key) &&
			(left as Record<string, unknown>)[key] === (right as Record<string, unknown>)[key]
		) {
			intersection++;
		}
	}
	return Math.max(intersection / Object.keys(left).length, intersection / Object.keys(right).length);
};
