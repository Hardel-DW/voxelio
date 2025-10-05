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

	constructor(
		files: Record<string, Uint8Array>,
		elements: Map<string, GetAnalyserVoxel<keyof Analysers>>,
		private readonly logger: Logger
	) {
		this.originalDatapack = new Datapack(files);
		this.compiledDatapack = compileDatapack({
			elements: Array.from(elements.values()),
			files
		});
	}

	/**
	 * Get the status of a file by its unique key (namespace:resource$registry)
	 */
	getFileStatus(uniqueKey: string): FileStatus {
		const identifier = Identifier.fromUniqueKey(uniqueKey);

		const originalIndex = this.originalDatapack.getIndex(identifier.registry);
		const compiledIndex = this.compiledDatapack.getIndex(identifier.registry);

		const existsInOriginal = originalIndex.has(uniqueKey);
		const existsInCompiled = compiledIndex.has(uniqueKey);

		if (!existsInOriginal && existsInCompiled) {
			return FILE_STATUS.ADDED;
		}

		if (existsInOriginal && !existsInCompiled) {
			return FILE_STATUS.DELETED;
		}

		if (!existsInOriginal && !existsInCompiled) {
			return FILE_STATUS.UNCHANGED;
		}

		return this.logger.hasChanges(identifier.get()) ? FILE_STATUS.UPDATED : FILE_STATUS.UNCHANGED;
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
