import type { DataDrivenRegistryElement } from "@/core/Element";
import type { MinecraftStructureSet } from "@/core/schema/structure_set/types";

export const villageStructureSet: DataDrivenRegistryElement<MinecraftStructureSet> = {
	identifier: { namespace: "minecraft", registry: "worldgen/structure_set", resource: "villages" },
	data: {
		structures: [
			{
				structure: "minecraft:village_plains",
				weight: 10
			},
			{
				structure: "minecraft:village_desert",
				weight: 2
			},
			{
				structure: "minecraft:village_savanna",
				weight: 5
			}
		],
		placement: {
			type: "minecraft:random_spread",
			spacing: 32,
			separation: 8,
			salt: 10387312,
			spread_type: "triangular"
		}
	}
};

export const strongholdStructureSet: DataDrivenRegistryElement<MinecraftStructureSet> = {
	identifier: { namespace: "minecraft", registry: "worldgen/structure_set", resource: "strongholds" },
	data: {
		structures: [
			{
				structure: "minecraft:stronghold",
				weight: 1
			}
		],
		placement: {
			type: "minecraft:concentric_rings",
			distance: 32,
			spread: 3,
			count: 128,
			preferred_biomes: ["#minecraft:stronghold_biased_to"],
			salt: 0
		}
	}
};

export const ruinedPortalStructureSet: DataDrivenRegistryElement<MinecraftStructureSet> = {
	identifier: { namespace: "minecraft", registry: "worldgen/structure_set", resource: "ruined_portals" },
	data: {
		structures: [
			{
				structure: "minecraft:ruined_portal_standard",
				weight: 40
			},
			{
				structure: "minecraft:ruined_portal_desert",
				weight: 40
			},
			{
				structure: "minecraft:ruined_portal_jungle",
				weight: 40
			},
			{
				structure: "minecraft:ruined_portal_swamp",
				weight: 40
			},
			{
				structure: "minecraft:ruined_portal_mountain",
				weight: 40
			},
			{
				structure: "minecraft:ruined_portal_ocean",
				weight: 40
			},
			{
				structure: "minecraft:ruined_portal_nether",
				weight: 30
			}
		],
		placement: {
			type: "minecraft:random_spread",
			spacing: 40,
			separation: 15,
			salt: 34222645,
			frequency_reduction_method: "legacy_type_1",
			frequency: 0.01666667
		}
	}
};

export const endCityStructureSet: DataDrivenRegistryElement<MinecraftStructureSet> = {
	identifier: { namespace: "minecraft", registry: "worldgen/structure_set", resource: "end_cities" },
	data: {
		structures: [
			{
				structure: "minecraft:end_city",
				weight: 1
			}
		],
		placement: {
			type: "minecraft:random_spread",
			spacing: 20,
			separation: 11,
			salt: 10387313,
			exclusion_zone: {
				other_set: "minecraft:strongholds",
				chunk_count: 12
			}
		}
	}
};