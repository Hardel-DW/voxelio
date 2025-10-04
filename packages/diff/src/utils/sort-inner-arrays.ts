import { stringify } from "./stringify";

interface Options {
	ignoreCase?: boolean;
}

export const sortInnerArrays = (obj: unknown, options: Options): unknown => {
	if (obj === null || obj === undefined) {
		return obj;
	}

	if (Array.isArray(obj)) {
		const sorted = obj.map((item) => sortInnerArrays(item, options));
		return sorted.toSorted((a, b) => {
			const strA = stringify(a);
			const strB = stringify(b);
			if (options.ignoreCase) {
				return strA.toLowerCase().localeCompare(strB.toLowerCase());
			}
			return strA.localeCompare(strB);
		});
	}

	if (typeof obj === "object") {
		const result: Record<string, unknown> = {};
		for (const key in obj) {
			result[key] = sortInnerArrays((obj as Record<string, unknown>)[key], options);
		}
		return result;
	}

	return obj;
};
