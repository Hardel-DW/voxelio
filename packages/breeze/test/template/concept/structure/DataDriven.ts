import type { DataDrivenRegistryElement } from "@/core/Element";
import type { MinecraftStructure } from "@/core/schema/structure/types";

export const village: DataDrivenRegistryElement<MinecraftStructure> = {
	identifier: { namespace: "minecraft", registry: "worldgen/structure", resource: "village_plains" },
	data: {
		type: "minecraft:village",
		biomes: ["#minecraft:village_biomes"],
		step: "surface_structures",
		terrain_adaptation: "beard_thin",
		spawn_overrides: {
			monster: {
				bounding_box: "piece",
				spawns: [
					{
						type: "minecraft:zombie",
						weight: 1,
						minCount: 1,
						maxCount: 3
					}
				]
			}
		},
		start_pool: "minecraft:village/common",
		size: 6,
		start_height: {
			type: "minecraft:uniform",
			min_inclusive: 0,
			max_inclusive: 0
		},
		project_start_to_heightmap: "WORLD_SURFACE_WG",
		max_distance_from_center: 80,
		use_expansion_hack: false
	}
};

export const mineshaft: DataDrivenRegistryElement<MinecraftStructure> = {
	identifier: { namespace: "minecraft", registry: "worldgen/structure", resource: "mineshaft" },
	data: {
		type: "minecraft:mineshaft",
		biomes: ["#minecraft:mineshaft_biomes"],
		step: "underground_structures",
		spawn_overrides: {},
		mineshaft_type: "normal",
		probability: 0.004
	}
};

export const bastion: DataDrivenRegistryElement<MinecraftStructure> = {
	identifier: { namespace: "minecraft", registry: "worldgen/structure", resource: "bastion_remnant" },
	data: {
		type: "minecraft:bastion_remnant",
		biomes: ["#minecraft:nether_biomes"],
		step: "underground_structures",
		terrain_adaptation: "none",
		spawn_overrides: {},
		start_pool: "minecraft:bastion/starts",
		size: 6,
		start_height: {
			type: "minecraft:uniform",
			min_inclusive: 33,
			max_inclusive: 100
		},
		project_start_to_heightmap: "WORLD_SURFACE_WG",
		max_distance_from_center: 111,
		use_expansion_hack: false
	}
};

export const fortress: DataDrivenRegistryElement<MinecraftStructure> = {
	identifier: { namespace: "minecraft", registry: "worldgen/structure", resource: "fortress" },
	data: {
		type: "minecraft:fortress",
		biomes: ["#minecraft:nether_biomes"],
		step: "underground_structures",
		spawn_overrides: {},
		start_y_spread: 30,
		start_height: {
			type: "minecraft:uniform",
			min_inclusive: 27,
			max_inclusive: 36
		}
	}
};

export const structureDataDriven = [village, mineshaft, bastion, fortress];
