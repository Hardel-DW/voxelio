import { createContext } from "@/context";
import { versionRegistry } from "@/migrations";
import type { DatapackFiles, UpdateResult } from "@/types";
export type { DatapackFiles, Migration, MigrationContext, UpdateResult, VersionInfo } from "@/types";
export { versionRegistry } from "@/migrations";
export { VersionRegistry } from "@/VersionRegistry";

/**
 * Update a datapack from one version to another
 * @param files - The datapack files as Record<string, Uint8Array>
 * @param fromFormat - Source pack_format
 * @param toFormat - Target pack_format
 * @returns Updated files with warnings and applied migrations
 */
export interface UpdateOptions {
	force?: boolean;
}

export function update(files: DatapackFiles, fromFormat: number, toFormat: number, options: UpdateOptions = {}): UpdateResult {
	const { force = false } = options;

	if (fromFormat >= toFormat) {
		return {
			files,
			warnings: [],
			appliedMigrations: [],
		};
	}

	const updatedFiles = { ...files };
	const warnings: string[] = [];
	const appliedMigrations: string[] = [];
	const migrations = versionRegistry.getMigrationChain(fromFormat, toFormat);
	const ctx = createContext(updatedFiles, warnings, force);
	for (const migration of migrations) {
		migration.migrate(ctx);
		appliedMigrations.push(migration.id);
	}

	updatePackFormat(updatedFiles, toFormat, warnings);
	return {
		files: updatedFiles,
		warnings,
		appliedMigrations,
	};
}

const NEW_FORMAT_THRESHOLD = 86;

type PackVersion = number | [number] | [number, number];

interface PackMcmeta {
	pack?: {
		pack_format?: number;
		min_format?: PackVersion;
		max_format?: PackVersion;
	};
}

function updatePackFormat(files: DatapackFiles, toFormat: number, warnings: string[]): void {
	const packMcmeta = files["pack.mcmeta"];
	if (!packMcmeta) {
		warnings.push("No pack.mcmeta found - cannot update pack_format");
		return;
	}

	try {
		const decoder = new TextDecoder();
		const encoder = new TextEncoder();
		const data = JSON.parse(decoder.decode(packMcmeta)) as PackMcmeta;

		if (!data.pack) return;

		if (toFormat < NEW_FORMAT_THRESHOLD) {
			data.pack.pack_format = toFormat;
			files["pack.mcmeta"] = encoder.encode(JSON.stringify(data, null, 2));
			return;
		}

		data.pack.max_format = toFormat;
		data.pack.min_format ??= toFormat;
		delete data.pack.pack_format;
		files["pack.mcmeta"] = encoder.encode(JSON.stringify(data, null, 2));
	} catch {
		warnings.push("Failed to update pack_format in pack.mcmeta");
	}
}