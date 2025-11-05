import type { DataDrivenElement, VoxelElement } from "@/core/Element";

export interface StructureSetProps extends VoxelElement {
	structures: StructureSetStructure[];
	placementType: PlacementType;
	salt?: number;
	frequencyReductionMethod?: FrequencyReductionMethod;
	frequency?: number;
	locateOffset?: [number, number, number];
	exclusionZone?: {
		otherSet: string;
		chunkCount: number;
	};
	distance?: number;
	spread?: number;
	count?: number;
	preferredBiomes?: string[];
	spacing?: number;
	separation?: number;
	spreadType?: SpreadType;
	disabled?: boolean;
	tags: string[];
}

export interface StructureSetStructure {
	structure: string;
	weight: number;
}

export interface MinecraftStructureSet extends DataDrivenElement {
	structures: MinecraftStructureSetElement[];
	placement: MinecraftStructurePlacement;
}

export interface MinecraftStructureSetElement {
	structure: string;
	weight: number;
}

export interface MinecraftStructurePlacement {
	type: string;
	salt?: number;
	frequency_reduction_method?: FrequencyReductionMethod;
	frequency?: number;
	exclusion_zone?: MinecraftExclusionZone;
	locate_offset?: [number, number, number];
	distance?: number;
	spread?: number;
	count?: number;
	preferred_biomes?: string[] | string;
	spacing?: number;
	separation?: number;
	spread_type?: SpreadType;
}

export interface MinecraftExclusionZone {
	other_set: string;
	chunk_count: number;
}

// Enums
export type PlacementType = "minecraft:concentric_rings" | "minecraft:random_spread";

export type FrequencyReductionMethod = "default" | "legacy_type_1" | "legacy_type_2" | "legacy_type_3";

export type SpreadType = "linear" | "triangular";

/**
 * Placement types that use concentric rings configuration
 */
export const CONCENTRIC_RINGS_TYPES: Set<string> = new Set(["minecraft:concentric_rings"]);

/**
 * Placement types that use random spread configuration
 */
export const RANDOM_SPREAD_TYPES: Set<string> = new Set(["minecraft:random_spread"]);
