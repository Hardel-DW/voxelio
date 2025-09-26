/**
 * Supported Minecraft mod platforms for conversion
 */
export const ModPlatforms = {
	FORGE: "forge",
	NEOFORGE: "neoforge",
	FABRIC: "fabric",
	QUILT: "quilt"
} as const;

export type ModPlatformType = (typeof ModPlatforms)[keyof typeof ModPlatforms];

/**
 * Common metadata structure for mod generation
 */
export interface ModMetadata {
	id: string;
	version: string;
	name: string;
	description: string;
	authors: string[];
	icon?: string;
	homepage?: string;
	issues?: string;
	sources?: string;
}

/**
 * Default metadata used when information is missing
 */
export const DEFAULT_MOD_METADATA: ModMetadata = {
	id: "datapack",
	name: "Converted Datapack",
	description: "Converted Datapack",
	authors: [],
	version: "1.0.0",
	homepage: "",
	issues: "",
	sources: ""
};
