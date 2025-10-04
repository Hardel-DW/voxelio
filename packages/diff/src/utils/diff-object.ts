import type { DiffResult } from "../types";
import { diffArrayLCS } from "./diff-array-lcs";
import { cmp } from "./cmp";
import { concat } from "./concat";
import { getType } from "./get-type";
import { prettyAppendLines } from "./pretty-append-lines";
import { stringify } from "./stringify";

export const diffObject = (
	lhs: Record<string, unknown>,
	rhs: Record<string, unknown>,
	level = 1
): [DiffResult[], DiffResult[]] => {
	const maxDepth = Number.POSITIVE_INFINITY;
	if (level > maxDepth) {
		return [[{ level, type: "equal", text: "..." }], [{ level, type: "equal", text: "..." }]];
	}

	let linesLeft: DiffResult[] = [];
	let linesRight: DiffResult[] = [];

	if ((lhs === null && rhs === null) || (lhs === undefined && rhs === undefined)) {
		return [linesLeft, linesRight];
	}
	if (lhs === null || lhs === undefined) {
		const addedLines = stringify(rhs, undefined, 1, null).split("\n");
		for (const line of addedLines) {
			linesLeft.push({ level, type: "equal", text: "" });
			linesRight.push({
				level: level + (line.match(/^\s+/)?.[0]?.length ?? 0),
				type: "add",
				text: line.replace(/^\s+/, "").replace(/,$/g, "")
			});
		}
		return [linesLeft, linesRight];
	}
	if (rhs === null || rhs === undefined) {
		const addedLines = stringify(lhs, undefined, 1, null).split("\n");
		for (const line of addedLines) {
			linesLeft.push({
				level: level + (line.match(/^\s+/)?.[0]?.length ?? 0),
				type: "remove",
				text: line.replace(/^\s+/, "").replace(/,$/g, "")
			});
			linesRight.push({ level, type: "equal", text: "" });
		}
		return [linesLeft, linesRight];
	}

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
	keysRight.sort((a, b) => (keyOrdersMap.get(a) ?? 0) - (keyOrdersMap.get(b) ?? 0));

	const keysCmpOptions = {
		ignoreCase: false,
		keyOrdersMap
	};

	while (keysLeft.length || keysRight.length) {
		const keyLeft = keysLeft[0];
		const keyRight = keysRight[0];
		const keyCmpResult = cmp(keyLeft, keyRight, keysCmpOptions);

		if (keyCmpResult === 0) {
			if (getType(lhs[keyLeft]) !== getType(rhs[keyRight])) {
				prettyAppendLines(linesLeft, linesRight, keyLeft, keyRight, lhs[keyLeft], rhs[keyRight], level);
			} else if (Array.isArray(lhs[keyLeft])) {
				const arrLeft = [...(lhs[keyLeft] as unknown[])];
				const arrRight = [...(rhs[keyRight] as unknown[])];
				const [resLeft, resRight] = diffArrayLCS(arrLeft, arrRight, keyLeft, keyRight, level, [], []);
				linesLeft = concat(linesLeft, resLeft);
				linesRight = concat(linesRight, resRight);
			} else if (lhs[keyLeft] === null) {
				linesLeft.push({ level, type: "equal", text: `"${keyLeft}": null` });
				linesRight.push({ level, type: "equal", text: `"${keyRight}": null` });
			} else if (typeof lhs[keyLeft] === "object") {
				const result = diffObject(
					lhs[keyLeft] as Record<string, unknown>,
					rhs[keyRight] as Record<string, unknown>,
					level + 1
				);
				linesLeft.push({ level, type: "equal", text: `"${keyLeft}": {` });
				linesLeft = concat(linesLeft, result[0]);
				linesLeft.push({ level, type: "equal", text: "}" });
				linesRight.push({ level, type: "equal", text: `"${keyRight}": {` });
				linesRight = concat(linesRight, result[1]);
				linesRight.push({ level, type: "equal", text: "}" });
			} else {
				prettyAppendLines(linesLeft, linesRight, keyLeft, keyRight, lhs[keyLeft], rhs[keyRight], level);
			}
		} else if (keysLeft.length && keysRight.length) {
			if (keyCmpResult < 0) {
				const addedLines = stringify(lhs[keyLeft], undefined, 1, null).split("\n");
				for (let i = 0; i < addedLines.length; i++) {
					const text = addedLines[i].replace(/^\s+/, "").replace(/,$/g, "");
					linesLeft.push({
						level: level + (addedLines[i].match(/^\s+/)?.[0]?.length ?? 0),
						type: "remove",
						text: i ? text : `"${keyLeft}": ${text}`
					});
					linesRight.push({ level, type: "equal", text: "" });
				}
			} else {
				const addedLines = stringify(rhs[keyRight], undefined, 1, null).split("\n");
				for (let i = 0; i < addedLines.length; i++) {
					const text = addedLines[i].replace(/^\s+/, "").replace(/,$/g, "");
					linesLeft.push({ level, type: "equal", text: "" });
					linesRight.push({
						level: level + (addedLines[i].match(/^\s+/)?.[0]?.length ?? 0),
						type: "add",
						text: i ? text : `"${keyRight}": ${text}`
					});
				}
			}
		} else if (keysLeft.length) {
			const addedLines = stringify(lhs[keyLeft], undefined, 1, null).split("\n");
			for (let i = 0; i < addedLines.length; i++) {
				const text = addedLines[i].replace(/^\s+/, "").replace(/,$/g, "");
				linesLeft.push({
					level: level + (addedLines[i].match(/^\s+/)?.[0]?.length ?? 0),
					type: "remove",
					text: i ? text : `"${keyLeft}": ${text}`
				});
				linesRight.push({ level, type: "equal", text: "" });
			}
		} else if (keysRight.length) {
			const addedLines = stringify(rhs[keyRight], undefined, 1, null).split("\n");
			for (let i = 0; i < addedLines.length; i++) {
				const text = addedLines[i].replace(/^\s+/, "").replace(/,$/g, "");
				linesLeft.push({ level, type: "equal", text: "" });
				linesRight.push({
					level: level + (addedLines[i].match(/^\s+/)?.[0]?.length ?? 0),
					type: "add",
					text: i ? text : `"${keyRight}": ${text}`
				});
			}
		}

		if (!keyLeft) {
			keysRight.shift();
		} else if (!keyRight) {
			keysLeft.shift();
		} else if (keyCmpResult === 0) {
			keysLeft.shift();
			keysRight.shift();
		} else if (keyCmpResult < 0) {
			keysLeft.shift();
		} else {
			keysRight.shift();
		}
	}

	if (linesLeft.length !== linesRight.length) {
		throw new Error("Diff error: length not match for left & right, please report a bug with your data.");
	}

	return [linesLeft, linesRight];
};
