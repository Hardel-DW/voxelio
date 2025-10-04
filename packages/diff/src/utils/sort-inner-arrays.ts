import { stringify } from "./stringify";

export const sortInnerArrays = (obj: unknown): unknown => {
	if (obj === null || obj === undefined) {
		return obj;
	}

	if (Array.isArray(obj)) {
		const sorted = obj.map((item) => sortInnerArrays(item));
		return sorted.toSorted((a, b) => {
			const strA = stringify(a);
			const strB = stringify(b);
			return strA.localeCompare(strB);
		});
	}

	if (typeof obj === "object") {
		const result: Record<string, unknown> = {};
		for (const key in obj) {
			result[key] = sortInnerArrays((obj as Record<string, unknown>)[key]);
		}
		return result;
	}

	return obj;
};
