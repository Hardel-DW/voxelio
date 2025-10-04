import type { DiffResult } from "../types";
import { formatValue } from "./format-value";
import { diffObject } from "./diff-object";
import { getType } from "./get-type";
import { stringify } from "./stringify";
import { isEqual } from "./is-equal";
import { shallowSimilarity } from "./shallow-similarity";
import { concat } from "./concat";
import { prettyAppendLines } from "./pretty-append-lines";

const addArrayOpeningBrackets = (
	linesLeft: DiffResult[],
	linesRight: DiffResult[],
	keyLeft: string,
	keyRight: string,
	level: number
): void => {
	if (keyLeft && keyRight) {
		linesLeft.push({ level, type: "equal", text: `"${keyLeft}": [` });
		linesRight.push({ level, type: "equal", text: `"${keyRight}": [` });
	} else {
		linesLeft.push({ level, type: "equal", text: "[" });
		linesRight.push({ level, type: "equal", text: "[" });
	}
};

const addArrayClosingBrackets = (linesLeft: DiffResult[], linesRight: DiffResult[], level: number): void => {
	linesLeft.push({ level, type: "equal", text: "]" });
	linesRight.push({ level, type: "equal", text: "]" });
};

const addMaxDepthPlaceholder = (linesLeft: DiffResult[], linesRight: DiffResult[], level: number): void => {
	linesLeft.push({ level: level + 1, type: "equal", text: "..." });
	linesRight.push({ level: level + 1, type: "equal", text: "..." });
};

