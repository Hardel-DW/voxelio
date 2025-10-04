/**
 * JSON Patch operation types (RFC 6902)
 */

export interface AddOperation {
	op: "add";
	path: string;
	value: unknown;
}

export interface RemoveOperation {
	op: "remove";
	path: string;
}

export interface ReplaceOperation {
	op: "replace";
	path: string;
	value: unknown;
}

export type PatchOperation = AddOperation | RemoveOperation | ReplaceOperation;
