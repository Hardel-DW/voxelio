const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

export const reorderKeysLike = (source: unknown, target: unknown): unknown => {
	if (Array.isArray(target)) {
		if (!Array.isArray(source) || source.length === 0) {
			return target.map((item) => reorderKeysLike(undefined, item));
		}
		return target.map((item, index) => {
			const template = index < source.length ? source[index] : source[source.length - 1];
			return reorderKeysLike(template, item);
		});
	}

	if (!isPlainObject(target) || !isPlainObject(source)) {
		if (isPlainObject(target)) {
			return reorderKeysLike({}, target);
		}
		return target;
	}

	const sourceKeys = new Set(Object.keys(source));
	const orderedKeys: string[] = [];

	for (const key of Object.keys(source)) {
		if (Object.hasOwn(target, key)) {
			orderedKeys.push(key);
		}
	}

	for (const key of Object.keys(target)) {
		if (!sourceKeys.has(key)) {
			orderedKeys.push(key);
		}
	}

	const result: Record<string, unknown> = {};
	for (const key of orderedKeys) {
		const nextSource = isPlainObject(source) ? source[key] : undefined;
		result[key] = reorderKeysLike(nextSource, target[key]);
	}
	return result;
};
