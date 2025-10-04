import type { DiffResult } from "./types";
import { getType } from "./utils/compare";
import { diffObject } from "./core/json-diff";
import { diffArray } from "./core/array-diff";
import { processDiffResults } from "./core/formatter";

const EQUAL_EMPTY_LINE: DiffResult = { level: 0, type: "equal", text: "" };
const EQUAL_LEFT_BRACKET_LINE: DiffResult = { level: 0, type: "equal", text: "{" };
const EQUAL_RIGHT_BRACKET_LINE: DiffResult = { level: 0, type: "equal", text: "}" };

export class Differ {
	/**
	 * Compare two JSON objects and generate a diff string
	 */
	diff(sourceLeft: unknown, sourceRight: unknown): string {
		let resultLeft: DiffResult[] = [];
		let resultRight: DiffResult[] = [];

		const typeLeft = getType(sourceLeft);
		const typeRight = getType(sourceRight);

		if (typeLeft !== typeRight) {
			// Different types - show complete replacement
			const strLeft = JSON.stringify(sourceLeft, null, 2);
			resultLeft = strLeft.split("\n").map((line) => ({
				level: (line.match(/^\s+/)?.[0]?.length ?? 0) / 2,
				type: "remove",
				text: line.replace(/^\s+/, "").replace(/,$/g, ""),
				comma: line.endsWith(",")
			}));

			const strRight = JSON.stringify(sourceRight, null, 2);
			resultRight = strRight.split("\n").map((line) => ({
				level: (line.match(/^\s+/)?.[0]?.length ?? 0) / 2,
				type: "add",
				text: line.replace(/^\s+/, "").replace(/,$/g, ""),
				comma: line.endsWith(",")
			}));

			// Align arrays to same length
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
			// Both objects
			[resultLeft, resultRight] = diffObject(sourceLeft as Record<string, unknown>, sourceRight as Record<string, unknown>, 1);
			resultLeft.unshift({ ...EQUAL_LEFT_BRACKET_LINE });
			resultLeft.push({ ...EQUAL_RIGHT_BRACKET_LINE });
			resultRight.unshift({ ...EQUAL_LEFT_BRACKET_LINE });
			resultRight.push({ ...EQUAL_RIGHT_BRACKET_LINE });
		} else if (typeLeft === "array") {
			// Both arrays
			[resultLeft, resultRight] = diffArray(sourceLeft as unknown[], sourceRight as unknown[], "", "", 0);
		} else if (sourceLeft !== sourceRight) {
			// Primitive values that differ
			resultLeft = [
				{
					level: 0,
					type: "modify",
					text: JSON.stringify(sourceLeft)
				}
			];
			resultRight = [
				{
					level: 0,
					type: "modify",
					text: JSON.stringify(sourceRight)
				}
			];
		} else {
			// Equal primitive values
			resultLeft = [
				{
					level: 0,
					type: "equal",
					text: JSON.stringify(sourceLeft)
				}
			];
			resultRight = [
				{
					level: 0,
					type: "equal",
					text: JSON.stringify(sourceRight)
				}
			];
		}

		return processDiffResults(resultLeft, resultRight);
	}

	/**
	 * Apply a patch to a JSON object
	 */
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
