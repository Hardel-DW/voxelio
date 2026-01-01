import type { PatchOperation } from "../types";
import { Pointer } from "../utils/pointer";
import { isEqual } from "../utils/equality";
import { areArrayItemsMatchable } from "../utils/matchers";

const getType = (value: unknown): string => (Array.isArray(value) ? "array" : value === null ? "null" : typeof value);
const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null && !Array.isArray(value);

const areKeysInSameOrder = (left: Record<string, unknown>, right: Record<string, unknown>): boolean => {
	const keysLeft = Object.keys(left);
	const keysRight = Object.keys(right);
	const commonKeys = keysRight.filter((key) => key in left);
	let lastIndex = -1;
	for (const key of commonKeys) {
		const index = keysLeft.indexOf(key);
		if (index <= lastIndex) return false;
		lastIndex = index;
	}
	return true;
};

interface MatchPair {
	sourceIndex: number;
	targetIndex: number;
}

export function generatePatch(input: unknown, output: unknown, pointer: Pointer = new Pointer()): PatchOperation[] {
	if (isEqual(input, output)) {
		return [];
	}

	const type = getType(input);
	if (type !== getType(output)) {
		return [{ op: "replace", path: pointer.toString(), value: output }];
	}

	if (type === "array") {
		return diffArray(input as unknown[], output as unknown[], pointer);
	}

	if (isPlainObject(input) && isPlainObject(output)) {
		return diffObject(input, output, pointer);
	}

	return [{ op: "replace", path: pointer.toString(), value: output }];
}

function diffArray(input: unknown[], output: unknown[], pointer: Pointer): PatchOperation[] {
	const matches = computeArrayMatches(input, output);
	const matchedSource = new Set(matches.map((pair) => pair.sourceIndex));
	const matchedTarget = new Set(matches.map((pair) => pair.targetIndex));
	const pointerFor = (token: string) => pointer.add(token).toString();

	const unmatchedSourceIndices = new Set(Array.from(input.keys()).filter((index) => !matchedSource.has(index)));
	const unmatchedTargetIndices = new Set(Array.from(output.keys()).filter((index) => !matchedTarget.has(index)));
	const replacementIndices = new Set<number>(Array.from(unmatchedSourceIndices).filter((index) => unmatchedTargetIndices.has(index)));

	const operations: PatchOperation[] = [];
	const replacements = new Map<string, number>();

	for (let index = input.length - 1; index >= 0; index--) {
		if (matchedSource.has(index)) {
			continue;
		}
		const path = pointerFor(String(index));
		replacements.set(path, operations.length);
		operations.push({ op: "remove", path });
	}

	const currentIndexMap = new Map<number, number>();
	let removedBefore = 0;
	for (let index = 0; index < input.length; index++) {
		if (!matchedSource.has(index)) {
			if (!replacementIndices.has(index)) {
				removedBefore++;
			}
			continue;
		}
		currentIndexMap.set(index, index - removedBefore);
	}

	for (const { sourceIndex, targetIndex } of matches) {
		const currentIndex = currentIndexMap.get(sourceIndex);
		if (currentIndex === undefined) {
			continue;
		}
		const nestedPointer = pointer.add(String(currentIndex));
		operations.push(...generatePatch(input[sourceIndex], output[targetIndex], nestedPointer));
	}

	for (let index = 0; index < output.length; index++) {
		if (matchedTarget.has(index)) {
			continue;
		}
		const path = pointerFor(String(index));
		const replacementIndex = replacements.get(path);
		if (replacementIndex !== undefined) {
			operations[replacementIndex] = { op: "replace", path, value: output[index] };
			replacements.delete(path);
			continue;
		}
		operations.push({ op: "add", path, value: output[index] });
	}

	return operations;
}

function diffObject(input: Record<string, unknown>, output: Record<string, unknown>, pointer: Pointer): PatchOperation[] {
	const inputKeys = Object.keys(input);
	const outputKeys = Object.keys(output);
	const pointerFor = (token: string) => pointer.add(token).toString();

	if (!areKeysInSameOrder(input, output)) {
		const removals: PatchOperation[] = inputKeys.toReversed().map((key) => ({ op: "remove", path: pointerFor(key) }));
		const additions: PatchOperation[] = outputKeys.map((key) => ({ op: "add", path: pointerFor(key), value: output[key] }));
		return [...removals, ...additions];
	}

	const operations: PatchOperation[] = [];

	for (const key of inputKeys) {
		if (!Object.hasOwn(output, key)) {
			operations.push({ op: "remove", path: pointerFor(key) });
		}
	}

	for (const key of outputKeys) {
		if (!Object.hasOwn(input, key)) {
			operations.push({ op: "add", path: pointerFor(key), value: output[key] });
			continue;
		}
		operations.push(...generatePatch(input[key], output[key], pointer.add(key)));
	}

	return operations;
}

function computeArrayMatches(input: unknown[], output: unknown[]): MatchPair[] {
	const rows = input.length + 1;
	const columns = output.length + 1;
	const table: number[][] = Array.from({ length: rows }, () => Array<number>(columns).fill(0));

	for (let i = input.length - 1; i >= 0; i--) {
		for (let j = output.length - 1; j >= 0; j--) {
			table[i][j] = areArrayItemsMatchable(input[i], output[j])
				? 1 + table[i + 1][j + 1]
				: Math.max(table[i + 1][j], table[i][j + 1]);
		}
	}

	const matches: MatchPair[] = [];
	let i = 0;
	let j = 0;
	while (i < input.length && j < output.length) {
		const matchable = areArrayItemsMatchable(input[i], output[j]);
		if (matchable && table[i][j] === table[i + 1][j + 1] + 1) {
			matches.push({ sourceIndex: i++, targetIndex: j++ });
			continue;
		}

		if (table[i + 1][j] > table[i][j + 1]) {
			i++;
			continue;
		}
		if (table[i + 1][j] < table[i][j + 1]) {
			j++;
			continue;
		}
		j++;
	}

	return matches;
}
