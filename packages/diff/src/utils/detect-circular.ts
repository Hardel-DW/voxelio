export const detectCircular = (value: unknown, map: Map<unknown, boolean> = new Map()): boolean => {
	if (typeof value !== "object" || value === null) {
		return false;
	}

	if (map.has(value)) {
		return true;
	}
	map.set(value, true);

	if (Array.isArray(value)) {
		for (const item of value) {
			if (detectCircular(item, map)) {
				return true;
			}
		}
		return false;
	}

	for (const key in value) {
		if (detectCircular((value as Record<string, unknown>)[key], map)) {
			return true;
		}
	}
	return false;
};
