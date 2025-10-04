export const concat = <T, U>(a: T[], b: U[], prependEach = false): (T | U)[] => {
	if (!Array.isArray(a) || !Array.isArray(b)) {
		throw new Error("Both arguments should be arrays.");
	}
	const lenA = a.length;
	const lenB = b.length;
	const len = lenA + lenB;
	const result = new Array(len);
	if (prependEach) {
		for (let i = 0; i < lenB; i++) {
			result[i] = b[lenB - i - 1];
		}
		for (let i = 0; i < lenA; i++) {
			result[i + lenB] = a[i];
		}
		return result;
	}
	for (let i = 0; i < lenA; i++) {
		result[i] = a[i];
	}
	for (let i = 0; i < lenB; i++) {
		result[i + lenA] = b[i];
	}
	return result;
};
