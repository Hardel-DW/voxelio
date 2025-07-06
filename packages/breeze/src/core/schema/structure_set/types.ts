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

    // Preserve unknown fields from mods
    disabled?: boolean;
    unknownFields?: Record<string, any>;
    tags: string[];
}

export interface StructureSetStructure {
    structure: string;
    weight: number;
}

// Original Minecraft Structure Set format
export interface MinecraftStructureSet extends DataDrivenElement {
    structures: MinecraftStructureSetElement[];
    placement: MinecraftStructurePlacement;

    // Allow any additional fields for mod compatibility
    [key: string]: any;
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

    // Concentric rings properties
    distance?: number;
    spread?: number;
    count?: number;
    preferred_biomes?: string[] | string;

    // Random spread properties
    spacing?: number;
    separation?: number;
    spread_type?: SpreadType;

    // Allow any additional fields for mod compatibility
    [key: string]: any;
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
 * Known Structure Set fields according to Minecraft specification
 */
export const KNOWN_STRUCTURE_SET_FIELDS = new Set(["structures", "placement"]);

/**
 * Known Structure Placement fields according to Minecraft specification
 */
export const KNOWN_PLACEMENT_FIELDS = new Set([
    "type",
    "salt",
    "frequency_reduction_method",
    "frequency",
    "exclusion_zone",
    "locate_offset",
    "distance",
    "spread",
    "count",
    "preferred_biomes",
    "spacing",
    "separation",
    "spread_type"
]);

/**
 * Placement types that use concentric rings configuration
 */
export const CONCENTRIC_RINGS_TYPES = new Set(["minecraft:concentric_rings"]);

/**
 * Placement types that use random spread configuration
 */
export const RANDOM_SPREAD_TYPES = new Set(["minecraft:random_spread"]);
