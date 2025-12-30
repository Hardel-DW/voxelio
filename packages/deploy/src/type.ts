import type { Type } from "arktype";
import { type } from "arktype";

export const VersionBump: Type<"major" | "minor" | "patch"> = type("'major'|'minor'|'patch'");
export type VersionBump = typeof VersionBump.infer;

export const VersionType: Type<"release" | "beta" | "alpha"> = type("'release'|'beta'|'alpha'");
export type VersionType = typeof VersionType.infer;

export const GameVersion: Type<string> = type("string");
export type GameVersion = typeof GameVersion.infer;

export const Loader: Type<"fabric" | "forge" | "neoforge" | "quilt"> = type("'fabric'|'forge'|'neoforge'|'quilt'");
export type Loader = typeof Loader.infer;

interface ChangesetFrontmatterObj {
	game_versions: string[];
	version_type: VersionType;
	version_bump: VersionBump;
	loaders?: string[];
}

export const ChangesetFrontmatter: Type<ChangesetFrontmatterObj> = type({
	game_versions: "string[]",
	version_type: VersionType,
	version_bump: VersionBump,
	"loaders?": "string[]"
});
export type ChangesetFrontmatter = typeof ChangesetFrontmatter.infer;

interface DeployConfigObj {
	project: {
		version: string;
		name: string;
		filename: string;
	};
	modrinth: {
		enabled: boolean;
		project_id: string;
		featured?: boolean;
	};
	curseforge: {
		datapack: {
			enabled: boolean;
			project_id?: number | null;
		};
		mod: {
			enabled: boolean;
			project_id?: number | null;
			java_versions?: string[];
			environments?: string[];
		};
	};
	package_as_mod: {
		enabled: boolean;
		loaders: string[];
		id: string;
		filename?: string;
		authors: string[];
		homepage?: string;
		issues?: string;
		sources?: string;
	};
	build?: {
		exclude?: string[];
	};
}

export const DeployConfig: Type<DeployConfigObj> = type({
	project: {
		version: "string",
		name: "string",
		filename: "string"
	},
	modrinth: {
		enabled: "boolean",
		project_id: "string",
		"featured?": "boolean"
	},
	curseforge: {
		datapack: {
			enabled: "boolean",
			"project_id?": "number | null"
		},
		mod: {
			enabled: "boolean",
			"project_id?": "number | null",
			"java_versions?": "string[]",
			"environments?": "string[]"
		}
	},
	package_as_mod: {
		enabled: "boolean",
		loaders: "string[]",
		id: "string",
		"filename?": "string",
		authors: "string[]",
		"homepage?": "string",
		"issues?": "string",
		"sources?": "string"
	},
	"build?": {
		"exclude?": "string[]"
	}
});
export type DeployConfig = typeof DeployConfig.infer;
