import type { Migration, VersionInfo } from "@/types";

/**
 * Registry of all versions with their migrations
 */
export class VersionRegistry {
	private versions = new Map<number, VersionInfo>();
	private sortedFormats: number[] = [];

	/**
	 * Register a version with its migrations
	 */
	register(packFormat: number, migrations: Migration[]): this {
		this.versions.set(packFormat, {
			packFormat,
			migrations,
		});

		this.sortedFormats = [...this.versions.keys()].sort((a, b) => a - b);
		return this;
	}

	/**
	 * Get all pack formats between two versions (exclusive start, inclusive end)
	 */
	getVersionsBetween(fromFormat: number, toFormat: number): number[] {
		return this.sortedFormats.filter((f) => f > fromFormat && f <= toFormat);
	}

	/**
	 * Get migrations for a specific version
	 */
	getMigrations(packFormat: number): Migration[] {
		return this.versions.get(packFormat)?.migrations ?? [];
	}

	/**
	 * Get all migrations needed to go from one version to another
	 */
	getMigrationChain(fromFormat: number, toFormat: number): Migration[] {
		const versions = this.getVersionsBetween(fromFormat, toFormat);
		return versions.flatMap((v) => this.getMigrations(v));
	}

	/**
	 * Get all registered pack formats
	 */
	getAllFormats(): number[] {
		return [...this.sortedFormats];
	}

	/**
	 * Check if a pack format is registered
	 */
	hasVersion(packFormat: number): boolean {
		return this.versions.has(packFormat);
	}
}