const lcs = (
	arrLeft: unknown[],
	arrRight: unknown[],
	keyLeft: string,
	keyRight: string,
	level: number
): [DiffResult[], DiffResult[]] => {
	const f = Array(arrLeft.length + 1)
		.fill(0)
		.map(() => Array(arrRight.length + 1).fill(0));
	const backtrack = Array(arrLeft.length + 1)
		.fill(0)
		.map(() => Array(arrRight.length + 1).fill(0));

	for (let i = 1; i <= arrLeft.length; i++) {
		backtrack[i][0] = "up";
	}
	for (let j = 1; j <= arrRight.length; j++) {
		backtrack[0][j] = "left";
	}

	for (let i = 1; i <= arrLeft.length; i++) {
		for (let j = 1; j <= arrRight.length; j++) {
			const typeI = getType(arrLeft[i - 1]);
			const typeJ = getType(arrRight[j - 1]);
			if (typeI === typeJ && (typeI === "array" || typeI === "object")) {
				if (isEqual(arrLeft[i - 1], arrRight[j - 1]) || shallowSimilarity(arrLeft[i - 1], arrRight[j - 1]) > 0.5) {
					f[i][j] = f[i - 1][j - 1] + 1;
					backtrack[i][j] = "diag";
				} else if (f[i - 1][j] >= f[i][j - 1]) {
					f[i][j] = f[i - 1][j];
					backtrack[i][j] = "up";
				} else {
					f[i][j] = f[i][j - 1];
					backtrack[i][j] = "left";
				}
			} else if (isEqual(arrLeft[i - 1], arrRight[j - 1])) {
				f[i][j] = f[i - 1][j - 1] + 1;
				backtrack[i][j] = "diag";
			} else if (f[i - 1][j] >= f[i][j - 1]) {
				f[i][j] = f[i - 1][j];
				backtrack[i][j] = "up";
			} else {
				f[i][j] = f[i][j - 1];
				backtrack[i][j] = "left";
			}
		}
	}

	let i = arrLeft.length;
	let j = arrRight.length;
	let tLeft: DiffResult[] = [];
	let tRight: DiffResult[] = [];

	while (i > 0 || j > 0) {
		if (backtrack[i][j] === "diag") {
			const type = getType(arrLeft[i - 1]);
			if ((type === "array" || type === "object") && isEqual(arrLeft[i - 1], arrRight[j - 1])) {
				const reversedLeft = [];
				const reversedRight = [];
				prettyAppendLines(reversedLeft, reversedRight, "", "", arrLeft[i - 1], arrRight[j - 1], level + 1);
				tLeft = concat(tLeft, reversedLeft.reverse(), true);
				tRight = concat(tRight, reversedRight.reverse(), true);
			} else if (type === "array") {
				const [l, r] = diffArrayLCS(
					arrLeft[i - 1] as unknown[],
					arrRight[j - 1] as unknown[],
					keyLeft,
					keyRight,
					level + 1
				);
				tLeft = concat(tLeft, l.reverse(), true);
				tRight = concat(tRight, r.reverse(), true);
			} else if (type === "object") {
				const [l, r] = diffObject(
					arrLeft[i - 1] as Record<string, unknown>,
					arrRight[j - 1] as Record<string, unknown>,
					level + 2
				);
				tLeft.unshift({ level: level + 1, type: "equal", text: "}" });
				tRight.unshift({ level: level + 1, type: "equal", text: "}" });
				tLeft = concat(tLeft, l.reverse(), true);
				tRight = concat(tRight, r.reverse(), true);
				tLeft.unshift({ level: level + 1, type: "equal", text: "{" });
				tRight.unshift({ level: level + 1, type: "equal", text: "{" });
			} else {
				const reversedLeft = [];
				const reversedRight = [];
				prettyAppendLines(reversedLeft, reversedRight, "", "", arrLeft[i - 1], arrRight[j - 1], level + 1);
				tLeft = concat(tLeft, reversedLeft.reverse(), true);
				tRight = concat(tRight, reversedRight.reverse(), true);
			}
			i--;
			j--;
		} else if (backtrack[i][j] === "up") {
			if (i > 1 && backtrack[i - 1][j] === "left") {
				const typeLeft = getType(arrLeft[i - 1]);
				const typeRight = getType(arrRight[j - 1]);
				if (typeLeft === typeRight) {
					if (typeLeft === "array") {
						const [l, r] = diffArrayLCS(
							arrLeft[i - 1] as unknown[],
							arrRight[j - 1] as unknown[],
							keyLeft,
							keyRight,
							level + 1
						);
						tLeft = concat(tLeft, l.reverse(), true);
						tRight = concat(tRight, r.reverse(), true);
					} else if (typeLeft === "object") {
						const [l, r] = diffObject(
							arrLeft[i - 1] as Record<string, unknown>,
							arrRight[j - 1] as Record<string, unknown>,
							level + 2
						);
						tLeft.unshift({ level: level + 1, type: "equal", text: "}" });
						tRight.unshift({ level: level + 1, type: "equal", text: "}" });
						tLeft = concat(tLeft, l.reverse(), true);
						tRight = concat(tRight, r.reverse(), true);
						tLeft.unshift({ level: level + 1, type: "equal", text: "{" });
						tRight.unshift({ level: level + 1, type: "equal", text: "{" });
					} else {
						tLeft.unshift({
							level: level + 1,
							type: "modify",
							text: formatValue(arrLeft[i - 1], undefined, undefined)
						});
						tRight.unshift({
							level: level + 1,
							type: "modify",
							text: formatValue(arrRight[j - 1], undefined, undefined)
						});
					}
				} else {
					const reversedLeft = [];
					const reversedRight = [];
					prettyAppendLines(reversedLeft, reversedRight, "", "", arrLeft[i - 1], arrRight[j - 1], level + 1);
					tLeft = concat(tLeft, reversedLeft.reverse(), true);
					tRight = concat(tRight, reversedRight.reverse(), true);
				}
				i--;
				j--;
			} else {
				const removedLines = stringify(arrLeft[i - 1], undefined, 1, null).split("\n");
				for (let k = removedLines.length - 1; k >= 0; k--) {
					tLeft.unshift({
						level: level + 1 + (removedLines[k].match(/^\s+/)?.[0]?.length ?? 0),
						type: "remove",
						text: removedLines[k].replace(/^\s+/, "").replace(/,$/g, "")
					});
					tRight.unshift({ level: level + 1, type: "equal", text: "" });
				}
				i--;
			}
		} else {
			const addedLines = stringify(arrRight[j - 1], undefined, 1, null).split("\n");
			for (let k = addedLines.length - 1; k >= 0; k--) {
				tLeft.unshift({ level: level + 1, type: "equal", text: "" });
				tRight.unshift({
					level: level + 1 + (addedLines[k].match(/^\s+/)?.[0]?.length ?? 0),
					type: "add",
					text: addedLines[k].replace(/^\s+/, "").replace(/,$/g, "")
				});
			}
			j--;
		}
	}

	return [tLeft, tRight];
};

export const diffArrayLCS = (
	arrLeft: unknown[],
	arrRight: unknown[],
	keyLeft: string,
	keyRight: string,
	level: number,
	linesLeft: DiffResult[] = [],
	linesRight: DiffResult[] = []
): [DiffResult[], DiffResult[]] => {
	addArrayOpeningBrackets(linesLeft, linesRight, keyLeft, keyRight, level);

	const maxDepth = Number.POSITIVE_INFINITY;
	if (level >= maxDepth) {
		addMaxDepthPlaceholder(linesLeft, linesRight, level);
	} else {
		const [tLeftReverse, tRightReverse] = lcs(arrLeft, arrRight, keyLeft, keyRight, level);
		linesLeft = concat(linesLeft, tLeftReverse);
		linesRight = concat(linesRight, tRightReverse);
	}

	addArrayClosingBrackets(linesLeft, linesRight, level);
	return [linesLeft, linesRight];
};
