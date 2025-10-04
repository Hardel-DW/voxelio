import type { DiffResult } from "../types";
import { isEqual, shallowSimilarity } from "../utils/equality";
import { getType } from "../utils/compare";
import { diffObject } from "./json-diff";

/**
 * Longest Common Subsequence algorithm for array comparison
 */
const computeLCS = (arrLeft: unknown[], arrRight: unknown[], level: number): [DiffResult[], DiffResult[]] => {
	const m = arrLeft.length;
	const n = arrRight.length;

	// DP table for LCS length
	const dp = Array(m + 1)
		.fill(0)
		.map(() => Array(n + 1).fill(0));

	// Backtrack direction: 'diag', 'up', 'left'
	const backtrack = Array(m + 1)
		.fill(0)
		.map(() => Array(n + 1).fill(""));

	// Initialize backtrack
	for (let i = 1; i <= m; i++) {
		backtrack[i][0] = "up";
	}
	for (let j = 1; j <= n; j++) {
		backtrack[0][j] = "left";
	}

	// Fill DP table
	for (let i = 1; i <= m; i++) {
		for (let j = 1; j <= n; j++) {
			const typeI = getType(arrLeft[i - 1]);
			const typeJ = getType(arrRight[j - 1]);

			if (typeI === typeJ && (typeI === "array" || typeI === "object")) {
				// For complex types, use equality or similarity check
				if (isEqual(arrLeft[i - 1], arrRight[j - 1]) || shallowSimilarity(arrLeft[i - 1], arrRight[j - 1]) > 0.5) {
					dp[i][j] = dp[i - 1][j - 1] + 1;
					backtrack[i][j] = "diag";
				} else if (dp[i - 1][j] >= dp[i][j - 1]) {
					dp[i][j] = dp[i - 1][j];
					backtrack[i][j] = "up";
				} else {
					dp[i][j] = dp[i][j - 1];
					backtrack[i][j] = "left";
				}
			} else if (isEqual(arrLeft[i - 1], arrRight[j - 1])) {
				dp[i][j] = dp[i - 1][j - 1] + 1;
				backtrack[i][j] = "diag";
			} else if (dp[i - 1][j] >= dp[i][j - 1]) {
				dp[i][j] = dp[i - 1][j];
				backtrack[i][j] = "up";
			} else {
				dp[i][j] = dp[i][j - 1];
				backtrack[i][j] = "left";
			}
		}
	}

	// Reconstruct diff from backtrack
	let i = m;
	let j = n;
	const tLeft: DiffResult[] = [];
	const tRight: DiffResult[] = [];

	while (i > 0 || j > 0) {
		if (backtrack[i][j] === "diag") {
			// Equal or similar - recurse if needed
			const type = getType(arrLeft[i - 1]);
			const jsonStr = JSON.stringify(arrLeft[i - 1], null, 2);
			const lines = jsonStr.split("\n");

			if (type === "object" && !isEqual(arrLeft[i - 1], arrRight[j - 1])) {
				// Objects differ - show nested diff
				const [nestedLeft, nestedRight] = diffObject(
					arrLeft[i - 1] as Record<string, unknown>,
					arrRight[j - 1] as Record<string, unknown>,
					level + 2
				);
				tLeft.unshift({ level: level + 1, type: "equal", text: "}" });
				for (const line of nestedLeft.reverse()) {
					tLeft.unshift(line);
				}
				tLeft.unshift({ level: level + 1, type: "equal", text: "{" });

				tRight.unshift({ level: level + 1, type: "equal", text: "}" });
				for (const line of nestedRight.reverse()) {
					tRight.unshift(line);
				}
				tRight.unshift({ level: level + 1, type: "equal", text: "{" });
			} else {
				// Equal values
				for (let k = lines.length - 1; k >= 0; k--) {
					const text = lines[k].replace(/^\s+/, "").replace(/,$/g, "");
					const indentLevel = level + 1 + (lines[k].match(/^\s+/)?.[0]?.length ?? 0) / 2;
					tLeft.unshift({ level: indentLevel, type: "equal", text });
					tRight.unshift({ level: indentLevel, type: "equal", text });
				}
			}
			i--;
			j--;
		} else if (backtrack[i][j] === "up") {
			// Item removed from left
			const jsonStr = JSON.stringify(arrLeft[i - 1], null, 2);
			const lines = jsonStr.split("\n");
			for (let k = lines.length - 1; k >= 0; k--) {
				const text = lines[k].replace(/^\s+/, "").replace(/,$/g, "");
				const indentLevel = level + 1 + (lines[k].match(/^\s+/)?.[0]?.length ?? 0) / 2;
				tLeft.unshift({ level: indentLevel, type: "remove", text });
				tRight.unshift({ level: level + 1, type: "equal", text: "" });
			}
			i--;
		} else {
			// Item added to right
			const jsonStr = JSON.stringify(arrRight[j - 1], null, 2);
			const lines = jsonStr.split("\n");
			for (let k = lines.length - 1; k >= 0; k--) {
				const text = lines[k].replace(/^\s+/, "").replace(/,$/g, "");
				const indentLevel = level + 1 + (lines[k].match(/^\s+/)?.[0]?.length ?? 0) / 2;
				tLeft.unshift({ level: level + 1, type: "equal", text: "" });
				tRight.unshift({ level: indentLevel, type: "add", text });
			}
			j--;
		}
	}

	return [tLeft, tRight];
};

/**
 * Diff two arrays using LCS algorithm
 */
export const diffArray = (
	arrLeft: unknown[],
	arrRight: unknown[],
	keyLeft: string,
	keyRight: string,
	level: number
): [DiffResult[], DiffResult[]] => {
	const linesLeft: DiffResult[] = [];
	const linesRight: DiffResult[] = [];

	// Add opening brackets
	if (keyLeft && keyRight) {
		linesLeft.push({ level, type: "equal", text: `"${keyLeft}": [` });
		linesRight.push({ level, type: "equal", text: `"${keyRight}": [` });
	} else {
		linesLeft.push({ level, type: "equal", text: "[" });
		linesRight.push({ level, type: "equal", text: "[" });
	}

	// Compute LCS diff
	const [diffLeft, diffRight] = computeLCS(arrLeft, arrRight, level);
	linesLeft.push(...diffLeft);
	linesRight.push(...diffRight);

	// Add closing brackets
	linesLeft.push({ level, type: "equal", text: "]" });
	linesRight.push({ level, type: "equal", text: "]" });

	return [linesLeft, linesRight];
};
