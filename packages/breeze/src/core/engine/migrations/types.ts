import type { IdentifierObject } from "@/core/Identifier";
import type { PatchOperation } from "@voxelio/diff";

export interface ChangeSet {
	identifier: IdentifierObject;
	patch: PatchOperation[];
	updatedAt?: string;
}

export interface ChangeFile {
	path: string;
	data: ChangeSet;
}
