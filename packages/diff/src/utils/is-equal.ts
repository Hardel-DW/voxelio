const deepEqual = (a: unknown, b: unknown): boolean => {
	if (a === b) {
		return true;
	}

	if (typeof a === "symbol" && typeof b === "symbol") {
		return a.toString() === b.toString();
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
			if (!deepEqual(a[i], b[i])) {
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
		if (!deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key])) {
			return false;
		}
	}

	return true;
};

export const isEqual = (a: unknown, b: unknown): boolean => {
	return deepEqual(a, b);
};
