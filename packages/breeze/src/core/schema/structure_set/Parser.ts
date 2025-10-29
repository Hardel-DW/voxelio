import type { Parser, ParserParams } from "@/core/Datapack";
import type { MinecraftStructureSet, PlacementType, StructureSetProps, StructureSetStructure } from "@/core/schema/structure_set/types";
import { CONCENTRIC_RINGS_TYPES, RANDOM_SPREAD_TYPES } from "@/core/schema/structure_set/types";

/**
 * Parse Minecraft Structure Set to simplified Voxel format
 */
export const StructureSetDataDrivenToVoxelFormat: Parser<StructureSetProps, MinecraftStructureSet> = ({
	element,
	tags = [],
	configurator
}: ParserParams<MinecraftStructureSet>): StructureSetProps => {
	const data = structuredClone(element.data);
	const placement = data.placement;

	const structures: StructureSetStructure[] = data.structures.map((struct) => ({
		structure: struct.structure,
		weight: struct.weight
	}));

	const preferredBiomes = placement.preferred_biomes
		? Array.isArray(placement.preferred_biomes)
			? placement.preferred_biomes
			: [placement.preferred_biomes]
		: undefined;

	const structureSet: StructureSetProps = {
		identifier: element.identifier,
		structures,
		placementType: placement.type as PlacementType,
		override: configurator,
		tags
	};

	if (placement.salt !== undefined) {
		structureSet.salt = placement.salt;
	}
	if (placement.frequency_reduction_method) {
		structureSet.frequencyReductionMethod = placement.frequency_reduction_method;
	}
	if (placement.frequency !== undefined) {
		structureSet.frequency = placement.frequency;
	}
	if (placement.locate_offset) {
		structureSet.locateOffset = placement.locate_offset;
	}
	if (placement.exclusion_zone) {
		structureSet.exclusionZone = {
			otherSet: placement.exclusion_zone.other_set,
			chunkCount: placement.exclusion_zone.chunk_count
		};
	}

	if (CONCENTRIC_RINGS_TYPES.has(placement.type)) {
		if (placement.distance !== undefined) structureSet.distance = placement.distance;
		if (placement.spread !== undefined) structureSet.spread = placement.spread;
		if (placement.count !== undefined) structureSet.count = placement.count;
		if (preferredBiomes) structureSet.preferredBiomes = preferredBiomes;
	} else if (RANDOM_SPREAD_TYPES.has(placement.type)) {
		if (placement.spacing !== undefined) structureSet.spacing = placement.spacing;
		if (placement.separation !== undefined) structureSet.separation = placement.separation;
		if (placement.spread_type) structureSet.spreadType = placement.spread_type;
	}

	return structureSet;
};
