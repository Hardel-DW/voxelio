interface CmpOptions {
	ignoreCase?: boolean;
	keyOrdersMap?: Map<string, number>;
}

const getOrderByType = (value: unknown): number => {
	if (typeof value === "boolean") {
		return 0;
	}
	if (typeof value === "number") {
		return 1;
	}
	if (typeof value === "string") {
		return 2;
	}
	if (value === null) {
		return 3;
	}
	if (Array.isArray(value)) {
		return 4;
	}
	if (typeof value === "object") {
		return 5;
	}
	if (typeof value === "symbol") {
		return 6;
	}
	if (typeof value === "function") {
		return 7;
	}
	if (typeof value === "bigint") {
		return 8;
	}
	return -1;
};

export const cmp = (a: unknown, b: unknown, options: CmpOptions): number => {
	const orderByMapA = options.keyOrdersMap?.get(a as string);
	const orderByMapB = options.keyOrdersMap?.get(b as string);
	if (orderByMapA !== undefined && orderByMapB !== undefined) {
		return orderByMapA - orderByMapB;
	}

	const orderByTypeA = getOrderByType(a);
	const orderByTypeB = getOrderByType(b);

	if (orderByTypeA !== orderByTypeB) {
		return orderByTypeA - orderByTypeB;
	}

	if ((a === null && b === null) || (Array.isArray(a) && Array.isArray(b)) || (orderByTypeA === 5 && orderByTypeB === 5)) {
		return 0;
	}

	switch (typeof a) {
		case "number":
			if (
				(Number.isNaN(a) && Number.isNaN(b)) ||
				(a === Number.POSITIVE_INFINITY && b === Number.POSITIVE_INFINITY) ||
				(a === Number.NEGATIVE_INFINITY && b === Number.NEGATIVE_INFINITY)
			) {
				return 0;
			}
			return (a as number) - (b as number);
		case "string":
			if (options.ignoreCase) {
				return (a as string).toLowerCase().localeCompare((b as string).toLowerCase());
			}
			return (a as string) < (b as string) ? -1 : (a as string) > (b as string) ? 1 : 0;
		case "boolean":
			return +(a as boolean) - +(b as boolean);
		case "symbol":
		case "function":
			return String(a).localeCompare(String(b));
	}

	if (typeof a === "bigint" && typeof b === "bigint") {
		const result = a - b;
		return result < 0 ? -1 : result > 0 ? 1 : 0;
	}

	return String(a).localeCompare(String(b));
};
