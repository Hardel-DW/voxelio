import type { DiffResult } from "../types";
import { compare, getType } from "../utils/compare";
import { diffArray } from "./array-diff";

/**
 * Append diff lines for a single value (used for additions/removals/modifications)
 */
const appendValueLines = (lines: DiffResult[], key: string, value: unknown, level: number, type: "add" | "remove" | "modify"): void => {
	const jsonStr = JSON.stringify(value, null, 2);
	const valueLines = jsonStr.split("\n");

	for (let i = 0; i < valueLines.length; i++) {
		const text = valueLines[i].replace(/^\s+/, "").replace(/,$/g, "");
		const indentLevel = level + (valueLines[i].match(/^\s+/)?.[0]?.length ?? 0) / 2;
		lines.push({
			level: indentLevel,
			type,
			text: i === 0 && key ? `"${key}": ${text}` : text
		});
	}
};

/**
 * Compare two JSON objects and generate diff results
 */
export const diffObject = (lhs: Record<string, unknown>, rhs: Record<string, unknown>, level = 1): [DiffResult[], DiffResult[]] => {
	const linesLeft: DiffResult[] = [];
	const linesRight: DiffResult[] = [];

	// Handle null/undefined cases
	if (lhs === null || lhs === undefined) {
		appendValueLines(linesRight, "", rhs, level, "add");
		for (const _line of linesRight) {
			linesLeft.push({ level, type: "equal", text: "" });
		}
		return [linesLeft, linesRight];
	}

	if (rhs === null || rhs === undefined) {
		appendValueLines(linesLeft, "", lhs, level, "remove");
		for (const _line of linesLeft) {
			linesRight.push({ level, type: "equal", text: "" });
		}
		return [linesLeft, linesRight];
	}

	// Build key order map (preserve order from left object)
	const keysLeft = Object.keys(lhs);
	const keysRight = Object.keys(rhs);
	const keyOrdersMap = new Map<string, number>();

	for (let i = 0; i < keysLeft.length; i++) {
		keyOrdersMap.set(keysLeft[i], i);
	}
	for (let i = 0; i < keysRight.length; i++) {
		if (!keyOrdersMap.has(keysRight[i])) {
			keyOrdersMap.set(keysRight[i], keysLeft.length + i);
		}
	}

	// Sort right keys according to left order
	keysRight.sort((a, b) => (keyOrdersMap.get(a) ?? 0) - (keyOrdersMap.get(b) ?? 0));

	const keysCmpOptions = { keyOrdersMap };

	// Process all keys
	while (keysLeft.length || keysRight.length) {
		const keyLeft = keysLeft[0];
		const keyRight = keysRight[0];
		const keyCmpResult = compare(keyLeft, keyRight, keysCmpOptions);

		if (keyCmpResult === 0) {
			// Same key - compare values
			const typeLeft = getType(lhs[keyLeft]);
			const typeRight = getType(rhs[keyRight]);

			if (typeLeft !== typeRight || (typeLeft !== "object" && typeLeft !== "array")) {
				// Different types or primitive values - show as modification
				if (lhs[keyLeft] === rhs[keyRight]) {
					// Equal values
					const jsonStr = JSON.stringify(lhs[keyLeft]);
					linesLeft.push({ level, type: "equal", text: `"${keyLeft}": ${jsonStr}` });
					linesRight.push({ level, type: "equal", text: `"${keyRight}": ${jsonStr}` });
				} else {
					// Modified values
					const jsonLeft = JSON.stringify(lhs[keyLeft]);
					const jsonRight = JSON.stringify(rhs[keyRight]);
					linesLeft.push({ level, type: "modify", text: `"${keyLeft}": ${jsonLeft}` });
					linesRight.push({ level, type: "modify", text: `"${keyRight}": ${jsonRight}` });
				}
			} else if (typeLeft === "array") {
				// Array - use array diff
				const [arrayLeft, arrayRight] = diffArray(
					lhs[keyLeft] as unknown[],
					rhs[keyRight] as unknown[],
					keyLeft,
					keyRight,
					level
				);
				linesLeft.push(...arrayLeft);
				linesRight.push(...arrayRight);
			} else if (typeLeft === "object") {
				// Nested object - recurse
				const [nestedLeft, nestedRight] = diffObject(
					lhs[keyLeft] as Record<string, unknown>,
					rhs[keyRight] as Record<string, unknown>,
					level + 1
				);
				linesLeft.push({ level, type: "equal", text: `"${keyLeft}": {` });
				linesLeft.push(...nestedLeft);
				linesLeft.push({ level, type: "equal", text: "}" });
				linesRight.push({ level, type: "equal", text: `"${keyRight}": {` });
				linesRight.push(...nestedRight);
				linesRight.push({ level, type: "equal", text: "}" });
			}

			keysLeft.shift();
			keysRight.shift();
		} else if (keysLeft.length && keysRight.length) {
			// Different keys - one added, one removed
			if (keyCmpResult < 0) {
				// Key only in left (removed)
				const beforeLen = linesLeft.length;
				appendValueLines(linesLeft, keyLeft, lhs[keyLeft], level, "remove");
				const addedLines = linesLeft.length - beforeLen;
				for (let i = 0; i < addedLines; i++) {
					linesRight.push({ level, type: "equal", text: "" });
				}
				keysLeft.shift();
			} else {
				// Key only in right (added)
				const beforeLen = linesRight.length;
				appendValueLines(linesRight, keyRight, rhs[keyRight], level, "add");
				const addedLines = linesRight.length - beforeLen;
				for (let i = 0; i < addedLines; i++) {
					linesLeft.push({ level, type: "equal", text: "" });
				}
				keysRight.shift();
			}
		} else if (keysLeft.length) {
			// Only left keys remain (all removed)
			const beforeLen = linesLeft.length;
			appendValueLines(linesLeft, keyLeft, lhs[keyLeft], level, "remove");
			const addedLines = linesLeft.length - beforeLen;
			for (let i = 0; i < addedLines; i++) {
				linesRight.push({ level, type: "equal", text: "" });
			}
			keysLeft.shift();
		} else if (keysRight.length) {
			// Only right keys remain (all added)
			const beforeLen = linesRight.length;
			appendValueLines(linesRight, keyRight, rhs[keyRight], level, "add");
			const addedLines = linesRight.length - beforeLen;
			for (let i = 0; i < addedLines; i++) {
				linesLeft.push({ level, type: "equal", text: "" });
			}
			keysRight.shift();
		}
	}

	return [linesLeft, linesRight];
};
