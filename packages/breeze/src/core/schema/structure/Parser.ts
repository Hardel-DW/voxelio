import type { Parser, ParserParams } from "@/core/Datapack";
import type { DimensionPadding, MinecraftStructure, MobCategory, PoolAlias, SpawnOverride, StructureProps } from "./types";
import { JIGSAW_STRUCTURE_TYPES } from "@/core/schema/structure/types";

/**
 * Parse Minecraft Structure to simplified Voxel format.
 */
export const StructureDataDrivenToVoxelFormat: Parser<StructureProps, MinecraftStructure> = ({
	element,
	configurator
}: ParserParams<MinecraftStructure>): StructureProps => {
	const data = structuredClone(element.data);

	const biomes = Array.isArray(data.biomes) ? data.biomes : [data.biomes];

	const spawnOverridesEntries = Object.entries(data.spawn_overrides || {});
	const spawnOverrides: SpawnOverride[] | undefined =
		spawnOverridesEntries.length > 0
			? spawnOverridesEntries.map(([category, override]) => ({
				mobCategory: category as MobCategory,
				boundingBox: override.bounding_box,
				spawns: override.spawns || []
			}))
			: undefined;

	const structure: StructureProps = {
		identifier: element.identifier,
		type: data.type,
		biomes,
		step: data.step,
		override: configurator
	};

	if (spawnOverrides) {
		structure.spawnOverrides = spawnOverrides;
	}

	if (data.terrain_adaptation) {
		structure.terrainAdaptation = data.terrain_adaptation;
	}

	if (JIGSAW_STRUCTURE_TYPES.has(data.type)) {
		if (data.start_pool) structure.startPool = data.start_pool;
		if (data.size !== undefined) structure.size = data.size;
		if (data.start_height) structure.startHeight = data.start_height;
		if (data.start_jigsaw_name) structure.startJigsawName = data.start_jigsaw_name;
		if (data.project_start_to_heightmap) structure.projectStartToHeightmap = data.project_start_to_heightmap;
		if (data.max_distance_from_center !== undefined) structure.maxDistanceFromCenter = data.max_distance_from_center;
		if (data.use_expansion_hack !== undefined) structure.useExpansionHack = data.use_expansion_hack;
		if (data.pool_aliases?.length) structure.poolAliases = data.pool_aliases.map(normalizePoolAlias);
		if (data.dimension_padding) structure.dimensionPadding = normalizeDimensionPadding(data.dimension_padding);
		if (data.liquid_settings) structure.liquidSettings = data.liquid_settings;
	} else {
		const typeSpecific: Record<string, any> = {};

		const legacyProps = [
			"probability",
			"mineshaft_type",
			"height",
			"biome_temp",
			"large_probability",
			"cluster_probability",
			"setups",
			"is_beached"
		];

		for (const prop of legacyProps) {
			if (data[prop] !== undefined) {
				typeSpecific[prop] = data[prop];
			}
		}

		if (Object.keys(typeSpecific).length > 0) {
			structure.typeSpecific = typeSpecific;
		}
	}

	return structure;
};

/**
 * Normalize pool alias to unified format
 */
function normalizePoolAlias(alias: any): PoolAlias {
	return {
		type: alias.type,
		...(alias.alias && { alias: alias.alias }),
		...(alias.target && { target: alias.target }),
		...(alias.targets && { targets: alias.targets }),
		...(alias.groups && { groups: alias.groups })
	};
}

/**
 * Normalize dimension padding to object format
 */
function normalizeDimensionPadding(padding: number | any): DimensionPadding {
	if (typeof padding === "number") {
		return { bottom: padding, top: padding };
	}
	return {
		...(padding.bottom !== undefined && { bottom: padding.bottom }),
		...(padding.top !== undefined && { top: padding.top })
	};
}
