const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const isEmptyCollection = (value: unknown): boolean => {
	if (Array.isArray(value)) {
		return value.length === 0;
	}
	if (isPlainObject(value)) {
		return Object.keys(value).length === 0;
	}
	return false;
};

export interface ReorderOptions {
	cleanNewEmptyCollections?: boolean;
}

export const reorderKeysLike = (source: unknown, target: unknown, options?: ReorderOptions): unknown => {
	if (Array.isArray(target)) {
		if (!Array.isArray(source) || source.length === 0) {
			return target.map((item) => reorderKeysLike(undefined, item, options));
		}
		return target.map((item, index) => {
			const template = index < source.length ? source[index] : source[source.length - 1];
			return reorderKeysLike(template, item, options);
		});
	}

	if (!isPlainObject(target) || !isPlainObject(source)) {
		if (isPlainObject(target)) {
			return reorderKeysLike({}, target, options);
		}
		return target;
	}

	const typedSource = source as Record<string, unknown>;
	const typedTarget = target as Record<string, unknown>;

	const sourceKeys = new Set(Object.keys(typedSource));
	const orderedKeys: string[] = [];

	for (const key of Object.keys(typedSource)) {
		if (Object.hasOwn(typedTarget, key)) {
			orderedKeys.push(key);
		}
	}

	for (const key of Object.keys(typedTarget)) {
		if (!sourceKeys.has(key)) {
			orderedKeys.push(key);
		}
	}

	const result: Record<string, unknown> = {};
	for (const key of orderedKeys) {
		const nextSource = typedSource[key];
		const value = reorderKeysLike(nextSource, typedTarget[key], options);

		if (options?.cleanNewEmptyCollections) {
			const sourceHasKey = Object.hasOwn(typedSource, key);
			if (!sourceHasKey && isEmptyCollection(value)) {
				continue;
			}
		}

		result[key] = value;
	}
	return result;
};
