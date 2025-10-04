/**
 * Generate JSON Patch operations with preserved key order
 */

import type { PatchOperation } from "../types";
import { Pointer } from "../utils/pointer";
import { isEqual } from "../utils/equality";

const getType = (value: unknown): string => {
	if (Array.isArray(value)) return "array";
	if (value === null) return "null";
	return typeof value;
};

export function generatePatch(input: unknown, output: unknown, ptr = new Pointer()): PatchOperation[] {
	// Early return: values are equal
	if (isEqual(input, output)) return [];

	const inputType = getType(input);
	const outputType = getType(output);

	// Early return: different types
	if (inputType !== outputType) {
		return [{ op: "replace", path: ptr.toString(), value: output }];
	}

	// Arrays
	if (Array.isArray(input) && Array.isArray(output)) {
		const maxLen = Math.max(input.length, output.length);
		const operations: PatchOperation[] = [];

		for (let i = 0; i < maxLen; i++) {
			if (i >= input.length) {
				operations.push({ op: "add", path: ptr.add(String(i)).toString(), value: output[i] });
			} else if (i >= output.length) {
				operations.push({ op: "remove", path: ptr.add(String(i)).toString() });
			} else if (!isEqual(input[i], output[i])) {
				operations.push(...generatePatch(input[i], output[i], ptr.add(String(i))));
			}
		}

		// Reverse remove operations to preserve indices
		const removes = operations.filter((op) => op.op === "remove").reverse();
		const others = operations.filter((op) => op.op !== "remove");
		return [...others, ...removes];
	}

	// Objects
	if (inputType === "object") {
		const inputObj = input as Record<string, unknown>;
		const outputObj = output as Record<string, unknown>;
		const inputKeys = Object.keys(inputObj);
		const outputKeys = Object.keys(outputObj);
		const commonInputKeys = inputKeys.filter((k) => k in outputObj);
		const commonOutputKeys = outputKeys.filter((k) => k in inputObj);
		if (commonInputKeys.length > 0 && commonInputKeys.length === commonOutputKeys.length) {
			const keyOrderChanged = commonInputKeys.some((key, i) => key !== commonOutputKeys[i]);
			if (keyOrderChanged) {
				return [{ op: "replace", path: ptr.toString(), value: output }];
			}
		}

		const operations: PatchOperation[] = [];
		const inputKeySet = new Set(inputKeys);

		for (const key of outputKeys) {
			if (key in inputObj) {
				if (!isEqual(inputObj[key], outputObj[key])) {
					operations.push(...generatePatch(inputObj[key], outputObj[key], ptr.add(key)));
				}
				inputKeySet.delete(key);
			} else {
				operations.push({ op: "add", path: ptr.add(key).toString(), value: outputObj[key] });
			}
		}

		for (const key of inputKeySet) {
			operations.push({ op: "remove", path: ptr.add(key).toString() });
		}

		return operations;
	}

	// Primitives
	return [{ op: "replace", path: ptr.toString(), value: output }];
}
