export const getType = (value: unknown): string => {
	if (Array.isArray(value)) {
		return "array";
	}
	if (value === null) {
		return "null";
	}
	return typeof value;
};
