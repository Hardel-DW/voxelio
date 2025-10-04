/**
 * Apply JSON Patch operations
 * Adapted from rfc6902 package
 */

import type { AddOperation, RemoveOperation, ReplaceOperation, PatchOperation } from "../types";
import { Pointer } from "../utils/pointer";

function clone<T>(value: T): T {
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
}

function addOp(object: unknown, key: string, value: unknown): void {
	if (Array.isArray(object)) {
		if (key === "-") {
			object.push(value);
		} else {
			const index = Number.parseInt(key, 10);
			object.splice(index, 0, value);
		}
	} else {
		(object as Record<string, unknown>)[key] = value;
	}
}

function removeOp(object: unknown, key: string): void {
	if (Array.isArray(object)) {
		const index = Number.parseInt(key, 10);
		object.splice(index, 1);
	} else {
		delete (object as Record<string, unknown>)[key];
	}
}

export function add(object: unknown, operation: AddOperation): void {
	const endpoint = Pointer.fromJSON(operation.path).evaluate(object);
	if (endpoint.parent === undefined && endpoint.parent === null) {
		throw new Error(`Cannot add at path: ${operation.path}`);
	}
	addOp(endpoint.parent, endpoint.key, clone(operation.value));
}

export function remove(object: unknown, operation: RemoveOperation): void {
	const endpoint = Pointer.fromJSON(operation.path).evaluate(object);
	if (endpoint.value === undefined) {
		throw new Error(`Cannot remove at path: ${operation.path}`);
	}
	removeOp(endpoint.parent, endpoint.key);
}

export function replace(object: unknown, operation: ReplaceOperation): void {
	const endpoint = Pointer.fromJSON(operation.path).evaluate(object);
	if (endpoint.value === undefined) {
		throw new Error(`Cannot replace at path: ${operation.path}`);
	}
	if (endpoint.parent === null) {
		throw new Error(`Cannot replace root`);
	}
	(endpoint.parent as Record<string, unknown>)[endpoint.key] = clone(operation.value);
}

export function applyPatch(object: unknown, patch: PatchOperation[]): unknown {
	for (const operation of patch) {
		if (operation.op === "add") {
			add(object, operation);
		} else if (operation.op === "remove") {
			remove(object, operation);
		} else if (operation.op === "replace") {
			replace(object, operation);
		}
	}
	return object;
}
