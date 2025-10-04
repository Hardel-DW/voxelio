import type { DiffResult, DifferOptions } from "./types";
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
	private readonly options: DifferOptions = {
		detectCircular: true,
		maxDepth: null,
		showModifications: true,
		arrayDiffMethod: "unorder-lcs",
		ignoreCase: false,
		ignoreCaseForKey: false,
		recursiveEqual: true,
		preserveKeyOrder: "before",
		undefinedBehavior: "stringify"
	};

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
		const chunks: { start: number; changes: string[] }[] = [];

		let currentChunk: { start: number; changes: string[] } | null = null;

		for (let i = 0; i < left.length; i++) {
			const leftLine = left[i];
			const rightLine = right[i];
			let hasChange = false;
			const chunkLines: string[] = [];

			if (leftLine.type === "remove" && rightLine.type === "equal") {
				const indent = "  ".repeat(leftLine.level);
				chunkLines.push(`-${indent}${leftLine.text}${leftLine.comma ? "," : ""}`);
				hasChange = true;
			} else if (leftLine.type === "equal" && rightLine.type === "add") {
				const indent = "  ".repeat(rightLine.level);
				chunkLines.push(`+${indent}${rightLine.text}${rightLine.comma ? "," : ""}`);
				hasChange = true;
			} else if (leftLine.type === "modify" && rightLine.type === "modify") {
				const indentL = "  ".repeat(leftLine.level);
				const indentR = "  ".repeat(rightLine.level);
				chunkLines.push(`-${indentL}${leftLine.text}${leftLine.comma ? "," : ""}`);
				chunkLines.push(`+${indentR}${rightLine.text}${rightLine.comma ? "," : ""}`);
				hasChange = true;
			}

			if (hasChange) {
				if (!currentChunk) {
					currentChunk = { start: i + 1, changes: [] };
				}
				currentChunk.changes.push(...chunkLines);
			} else if (currentChunk) {
				chunks.push(currentChunk);
				currentChunk = null;
			}
		}

		if (currentChunk) {
			chunks.push(currentChunk);
		}

		// Generate diff output with hunks
		for (const chunk of chunks) {
			const changeCount = chunk.changes.filter((l) => l.startsWith("-")).length;
			const addCount = chunk.changes.filter((l) => l.startsWith("+")).length;
			lines.push(`@@ -${chunk.start},${changeCount} +${chunk.start},${addCount} @@`);
			lines.push(...chunk.changes);
		}

		return lines.join("\n");
	}

	diff(sourceLeft: unknown, sourceRight: unknown): string {
		this.detectCircularReference(sourceLeft);
		this.detectCircularReference(sourceRight);

		let processedLeft = sortInnerArrays(sourceLeft, this.options);
		let processedRight = sortInnerArrays(sourceRight, this.options);

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
				1,
				this.options,
				diffArrayLCS
			);
			resultLeft.unshift({ ...EQUAL_LEFT_BRACKET_LINE });
			resultLeft.push({ ...EQUAL_RIGHT_BRACKET_LINE });
			resultRight.unshift({ ...EQUAL_LEFT_BRACKET_LINE });
			resultRight.push({ ...EQUAL_RIGHT_BRACKET_LINE });
		} else if (typeLeft === "array") {
			[resultLeft, resultRight] = diffArrayLCS(processedLeft as unknown[], processedRight as unknown[], "", "", 0, this.options);
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

	static apply(obj: unknown, patch: string): unknown {
		const lines = patch.split("\n").filter((line) => line.trim());
		let result = JSON.parse(JSON.stringify(obj));

		for (const line of lines) {
			if (line.startsWith("@@")) {
				continue;
			}

			if (line.startsWith("-")) {
				// Line to remove - handled by additions
				continue;
			}

			if (line.startsWith("+")) {
				// Line to add
				const content = line.slice(1).trim();
				try {
					const parsed = JSON.parse(`{${content}}`);
					result = { ...result, ...parsed };
				} catch {
					// Ignore malformed lines
				}
			}
		}

		return result;
	}
}
