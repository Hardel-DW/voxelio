import type { DataDrivenRegistryElement } from "@/core/Element";
import type { StructureProps } from "@/core/schema/structure/types";

// Helper function to create mock structure elements
export function createMockStructure(overrides: Partial<StructureProps> = {}): StructureProps {
    return {
        identifier: { namespace: "test", registry: "worldgen/structure", resource: "test_structure" },
        type: "minecraft:village",
        biomes: ["#minecraft:village_biomes"],
        step: "surface_structures",
        spawnOverrides: [
            {
                mobCategory: "monster",
                boundingBox: "piece",
                spawns: [
                    {
                        type: "minecraft:zombie",
                        weight: 1,
                        minCount: 1,
                        maxCount: 3
                    }
                ]
            }
        ],
        // Jigsaw properties flattened
        startPool: "minecraft:village/common",
        size: 6,
        startHeight: {
            type: "minecraft:uniform",
            minInclusive: 0,
            maxInclusive: 0
        },
        projectStartToHeightmap: "WORLD_SURFACE_WG",
        maxDistanceFromCenter: 80,
        useExpansionHack: false,
        terrainAdaptation: "beard_thin",
        tags: [],
        ...overrides
    };
}

export function createLegacyStructure(overrides: Partial<StructureProps> = {}): StructureProps {
    return {
        identifier: { namespace: "test", registry: "worldgen/structure", resource: "test_mineshaft" },
        type: "minecraft:mineshaft",
        biomes: ["#minecraft:mineshaft_biomes"],
        step: "underground_structures",
        typeSpecific: {
            mineshaftType: "normal",
            probability: 0.004
        },
        tags: [],
        ...overrides
    };
}

export const villageVoxel: DataDrivenRegistryElement<StructureProps> = {
    identifier: { namespace: "minecraft", registry: "worldgen/structure", resource: "village_plains" },
    data: {
        identifier: { namespace: "minecraft", registry: "worldgen/structure", resource: "village_plains" },
        type: "minecraft:village",
        biomes: ["#minecraft:village_biomes"],
        step: "surface_structures",
        terrainAdaptation: "beard_thin",
        spawnOverrides: [
            {
                mobCategory: "monster",
                boundingBox: "piece",
                spawns: [
                    {
                        type: "minecraft:zombie",
                        weight: 1,
                        minCount: 1,
                        maxCount: 3
                    }
                ]
            }
        ],
        // Flattened Jigsaw properties
        startPool: "minecraft:village/common",
        size: 6,
        startHeight: {
            type: "minecraft:uniform",
            minInclusive: 0,
            maxInclusive: 0
        },
        projectStartToHeightmap: "WORLD_SURFACE_WG",
        maxDistanceFromCenter: 80,
        useExpansionHack: false,
        tags: []
    }
};

export const mineshaftVoxel: DataDrivenRegistryElement<StructureProps> = {
    identifier: { namespace: "minecraft", registry: "worldgen/structure", resource: "mineshaft" },
    data: {
        identifier: { namespace: "minecraft", registry: "worldgen/structure", resource: "mineshaft" },
        type: "minecraft:mineshaft",
        biomes: ["#minecraft:mineshaft_biomes"],
        step: "underground_structures",
        typeSpecific: {
            mineshaftType: "normal",
            probability: 0.004
        },
        tags: []
    }
};

export const bastionVoxel: DataDrivenRegistryElement<StructureProps> = {
    identifier: { namespace: "minecraft", registry: "worldgen/structure", resource: "bastion_remnant" },
    data: {
        identifier: { namespace: "minecraft", registry: "worldgen/structure", resource: "bastion_remnant" },
        type: "minecraft:bastion_remnant",
        biomes: ["#minecraft:nether_biomes"],
        step: "underground_structures",
        terrainAdaptation: "none",
        // Flattened Jigsaw properties
        startPool: "minecraft:bastion/starts",
        size: 6,
        startHeight: {
            type: "minecraft:uniform",
            minInclusive: 33,
            maxInclusive: 100
        },
        projectStartToHeightmap: "WORLD_SURFACE_WG",
        maxDistanceFromCenter: 111,
        useExpansionHack: false,
        tags: []
    }
};

export const fortressVoxel: DataDrivenRegistryElement<StructureProps> = {
    identifier: { namespace: "minecraft", registry: "worldgen/structure", resource: "fortress" },
    data: {
        identifier: { namespace: "minecraft", registry: "worldgen/structure", resource: "fortress" },
        type: "minecraft:fortress",
        biomes: ["#minecraft:nether_biomes"],
        step: "underground_structures",
        typeSpecific: {
            startYSpread: 30,
            startHeight: {
                type: "minecraft:uniform",
                minInclusive: 27,
                maxInclusive: 36
            }
        },
        tags: []
    }
};

export const VOXEL_TEMPLATE_STRUCTURE = [villageVoxel, mineshaftVoxel, bastionVoxel, fortressVoxel];
