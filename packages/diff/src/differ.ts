import type { PatchOperation } from "./types";
import { generatePatch } from "./core/generate";
import { applyPatch } from "./core/apply";
import { reorderKeysLike } from "./utils/ordering";

export class Differ {
	constructor(
		private readonly source: unknown,
		private readonly target: unknown
	) {}

	/**
	 * Generate JSON Patch operations to transform source to target
	 */
	diff(): PatchOperation[] {
		return generatePatch(this.source, this.target);
	}

	/**
	 * Reorder keys of an object to match the target object
	 */
	reorder(): unknown {
		return reorderKeysLike(this.source, this.target);
	}

	/**
	 * Apply JSON Patch operations to an object
	 */
	static apply(obj: Record<string, unknown>, patch: PatchOperation[]): Record<string, unknown> {
		const cloned = structuredClone(obj);
		return applyPatch(cloned, patch);
	}

	/**
	 * Detect indentation from a JSON string
	 * @param jsonString - The JSON string to analyze
	 * @returns The indentation (number of spaces or '\t' for tabs)
	 */
	static detectIndentation(jsonString: string): string | number {
		const lines = jsonString.split("\n");

		for (const line of lines) {
			if (!line.trim() || line.trim() === "{" || line.trim() === "[") continue;

			const spaceMatch = line.match(/^( +)/);
			if (spaceMatch) {
				return spaceMatch[1].length;
			}

			const tabMatch = line.match(/^(\t+)/);
			if (tabMatch) {
				return "\t";
			}
		}

		return 2;
	}
}
