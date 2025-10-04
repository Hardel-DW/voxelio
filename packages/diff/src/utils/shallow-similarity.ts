export const shallowSimilarity = (left: unknown, right: unknown): number => {
	if (left === right) {
		return 1;
	}
	if (left === null || right === null) {
		return 0;
	}
	if (typeof left !== "object" || typeof right !== "object") {
		return 0;
	}
	let intersection = 0;
	for (const key in left) {
		if (
			Object.hasOwn(left, key) &&
			Object.hasOwn(right, key) &&
			(left as Record<string, unknown>)[key] === (right as Record<string, unknown>)[key]
		) {
			intersection++;
		}
	}
	return Math.max(intersection / Object.keys(left).length, intersection / Object.keys(right).length);
};
