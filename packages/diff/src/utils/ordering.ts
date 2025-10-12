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

const isPrimitive = (value: unknown): value is string | number | boolean | null =>
	value === null || ["string", "number", "boolean"].includes(typeof value);

const primitiveKey = (value: string | number | boolean | null): string => {
	if (value === null) return "null:null";
	return `${typeof value}:${String(value)}`;
};

const reorderPrimitiveArray = (source: unknown[], target: unknown[]): unknown[] => {
	const sourcePositions = new Map<string, number[]>();

	for (let index = 0; index < source.length; index++) {
		const value = source[index];
		if (!isPrimitive(value)) continue;
		const key = primitiveKey(value);
		const positions = sourcePositions.get(key);
		if (positions) {
			positions.push(index);
		} else {
			sourcePositions.set(key, [index]);
		}
	}

	const usedPositions = new Map<string, number>();
	const matched: Array<{ index: number; value: unknown }> = [];
	const unmatched: unknown[] = [];

	for (const value of target) {
		if (!isPrimitive(value)) {
			unmatched.push(value);
			continue;
		}

		const key = primitiveKey(value);
		const positions = sourcePositions.get(key);
		if (!positions || positions.length === 0) {
			unmatched.push(value);
			continue;
		}

		const used = usedPositions.get(key) ?? 0;
		if (used >= positions.length) {
			unmatched.push(value);
			continue;
		}

		matched.push({ index: positions[used], value });
		usedPositions.set(key, used + 1);
	}

	matched.sort((a, b) => a.index - b.index);
	return matched.map((entry) => entry.value).concat(unmatched);
};

export interface ReorderOptions {
	cleanNewEmptyCollections?: boolean;
}

export const reorderKeysLike = (source: unknown, target: unknown, options?: ReorderOptions): unknown => {
	if (Array.isArray(target)) {
		if (!Array.isArray(source) || source.length === 0) {
			return target.map((item) => reorderKeysLike(undefined, item, options));
		}

		const sourceArray = source as unknown[];
		if (sourceArray.every(isPrimitive) && target.every(isPrimitive)) {
			return reorderPrimitiveArray(sourceArray, target);
		}

		return target.map((item, index) => {
			const template = index < sourceArray.length ? sourceArray[index] : sourceArray[sourceArray.length - 1];
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
