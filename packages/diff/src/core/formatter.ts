import type { DiffResult } from "../types";

/**
 * Sort result lines to group changes together
 */
const sortResultLines = (left: DiffResult[], right: DiffResult[]): void => {
	for (let k = 0; k < left.length; k++) {
		let changed = false;
		for (let i = 1; i < left.length; i++) {
			if (left[i].type === "remove" && left[i - 1].type === "equal" && right[i].type === "equal" && right[i - 1].type === "add") {
				const t1 = left[i - 1];
				left[i - 1] = left[i];
				left[i] = t1;
				const t2 = right[i - 1];
				right[i - 1] = right[i];
				right[i] = t2;
				changed = true;
			}
		}
		if (!changed) break;
	}
};

/**
 * Calculate line numbers for diff results
 */
const calculateLineNumbers = (result: DiffResult[]): void => {
	let lineNumber = 0;
	for (const item of result) {
		if (!item.text) continue;
		item.lineNumber = ++lineNumber;
	}
};

/**
 * Calculate comma placement for JSON formatting
 */
const calculateCommas = (result: DiffResult[]): void => {
	const nextLine = Array(result.length).fill(0);
	for (let i = result.length - 1; i > 0; i--) {
		if (result[i].text) {
			nextLine[i - 1] = i;
		} else {
			nextLine[i - 1] = nextLine[i];
		}
	}

	for (let i = 0; i < result.length; i++) {
		if (
			!result[i].text.endsWith("{") &&
			!result[i].text.endsWith("[") &&
			result[i].text &&
			nextLine[i] &&
			result[i].level <= result[nextLine[i]].level
		) {
			result[i].comma = true;
		}
	}
};

/**
 * Format diff results into unified diff format (.diff file)
 */
export const formatToDiff = (left: DiffResult[], right: DiffResult[]): string => {
	const lines: string[] = [];
	const chunks: { start: number; end: number }[] = [];
	let inChunk = false;
	let chunkStart = 0;

	// Find chunks of changes
	for (let i = 0; i < left.length; i++) {
		const hasChange = left[i]?.type !== "equal" || right[i]?.type !== "equal";

		if (hasChange && !inChunk) {
			chunkStart = Math.max(0, i - 3);
			inChunk = true;
		} else if (!hasChange && inChunk) {
			chunks.push({ start: chunkStart, end: Math.min(left.length, i + 3) });
			inChunk = false;
		}
	}

	if (inChunk) {
		chunks.push({ start: chunkStart, end: left.length });
	}

	// Merge overlapping chunks
	const mergedChunks: { start: number; end: number }[] = [];
	for (const chunk of chunks) {
		if (mergedChunks.length === 0) {
			mergedChunks.push(chunk);
		} else {
			const lastChunk = mergedChunks[mergedChunks.length - 1];
			if (chunk.start <= lastChunk.end) {
				lastChunk.end = Math.max(lastChunk.end, chunk.end);
			} else {
				mergedChunks.push(chunk);
			}
		}
	}

	// Generate diff output
	for (const chunk of mergedChunks) {
		const leftCount = chunk.end - chunk.start;
		const rightCount = chunk.end - chunk.start;
		lines.push(`@@ -${chunk.start + 1},${leftCount} +${chunk.start + 1},${rightCount} @@`);

		for (let i = chunk.start; i < chunk.end; i++) {
			const leftLine = left[i];
			const rightLine = right[i];

			if (leftLine.type === "remove" && rightLine.type === "equal") {
				const indent = "  ".repeat(leftLine.level);
				lines.push(`-${indent}${leftLine.text}${leftLine.comma ? "," : ""}`);
			} else if (leftLine.type === "equal" && rightLine.type === "add") {
				const indent = "  ".repeat(rightLine.level);
				lines.push(`+${indent}${rightLine.text}${rightLine.comma ? "," : ""}`);
			} else if (leftLine.type === "modify" && rightLine.type === "modify") {
				const indentL = "  ".repeat(leftLine.level);
				const indentR = "  ".repeat(rightLine.level);
				lines.push(`-${indentL}${leftLine.text}${leftLine.comma ? "," : ""}`);
				lines.push(`+${indentR}${rightLine.text}${rightLine.comma ? "," : ""}`);
			} else if (leftLine.type === "equal" && rightLine.type === "equal") {
				const indent = "  ".repeat(leftLine.level);
				lines.push(` ${indent}${leftLine.text}${leftLine.comma ? "," : ""}`);
			}
		}
	}

	return lines.join("\n");
};

/**
 * Process diff results: sort, calculate line numbers and commas, then format
 */
export const processDiffResults = (left: DiffResult[], right: DiffResult[]): string => {
	sortResultLines(left, right);
	calculateLineNumbers(left);
	calculateLineNumbers(right);
	calculateCommas(left);
	calculateCommas(right);
	return formatToDiff(left, right);
};
