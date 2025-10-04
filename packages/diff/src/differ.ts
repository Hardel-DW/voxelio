/**
 * JSON Differ using JSON Patch format (RFC 6902)
 */

import type { PatchOperation } from "./types";
import { generatePatch } from "./core/generate";
import { applyPatch } from "./core/apply";

export class Differ {
	/**
	 * Generate JSON Patch operations to transform source to target
	 */
	diff(source: unknown, target: unknown): PatchOperation[] {
		return generatePatch(source, target);
	}

	/**
	 * Apply JSON Patch operations to an object
	 */
	static apply(obj: unknown, patch: PatchOperation[]): unknown {
		// Clone to avoid mutation
		const cloned = structuredClone(obj);
		return applyPatch(cloned, patch);
	}
}
