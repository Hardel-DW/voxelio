import type { PatchOperation } from "./types";
import { generatePatch } from "./core/generate";
import { applyPatch } from "./core/apply";

export class Differ {
	/**
	 * Generate JSON Patch operations to transform source to target
	 */
	diff(source: Record<string, unknown>, target: Record<string, unknown>): PatchOperation[] {
		return generatePatch(source, target);
	}

	/**
	 * Apply JSON Patch operations to an object
	 */
	static apply(obj: Record<string, unknown>, patch: PatchOperation[]): Record<string, unknown> {
		const cloned = structuredClone(obj);
		return applyPatch(cloned, patch);
	}
}
