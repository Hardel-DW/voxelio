const stringifyInvalidValue = (value: unknown): string => {
	if (value === undefined) {
		return "undefined";
	}
	if (value === Number.POSITIVE_INFINITY) {
		return "Infinity";
	}
	if (value === Number.NEGATIVE_INFINITY) {
		return "-Infinity";
	}
	if (Number.isNaN(value)) {
		return "NaN";
	}
	if (typeof value === "bigint") {
		return `${value}n`;
	}
	return String(value);
};

export const stringify = (
	obj: unknown,
	replacer?: (this: unknown, key: string, value: unknown) => unknown,
	space?: string | number,
	depth: number | null = Number.POSITIVE_INFINITY
): string => {
	if (!obj || typeof obj !== "object") {
		let result: string | undefined;
		if (!Number.isNaN(obj) && obj !== Number.POSITIVE_INFINITY && obj !== Number.NEGATIVE_INFINITY && typeof obj !== "bigint") {
			result = JSON.stringify(obj, replacer, space);
		}
		if (result === undefined) {
			return stringifyInvalidValue(obj);
		}
		return result;
	}

	const effectiveDepth = depth ?? Number.POSITIVE_INFINITY;
	const t =
		effectiveDepth < 1
			? '"..."'
			: Array.isArray(obj)
				? `[${(obj as unknown[]).map((v) => stringify(v, replacer, space, effectiveDepth - 1)).join(",")}]`
				: `{${Object.keys(obj)
						.map((k) => `"${k}": ${stringify((obj as Record<string, unknown>)[k], replacer, space, effectiveDepth - 1)}`)
						.join(", ")}}`;
	return JSON.stringify(JSON.parse(t), replacer, space);
};
