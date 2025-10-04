import { isEqual } from "./equality";

const identifierCandidates = ["id", "uuid", "key"] as const;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const shareIdentifier = (left: Record<string, unknown>, right: Record<string, unknown>): boolean =>
	identifierCandidates.some((key) => {
		if (!Object.hasOwn(left, key) || !Object.hasOwn(right, key)) {
			return false;
		}
		const leftValue = left[key];
		const rightValue = right[key];
		return (
			(typeof leftValue === "string" || typeof leftValue === "number") &&
			(typeof rightValue === "string" || typeof rightValue === "number") &&
			leftValue === rightValue
		);
	});

const overlapRatio = (
	left: Record<string, unknown>,
	right: Record<string, unknown>,
	predicate: (key: string) => boolean = () => true
): number => {
	const leftKeys = Object.keys(left);
	const rightKeys = Object.keys(right);
	if (!leftKeys.length || !rightKeys.length) {
		return 0;
	}

	const rightSet = new Set(rightKeys);
	let matches = 0;

	for (const key of leftKeys) {
		if (!rightSet.has(key) || !predicate(key)) {
			continue;
		}
		matches++;
	}

	return matches / Math.max(leftKeys.length, rightKeys.length);
};

const arePlainObjectsSimilar = (left: Record<string, unknown>, right: Record<string, unknown>): boolean => {
	const keyOverlap = overlapRatio(left, right);
	if (keyOverlap === 0) {
		return false;
	}
	if (shareIdentifier(left, right) || keyOverlap > 0.5) {
		return true;
	}
	return overlapRatio(left, right, (key) => isEqual(left[key], right[key])) > 0.5;
};

export const areArrayItemsMatchable = (left: unknown, right: unknown): boolean =>
	isEqual(left, right) || (isPlainObject(left) && isPlainObject(right) && arePlainObjectsSimilar(left, right));
