import { isEqual } from "./equality";

const identifierCandidates = ["id", "uuid", "key"] as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};

const shareIdentifier = (left: Record<string, unknown>, right: Record<string, unknown>): boolean => {
	for (const key of identifierCandidates) {
		if (!Object.hasOwn(left, key) || !Object.hasOwn(right, key)) {
			continue;
		}

		const leftValue = left[key];
		const rightValue = right[key];
		const comparableLeft = typeof leftValue === "string" || typeof leftValue === "number";
		const comparableRight = typeof rightValue === "string" || typeof rightValue === "number";

		if (comparableLeft && comparableRight && leftValue === rightValue) {
			return true;
		}
	}
	return false;
};

const keyOverlapRatio = (left: Record<string, unknown>, right: Record<string, unknown>): number => {
	const leftKeys = Object.keys(left);
	const rightKeys = Object.keys(right);
	if (leftKeys.length === 0 || rightKeys.length === 0) {
		return 0;
	}

	let common = 0;
	const rightSet = new Set(rightKeys);
	for (const key of leftKeys) {
		if (rightSet.has(key)) {
			common++;
		}
	}

	return common / Math.max(leftKeys.length, rightKeys.length);
};

const valueOverlapRatio = (left: Record<string, unknown>, right: Record<string, unknown>): number => {
	const leftKeys = Object.keys(left);
	const rightKeys = Object.keys(right);
	if (leftKeys.length === 0 || rightKeys.length === 0) {
		return 0;
	}

	let matches = 0;
	const rightSet = new Set(rightKeys);
	for (const key of leftKeys) {
		if (!rightSet.has(key)) {
			continue;
		}

		if (isEqual(left[key], right[key])) {
			matches++;
		}
	}

	return matches / Math.max(leftKeys.length, rightKeys.length);
};

const arePlainObjectsSimilar = (left: Record<string, unknown>, right: Record<string, unknown>): boolean => {
	const overlap = keyOverlapRatio(left, right);
	if (overlap === 0) {
		return false;
	}

	if (shareIdentifier(left, right)) {
		return true;
	}

	if (overlap > 0.5) {
		return true;
	}

	return valueOverlapRatio(left, right) > 0.5;
};

export const areArrayItemsMatchable = (left: unknown, right: unknown): boolean => {
	if (isEqual(left, right)) {
		return true;
	}

	if (isPlainObject(left) && isPlainObject(right)) {
		return arePlainObjectsSimilar(left, right);
	}

	return false;
};