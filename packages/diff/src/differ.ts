import type { DiffResult } from "./types";
import { detectCircular } from "./utils/detect-circular";
import { diffArrayLCS } from "./utils/diff-array-lcs";
import { diffObject } from "./utils/diff-object";
import { getType } from "./utils/get-type";
import { stringify } from "./utils/stringify";
import { sortInnerArrays } from "./utils/sort-inner-arrays";
import { cleanFields } from "./utils/clean-fields";

const EQUAL_EMPTY_LINE: DiffResult = { level: 0, type: "equal", text: "" };
const EQUAL_LEFT_BRACKET_LINE: DiffResult = { level: 0, type: "equal", text: "{" };
const EQUAL_RIGHT_BRACKET_LINE: DiffResult = { level: 0, type: "equal", text: "}" };

export class Differ {

	private detectCircularReference(source: unknown): void {
		if (detectCircular(source)) {
			throw new Error(
				`Circular reference detected in object (with keys ${Object.keys(source as object)
					.map((t) => `"${t}"`)
					.join(", ")})`
			);
		}
	}

	private sortResultLines(left: DiffResult[], right: DiffResult[]): void {
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
			if (!changed) {
				break;
			}
		}
	}

	private calculateLineNumbers(result: DiffResult[]): void {
		let lineNumber = 0;
		for (const item of result) {
			if (!item.text) {
				continue;
			}
			item.lineNumber = ++lineNumber;
		}
	}

	private calculateCommas(result: DiffResult[]): void {
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
	}

	private formatToDiff(left: DiffResult[], right: DiffResult[]): string {
		const lines: string[] = [];
		const chunks: { start: number; end: number }[] = [];
		let inChunk = false;
		let chunkStart = 0;

		for (let i = 0; i < left.length; i++) {
			const hasChange = left[i].type !== "equal" || right[i].type !== "equal";

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

		// Generate diff output
		for (const chunk of chunks) {
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
	}

	diff(sourceLeft: unknown, sourceRight: unknown): string {
		this.detectCircularReference(sourceLeft);
		this.detectCircularReference(sourceRight);

		let processedLeft = sortInnerArrays(sourceLeft);
		let processedRight = sortInnerArrays(sourceRight);

		processedLeft = cleanFields(processedLeft) ?? null;
		processedRight = cleanFields(processedRight) ?? null;

		let resultLeft: DiffResult[] = [];
		let resultRight: DiffResult[] = [];

		const typeLeft = getType(processedLeft);
		const typeRight = getType(processedRight);

		if (typeLeft !== typeRight) {
			const strLeft = stringify(processedLeft, undefined, 1, null);
			resultLeft = strLeft.split("\n").map((line) => ({
				level: line.match(/^\s+/)?.[0]?.length ?? 0,
				type: "remove",
				text: line.replace(/^\s+/, "").replace(/,$/g, ""),
				comma: line.endsWith(",")
			}));
			const strRight = stringify(processedRight, undefined, 1, null);
			resultRight = strRight.split("\n").map((line) => ({
				level: line.match(/^\s+/)?.[0]?.length ?? 0,
				type: "add",
				text: line.replace(/^\s+/, "").replace(/,$/g, ""),
				comma: line.endsWith(",")
			}));
			const lLength = resultLeft.length;
			const rLength = resultRight.length;
			resultLeft = [
				...resultLeft,
				...Array(rLength)
					.fill(0)
					.map(() => ({ ...EQUAL_EMPTY_LINE }))
			];
			resultRight = [
				...Array(lLength)
					.fill(0)
					.map(() => ({ ...EQUAL_EMPTY_LINE })),
				...resultRight
			];
		} else if (typeLeft === "object") {
			[resultLeft, resultRight] = diffObject(
				processedLeft as Record<string, unknown>,
				processedRight as Record<string, unknown>,
				1
			);
			resultLeft.unshift({ ...EQUAL_LEFT_BRACKET_LINE });
			resultLeft.push({ ...EQUAL_RIGHT_BRACKET_LINE });
			resultRight.unshift({ ...EQUAL_LEFT_BRACKET_LINE });
			resultRight.push({ ...EQUAL_RIGHT_BRACKET_LINE });
		} else if (typeLeft === "array") {
			[resultLeft, resultRight] = diffArrayLCS(processedLeft as unknown[], processedRight as unknown[], "", "", 0);
		} else if (processedLeft !== processedRight) {
			resultLeft = [
				{
					level: 0,
					type: "modify",
					text: stringify(processedLeft, undefined, undefined, null)
				}
			];
			resultRight = [
				{
					level: 0,
					type: "modify",
					text: stringify(processedRight, undefined, undefined, null)
				}
			];
		} else {
			resultLeft = [
				{
					level: 0,
					type: "equal",
					text: stringify(processedLeft, undefined, undefined, null)
				}
			];
			resultRight = [
				{
					level: 0,
					type: "equal",
					text: stringify(processedRight, undefined, undefined, null)
				}
			];
		}

		this.sortResultLines(resultLeft, resultRight);
		this.calculateLineNumbers(resultLeft);
		this.calculateLineNumbers(resultRight);
		this.calculateCommas(resultLeft);
		this.calculateCommas(resultRight);

		return this.formatToDiff(resultLeft, resultRight);
	}

	static apply(obj: unknown, patch: string): Record<string, unknown> {
		// Convert object to JSON lines
		const originalJson = JSON.stringify(obj, null, 2);
		const originalLines = originalJson.split("\n");

		// Parse patch to get modifications
		const patchLines = patch.split("\n");
		const modifications = new Map<number, { remove: string[]; add: string[] }>();

		let currentLineNum = 0;
		let i = 0;

		while (i < patchLines.length) {
			const line = patchLines[i];

			// Parse hunk header @@ -X,Y +A,B @@
			if (line.startsWith("@@")) {
				const match = line.match(/@@ -(\d+),\d+ \+(\d+),\d+ @@/);
				if (match) {
					currentLineNum = Number.parseInt(match[1], 10) - 1;
				}
				i++;
				continue;
			}

			if (!modifications.has(currentLineNum)) {
				modifications.set(currentLineNum, { remove: [], add: [] });
			}

			if (line.startsWith("-")) {
				modifications.get(currentLineNum)?.remove.push(line.slice(1));
				i++;
			} else if (line.startsWith("+")) {
				modifications.get(currentLineNum)?.add.push(line.slice(1));
				i++;
			} else if (line.startsWith(" ")) {
				// Context line, skip
				currentLineNum++;
				i++;
			} else {
				i++;
			}
		}

		const resultLines: string[] = [];
		for (let idx = 0; idx < originalLines.length; idx++) {
			if (idx < -1) {
				continue;
			}

			const mod = modifications.get(idx);
			if (mod) {
				if (mod.remove.length > 0) {
					const originalTrimmed = originalLines[idx].trimStart();
					const shouldRemove = mod.remove.some((r) => originalTrimmed === r.trimStart());

					if (shouldRemove) {
						for (const addLine of mod.add) {
							resultLines.push(addLine);
						}
						continue;
					}
				}

				if (mod.remove.length === 0 && mod.add.length > 0) {
					resultLines.push(originalLines[idx]);
					for (const addLine of mod.add) {
						resultLines.push(addLine);
					}
					continue;
				}
			}

			resultLines.push(originalLines[idx]);
		}

		try {
			return JSON.parse(resultLines.join("\n"));
		} catch {
			return obj as Record<string, unknown>;
		}
	}
}
