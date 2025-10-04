/**
 * Generate JSON Patch operations
 * Simplified for JSON with preserved key order
 */

import type { PatchOperation } from "../types";
import { Pointer } from "../utils/pointer";
import { isEqual } from "../utils/equality";

function getType(value: unknown): string {
	if (Array.isArray(value)) return "array";
	if (value === null) return "null";
	return typeof value;
}

export function generatePatch(input: unknown, output: unknown, ptr = new Pointer()): PatchOperation[] {
	const operations: PatchOperation[] = [];
	if (isEqual(input, output)) {
		return operations;
	}

	const inputType = getType(input);
	const outputType = getType(output);

	if (inputType !== outputType) {
		operations.push({ op: "replace", path: ptr.toString(), value: output });
		return operations;
	}

	// Arrays
	if (Array.isArray(input) && Array.isArray(output)) {
		const inputArr = input as unknown[];
		const outputArr = output as unknown[];
		const maxLen = Math.max(inputArr.length, outputArr.length);

		for (let i = 0; i < maxLen; i++) {
			if (i >= inputArr.length) {
				operations.push({ op: "add", path: ptr.add(String(i)).toString(), value: outputArr[i] });
			} else if (i >= outputArr.length) {
				operations.push({ op: "remove", path: ptr.add(String(i)).toString() });
			} else if (!isEqual(inputArr[i], outputArr[i])) {
				const nestedOps = generatePatch(inputArr[i], outputArr[i], ptr.add(String(i)));
				if (nestedOps.length > 0) {
					operations.push(...nestedOps);
				}
			}
		}

		const removes = operations.filter(op => op.op === "remove");
		const others = operations.filter(op => op.op !== "remove");
		return [...others, ...removes.reverse()];
	}

	// Objects
	if (inputType === "object" && outputType === "object") {
		const inputObj = input as Record<string, unknown>;
		const outputObj = output as Record<string, unknown>;
		const inputKeys = Object.keys(inputObj);
		const outputKeys = Object.keys(outputObj);
		const commonInputKeys = inputKeys.filter(k => k in outputObj);
		const commonOutputKeys = outputKeys.filter(k => k in inputObj);

		let keyOrderChanged = false;
		if (commonInputKeys.length > 0 && commonInputKeys.length === commonOutputKeys.length) {
			for (let i = 0; i < commonInputKeys.length; i++) {
				if (commonInputKeys[i] !== commonOutputKeys[i]) {
					keyOrderChanged = true;
					break;
				}
			}
		}

		if (keyOrderChanged) {
			operations.push({ op: "replace", path: ptr.toString(), value: output });
			return operations;
		}

		const inputKeySet = new Set(inputKeys);
		for (const key of outputKeys) {
			if (key in inputObj) {
				if (!isEqual(inputObj[key], outputObj[key])) {
					const nestedOps = generatePatch(inputObj[key], outputObj[key], ptr.add(key));
					operations.push(...nestedOps);
				}
				inputKeySet.delete(key);
			} else {
				operations.push({ op: "add", path: ptr.add(key).toString(), value: outputObj[key] });
			}
		}

		// Remaining keys only in input (removed)
		for (const key of inputKeySet) {
			operations.push({ op: "remove", path: ptr.add(key).toString() });
		}

		return operations;
	}

	operations.push({ op: "replace", path: ptr.toString(), value: output });
	return operations;
}
