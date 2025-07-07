import type { DataDrivenRegistryElement } from "@/core/Element";
import type { StructureSetProps } from "@/core/schema/structure_set/types";

// Helper function to create mock structure set elements
export function createMockStructureSet(overrides: Partial<StructureSetProps> = {}): StructureSetProps {
	return {
		identifier: { namespace: "test", registry: "worldgen/structure_set", resource: "test_structures" },
		structures: [
			{
				structure: "minecraft:village_plains",
				weight: 10
			}
		],
		placementType: "minecraft:random_spread",
		salt: 12345,
		spacing: 32,
		separation: 8,
		spreadType: "triangular",
		tags: [],
		...overrides
	};
}

export const villageVoxel: DataDrivenRegistryElement<StructureSetProps> = {
	identifier: { namespace: "minecraft", registry: "worldgen/structure_set", resource: "villages" },
	data: {
		identifier: { namespace: "minecraft", registry: "worldgen/structure_set", resource: "villages" },
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
		placementType: "minecraft:random_spread",
		salt: 10387312,
		spacing: 32,
		separation: 8,
		spreadType: "triangular",
		tags: []
	}
};

export const strongholdVoxel: DataDrivenRegistryElement<StructureSetProps> = {
	identifier: { namespace: "minecraft", registry: "worldgen/structure_set", resource: "strongholds" },
	data: {
		identifier: { namespace: "minecraft", registry: "worldgen/structure_set", resource: "strongholds" },
		structures: [
			{
				structure: "minecraft:stronghold",
				weight: 1
			}
		],
		placementType: "minecraft:concentric_rings",
		salt: 0,
		distance: 32,
		spread: 3,
		count: 128,
		preferredBiomes: ["#minecraft:stronghold_biased_to"],
		tags: []
	}
};

export const ruinedPortalVoxel: DataDrivenRegistryElement<StructureSetProps> = {
	identifier: { namespace: "minecraft", registry: "worldgen/structure_set", resource: "ruined_portals" },
	data: {
		identifier: { namespace: "minecraft", registry: "worldgen/structure_set", resource: "ruined_portals" },
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
		placementType: "minecraft:random_spread",
		salt: 34222645,
		frequencyReductionMethod: "legacy_type_1",
		frequency: 0.01666667,
		spacing: 40,
		separation: 15,
		tags: []
	}
};

export const endCityVoxel: DataDrivenRegistryElement<StructureSetProps> = {
	identifier: { namespace: "minecraft", registry: "worldgen/structure_set", resource: "end_cities" },
	data: {
		identifier: { namespace: "minecraft", registry: "worldgen/structure_set", resource: "end_cities" },
		structures: [
			{
				structure: "minecraft:end_city",
				weight: 1
			}
		],
		placementType: "minecraft:random_spread",
		salt: 10387313,
		spacing: 20,
		separation: 11,
		exclusionZone: {
			otherSet: "minecraft:strongholds",
			chunkCount: 12
		},
		tags: []
	}
};

export const VOXEL_TEMPLATE_STRUCTURE_SET = [villageVoxel, strongholdVoxel, ruinedPortalVoxel, endCityVoxel];
