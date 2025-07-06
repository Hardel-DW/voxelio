import type { IdentifierObject } from "@/core/Identifier";
import type { Analysers } from "@/core/engine/Analyser";
import type { Compiler } from "@/core/engine/Compiler";
import { processElementTags } from "@/core/schema/utils";
import type {
    MinecraftExclusionZone,
    MinecraftStructurePlacement,
    MinecraftStructureSet,
    MinecraftStructureSetElement,
    StructureSetProps
} from "./types";
import { CONCENTRIC_RINGS_TYPES, RANDOM_SPREAD_TYPES } from "./types";

/**
 * Compile Voxel format back to Minecraft Structure Set
 */
export const VoxelToStructureSetDataDriven: Compiler<StructureSetProps, MinecraftStructureSet> = (
    originalElement: StructureSetProps,
    config: keyof Analysers,
    original?: MinecraftStructureSet
) => {
    const element = structuredClone(originalElement);
    const structureSet = original ? structuredClone(original) : ({} as MinecraftStructureSet);
    const tags: IdentifierObject[] = processElementTags(element.tags, config);

    const structures: MinecraftStructureSetElement[] = element.structures.map((struct) => ({
        structure: struct.structure,
        weight: struct.weight
    }));

    const placement: MinecraftStructurePlacement = {
        type: element.placementType
    };

    if (element.salt !== undefined) {
        placement.salt = element.salt;
    }
    if (element.frequencyReductionMethod) {
        placement.frequency_reduction_method = element.frequencyReductionMethod;
    }
    if (element.frequency !== undefined) {
        placement.frequency = element.frequency;
    }
    if (element.locateOffset) {
        placement.locate_offset = element.locateOffset;
    }
    if (element.exclusionZone) {
        const exclusionZone: MinecraftExclusionZone = {
            other_set: element.exclusionZone.otherSet,
            chunk_count: element.exclusionZone.chunkCount
        };
        placement.exclusion_zone = exclusionZone;
    }

    if (CONCENTRIC_RINGS_TYPES.has(element.placementType)) {
        if (element.distance !== undefined) placement.distance = element.distance;
        if (element.spread !== undefined) placement.spread = element.spread;
        if (element.count !== undefined) placement.count = element.count;
        if (element.preferredBiomes?.length) {
            if (original?.placement?.preferred_biomes) {
                placement.preferred_biomes = original.placement.preferred_biomes;
            } else {
                placement.preferred_biomes = element.preferredBiomes;
            }
        }
    } else if (RANDOM_SPREAD_TYPES.has(element.placementType)) {
        if (element.spacing !== undefined) placement.spacing = element.spacing;
        if (element.separation !== undefined) placement.separation = element.separation;
        if (element.spreadType) placement.spread_type = element.spreadType;
    }

    if (element.unknownFields) {
        if (element.unknownFields.placement) {
            Object.assign(placement, element.unknownFields.placement);
        }

        const rootFields = { ...element.unknownFields };
        rootFields.placement = undefined;

        Object.assign(structureSet, rootFields);
    }

    structureSet.structures = structures;
    structureSet.placement = placement;

    return {
        element: {
            data: structureSet,
            identifier: element.identifier
        },
        tags
    };
};
