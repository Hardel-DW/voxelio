/**
 * Deep equality check for JSON values
 */
export const isEqual = (a: unknown, b: unknown): boolean => {
	if (a === b) {
		return true;
	}

	if (!a || !b || typeof a !== "object" || typeof b !== "object") {
		return false;
	}

	const arrayA = Array.isArray(a);
	const arrayB = Array.isArray(b);
	if (arrayA !== arrayB) {
		return false;
	}

	if (arrayA && arrayB) {
		const left = a as unknown[];
		const right = b as unknown[];
		return left.length === right.length && left.every((value, index) => isEqual(value, right[index]));
	}

	const left = a as Record<string, unknown>;
	const right = b as Record<string, unknown>;
	const keysLeft = Object.keys(left);
	const keysRight = Object.keys(right);
	if (keysLeft.length !== keysRight.length) {
		return false;
	}

	for (let index = 0; index < keysLeft.length; index++) {
		const key = keysLeft[index];
		if (key !== keysRight[index]) {
			return false;
		}
		if (!isEqual(left[key], right[key])) {
			return false;
		}
	}

	return true;
};