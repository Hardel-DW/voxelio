/**
 * Apply JSON Patch operations
 */

import type { AddOperation, RemoveOperation, ReplaceOperation, PatchOperation } from "../types";
import { Pointer } from "../utils/pointer";

const clone = <T>(value: T): T => structuredClone(value);

const addOp = (target: unknown, key: string, value: unknown): void => {
	if (Array.isArray(target)) {
		const array = target as unknown[];
		const index = key === "-" ? array.length : Number.parseInt(key, 10);
		array.splice(index, 0, value);
		return;
	}
	(target as Record<string, unknown>)[key] = value;
};

const removeOp = (target: unknown, key: string): void => {
	if (Array.isArray(target)) {
		(target as unknown[]).splice(Number.parseInt(key, 10), 1);
		return;
	}

	delete (target as Record<string, unknown>)[key];
};

const add = (document: unknown, operation: AddOperation): void => {
	const endpoint = Pointer.fromJSON(operation.path).evaluate(document);
	if (endpoint.parent === undefined || endpoint.parent === null) {
		throw new Error(`Cannot add at path: ${operation.path}`);
	}

	addOp(endpoint.parent, endpoint.key, clone(operation.value));
};

const remove = (document: unknown, operation: RemoveOperation): void => {
	const endpoint = Pointer.fromJSON(operation.path).evaluate(document);
	if (endpoint.value === undefined) {
		throw new Error(`Cannot remove at path: ${operation.path}`);
	}

	removeOp(endpoint.parent, endpoint.key);
};

const replace = (document: unknown, operation: ReplaceOperation): void => {
	const endpoint = Pointer.fromJSON(operation.path).evaluate(document);
	if (endpoint.value === undefined) {
		throw new Error(`Cannot replace at path: ${operation.path}`);
	}

	if (endpoint.parent === null) {
		throw new Error("Cannot replace root");
	}

	(endpoint.parent as Record<string, unknown>)[endpoint.key] = clone(operation.value);
};

export function applyPatch(object: Record<string, unknown>, patch: PatchOperation[]): Record<string, unknown> {
	let document: Record<string, unknown> = object;

	for (const operation of patch) {
		switch (operation.op) {
			case "add":
				add(document, operation);
				break;
			case "remove":
				remove(document, operation);
				break;
			case "replace":
				if (operation.path === "") {
					document = clone(operation.value) as Record<string, unknown>;
					break;
				}
				replace(document, operation);
				break;
		}
	}

	return document;
}
