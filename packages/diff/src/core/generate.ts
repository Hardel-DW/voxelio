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

	// Same value
	if (isEqual(input, output)) {
		return operations;
	}

	const inputType = getType(input);
	const outputType = getType(output);

	// Different types -> replace
	if (inputType !== outputType) {
		operations.push({
			op: "replace",
			path: ptr.toString(),
			value: output
		});
		return operations;
	}

	// Arrays
	if (Array.isArray(input) && Array.isArray(output)) {
		const inputArr = input as unknown[];
		const outputArr = output as unknown[];

		// Simple approach: compare index by index
		const maxLen = Math.max(inputArr.length, outputArr.length);

		for (let i = 0; i < maxLen; i++) {
			if (i >= inputArr.length) {
				// Add new item
				operations.push({
					op: "add",
					path: ptr.add(String(i)).toString(),
					value: outputArr[i]
				});
			} else if (i >= outputArr.length) {
				// Remove item (from end, to preserve indices)
				operations.push({
					op: "remove",
					path: ptr.add(String(i)).toString()
				});
			} else if (!isEqual(inputArr[i], outputArr[i])) {
				// Recurse or replace
				const nestedOps = generatePatch(inputArr[i], outputArr[i], ptr.add(String(i)));
				if (nestedOps.length > 0) {
					operations.push(...nestedOps);
				}
			}
		}

		// Remove operations should be done in reverse order
		const removes = operations.filter(op => op.op === "remove");
		const others = operations.filter(op => op.op !== "remove");
		return [...others, ...removes.reverse()];
	}

	// Objects
	if (inputType === "object" && outputType === "object") {
		const inputObj = input as Record<string, unknown>;
		const outputObj = output as Record<string, unknown>;

		// Get all keys (preserve order from output)
		const inputKeys = new Set(Object.keys(inputObj));
		const outputKeys = Object.keys(outputObj);

		// Check modified and added keys (in output order)
		for (const key of outputKeys) {
			if (key in inputObj) {
				// Key exists in both
				if (!isEqual(inputObj[key], outputObj[key])) {
					const nestedOps = generatePatch(inputObj[key], outputObj[key], ptr.add(key));
					operations.push(...nestedOps);
				}
				inputKeys.delete(key);
			} else {
				// Key only in output (added)
				operations.push({
					op: "add",
					path: ptr.add(key).toString(),
					value: outputObj[key]
				});
			}
		}

		// Remaining keys only in input (removed)
		for (const key of inputKeys) {
			operations.push({
				op: "remove",
				path: ptr.add(key).toString()
			});
		}

		return operations;
	}

	// Primitives -> replace
	operations.push({
		op: "replace",
		path: ptr.toString(),
		value: output
	});

	return operations;
}
