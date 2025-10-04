export const cleanFields = (obj: unknown): unknown => {
	if (obj === undefined || obj === null) {
		return obj;
	}

	if (Array.isArray(obj)) {
		return obj.map(cleanFields);
	}

	if (typeof obj === "object") {
		const result: Record<string, unknown> = {};
		for (const key in obj) {
			const value = (obj as Record<string, unknown>)[key];
			if (value !== undefined) {
				result[key] = cleanFields(value);
			}
		}
		return result;
	}

	return obj;
};
