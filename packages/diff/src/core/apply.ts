/**
 * Apply JSON Patch operations
 */

import type { AddOperation, RemoveOperation, ReplaceOperation, PatchOperation } from "../types";
import { Pointer } from "../utils/pointer";

const clone = <T>(value: T): T => {
	if (value === null || typeof value !== "object") {
		return value;
	}
	if (Array.isArray(value)) {
		return value.map(clone) as T;
	}

	const cloned: Record<string, unknown> = {};
	for (const key in value) {
		if (Object.hasOwn(value, key)) {
			cloned[key] = clone((value as Record<string, unknown>)[key]);
		}
	}
	return cloned as T;
};

const addOp = (object: unknown, key: string, value: unknown): void => {
	if (Array.isArray(object)) {
		if (key === "-") {
			object.push(value);
			return;
		}
		object.splice(Number.parseInt(key, 10), 0, value);
		return;
	}
	(object as Record<string, unknown>)[key] = value;
};

const removeOp = (object: unknown, key: string): void => {
	if (Array.isArray(object)) {
		object.splice(Number.parseInt(key, 10), 1);
		return;
	}
	delete (object as Record<string, unknown>)[key];
};

const add = (object: unknown, operation: AddOperation): void => {
	const endpoint = Pointer.fromJSON(operation.path).evaluate(object);
	if (endpoint.parent === undefined || endpoint.parent === null) {
		throw new Error(`Cannot add at path: ${operation.path}`);
	}
	addOp(endpoint.parent, endpoint.key, clone(operation.value));
};

const remove = (object: unknown, operation: RemoveOperation): void => {
	const endpoint = Pointer.fromJSON(operation.path).evaluate(object);
	if (endpoint.value === undefined) {
		throw new Error(`Cannot remove at path: ${operation.path}`);
	}
	removeOp(endpoint.parent, endpoint.key);
};

const replace = (object: unknown, operation: ReplaceOperation): void => {
	const endpoint = Pointer.fromJSON(operation.path).evaluate(object);
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
		if (operation.op === "add") {
			add(document, operation);
			continue;
		}
		if (operation.op === "remove") {
			remove(document, operation);
			continue;
		}
		if (operation.path === "") {
			document = clone(operation.value) as Record<string, unknown>;
			continue;
		}
		replace(document, operation);
	}

	return document;
}
