import { stringify } from "./stringify";

export const formatValue = (value: unknown, depth: number | null = Number.POSITIVE_INFINITY, pretty = false): string => {
	if (value === null) {
		return "null";
	}
	if (Array.isArray(value) || typeof value === "object") {
		return stringify(value, undefined, pretty ? 1 : undefined, depth);
	}
	return stringify(value, undefined, undefined, undefined);
};
