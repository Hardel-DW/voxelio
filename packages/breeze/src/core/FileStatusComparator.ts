import type { GetAnalyserVoxel, Analysers } from "@/core/engine/Analyser";
import { compileDatapack } from "@/core/engine/Compiler";
import { Datapack } from "@/core/Datapack";
import { Identifier } from "@/core/Identifier";
import type { Logger } from "@/core/engine/migrations/logger";

export const FILE_STATUS = {
	ADDED: "added",
	DELETED: "deleted",
	UPDATED: "updated",
	UNCHANGED: "unchanged"
} as const;

export type FileStatus = (typeof FILE_STATUS)[keyof typeof FILE_STATUS];

export class FileStatusComparator {
	private originalDatapack: Datapack;
	private compiledDatapack: Datapack;
	private logger: Logger;

	constructor(files: Record<string, Uint8Array>, elements: Map<string, GetAnalyserVoxel<keyof Analysers>>, logger: Logger) {
		this.originalDatapack = new Datapack(files);
		this.compiledDatapack = compileDatapack({ elements: Array.from(elements.values()), files });
		this.logger = logger;
	}

	/**
	 * Get the status of a file by its unique key (namespace:resource$registry)
	 */
	getFileStatus(uniqueKey: string): FileStatus {
		const identifier = Identifier.fromUniqueKey(uniqueKey);
		const idString = `${identifier.namespace}:${identifier.resource}`;

		const originalIndex = this.originalDatapack.getIndex(identifier.registry);
		const compiledIndex = this.compiledDatapack.getIndex(identifier.registry);

		const existsInOriginal = originalIndex.has(uniqueKey);
		const existsInCompiled = compiledIndex.has(uniqueKey);

		// Added: not in original, but in compiled
		if (!existsInOriginal && existsInCompiled) {
			return FILE_STATUS.ADDED;
		}

		// Deleted: in original, but not in compiled
		if (existsInOriginal && !existsInCompiled) {
			return FILE_STATUS.DELETED;
		}

		// Not in either (shouldn't happen normally)
		if (!existsInOriginal && !existsInCompiled) {
			return FILE_STATUS.UNCHANGED;
		}

		// Both exist: check if it was modified using Logger
		const changes = this.logger.getChanges();
		const hasChanges = changes.some((change) => change.identifier === idString);
		return hasChanges ? FILE_STATUS.UPDATED : FILE_STATUS.UNCHANGED;
	}

	/**
	 * Get all file statuses as a Map
	 */
	getAllFileStatuses(): Map<string, FileStatus> {
		const statuses = new Map<string, FileStatus>();
		const allKeys = new Set<string>();

		const originalRegistries = this.originalDatapack.getRegistries();
		const compiledRegistries = this.compiledDatapack.getRegistries();
		const allRegistries = new Set([...originalRegistries, ...compiledRegistries]);

		for (const registry of allRegistries) {
			const originalIndex = this.originalDatapack.getIndex(registry);
			const compiledIndex = this.compiledDatapack.getIndex(registry);

			for (const key of originalIndex.keys()) allKeys.add(key);
			for (const key of compiledIndex.keys()) allKeys.add(key);
		}

		for (const key of allKeys) {
			statuses.set(key, this.getFileStatus(key));
		}

		return statuses;
	}
}
