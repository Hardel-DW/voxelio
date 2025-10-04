import type { PatchOperation } from "../types";
import { Pointer } from "../utils/pointer";
import { isEqual } from "../utils/equality";
import { areArrayItemsMatchable } from "../utils/matchers";

const getType = (value: unknown): string => {
	if (Array.isArray(value)) {
		return "array";
	}
	if (value === null) {
		return "null";
	}
	return typeof value;
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null && !Array.isArray(value);
};

const areKeysInSameOrder = (left: Record<string, unknown>, right: Record<string, unknown>): boolean => {
	const leftKeys = Object.keys(left);
	const rightKeys = Object.keys(right);
	return leftKeys.length === rightKeys.length && leftKeys.every((key, index) => key === rightKeys[index]);
};

interface MatchPair {
	sourceIndex: number;
	targetIndex: number;
}

export function generatePatch(input: unknown, output: unknown, pointer = new Pointer()): PatchOperation[] {
	if (isEqual(input, output)) {
		if (isPlainObject(input) && isPlainObject(output) && !areKeysInSameOrder(input, output)) {
			// Identical structure but different key order, continue diffing to reorder keys
		} else {
			return [];
		}
	}

	const inputType = getType(input);
	const outputType = getType(output);

	if (inputType !== outputType) {
		return [{ op: "replace", path: pointer.toString(), value: output }];
	}

	if (Array.isArray(input) && Array.isArray(output)) {
		return diffArray(input, output, pointer);
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

	const operations: PatchOperation[] = [];
	const removalIndexByPath = new Map<string, number>();

	for (let index = input.length - 1; index >= 0; index--) {
		if (matchedSource.has(index)) {
			continue;
		}
		const path = pointer.add(String(index)).toString();
		removalIndexByPath.set(path, operations.length);
		operations.push({ op: "remove", path });
	}

	const currentIndexMap = new Map<number, number>();
	let removedBefore = 0;
	for (let index = 0; index < input.length; index++) {
		if (!matchedSource.has(index)) {
			removedBefore++;
			continue;
		}
		currentIndexMap.set(index, index - removedBefore);
	}

	for (const pair of matches) {
		const currentIndex = currentIndexMap.get(pair.sourceIndex);
		if (currentIndex === undefined) {
			continue;
		}
		const nestedPointer = pointer.add(String(currentIndex));
		const nestedOperations = generatePatch(input[pair.sourceIndex], output[pair.targetIndex], nestedPointer);
		operations.push(...nestedOperations);
	}

	for (let index = 0; index < output.length; index++) {
		if (matchedTarget.has(index)) {
			continue;
		}
		const path = pointer.add(String(index)).toString();
		const removalIndex = removalIndexByPath.get(path);
		if (removalIndex !== undefined) {
			operations[removalIndex] = { op: "replace", path, value: output[index] };
			removalIndexByPath.delete(path);
			continue;
		}
		operations.push({ op: "add", path, value: output[index] });
	}

	return operations;
}

function diffObject(input: Record<string, unknown>, output: Record<string, unknown>, pointer: Pointer): PatchOperation[] {
	const inputKeys = Object.keys(input);
	const outputKeys = Object.keys(output);

	if (!areKeysInSameOrder(input, output)) {
		const operations: PatchOperation[] = [];
		for (let index = inputKeys.length - 1; index >= 0; index--) {
			const key = inputKeys[index];
			operations.push({ op: "remove", path: pointer.add(key).toString() });
		}
		for (const key of outputKeys) {
			operations.push({ op: "add", path: pointer.add(key).toString(), value: output[key] });
		}
		return operations;
	}

	const operations: PatchOperation[] = [];

	for (const key of inputKeys) {
		if (!Object.hasOwn(output, key)) {
			operations.push({ op: "remove", path: pointer.add(key).toString() });
		}
	}

	for (const key of outputKeys) {
		if (!Object.hasOwn(input, key)) {
			operations.push({ op: "add", path: pointer.add(key).toString(), value: output[key] });
			continue;
		}
		const nestedPointer = pointer.add(key);
		operations.push(...generatePatch(input[key], output[key], nestedPointer));
	}

	return operations;
}

function computeArrayMatches(input: unknown[], output: unknown[]): MatchPair[] {
	const rows = input.length + 1;
	const columns = output.length + 1;
	const table: number[][] = Array.from({ length: rows }, () => Array<number>(columns).fill(0));

	for (let i = input.length - 1; i >= 0; i--) {
		for (let j = output.length - 1; j >= 0; j--) {
			if (areArrayItemsMatchable(input[i], output[j])) {
				table[i][j] = 1 + table[i + 1][j + 1];
				continue;
			}
			table[i][j] = Math.max(table[i + 1][j], table[i][j + 1]);
		}
	}

	const matches: MatchPair[] = [];
	let i = 0;
	let j = 0;
	while (i < input.length && j < output.length) {
		if (areArrayItemsMatchable(input[i], output[j])) {
			if (table[i][j] === table[i + 1][j + 1] + 1) {
				matches.push({ sourceIndex: i, targetIndex: j });
				i++;
				j++;
				continue;
			}
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
