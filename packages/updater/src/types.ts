export type DatapackFiles = Record<string, Uint8Array>;

export interface Migration {
	id: string;
	description: string;
	migrate: (ctx: MigrationContext) => void;
}

export interface MigrationContext {
	force: boolean;
	transform: (pattern: RegExp, transformer: (content: string, path: string) => string | undefined) => void;
	deleteFile: (path: string) => void;
	renameFile: (from: string, to: string) => void;
	hasFile: (path: string) => boolean;
	getFiles: (pattern: RegExp) => string[];
	warn: (message: string) => void;
}

export interface UpdateResult {
	files: DatapackFiles;
	warnings: string[];
	appliedMigrations: string[];
}

export interface VersionInfo {
	packFormat: number;
	migrations: Migration[];
}
