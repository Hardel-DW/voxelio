import type { VoxelRegistryElement } from "@/core/Element";
import type { LootTableProps } from "@/core/schema/loot/types";

const prefiledLootProperties = {
	type: "minecraft:entity",
	randomSequence: undefined,
	override: undefined
};

export const VOXEL_TEMPLATE_LOOT_TABLE: VoxelRegistryElement<LootTableProps>[] = [
	// Simple loot table
	{
		identifier: "10000000-0000-0000-0000-000000000000",
		data: {
			identifier: { namespace: "test", registry: "loot_table", resource: "simple" },
			...prefiledLootProperties,
			disabled: false,
			items: [
				{
					id: "item_0",
					name: "minecraft:experience_bottle",
					weight: undefined,
					quality: undefined,
					count: { min: 1, max: 3 },
					conditions: ["minecraft:random_chance"],
					functions: ["minecraft:set_count"],
					poolIndex: 0,
					entryIndex: 0,
					entryType: "minecraft:item"
				}
			],
			groups: []
		}
	},
	// Complex loot table with groups
	{
		identifier: "10000000-0000-0000-0000-000000000001",
		data: {
			identifier: { namespace: "test", registry: "loot_table", resource: "extreme" },
			...prefiledLootProperties,
			type: "minecraft:entity",
			randomSequence: "minecraft:entities/wither_skeleton",
			disabled: false,
			items: [
				{
					id: "dynamic_0",
					name: "minecraft:contents",
					poolIndex: 0,
					entryIndex: 0,
					entryType: "minecraft:dynamic"
				},
				{
					id: "item_0",
					name: "minecraft:amethyst_shard",
					poolIndex: 0,
					entryIndex: 0,
					entryType: "minecraft:item"
				}
			],
			groups: [
				{
					id: "group_0",
					type: "alternatives",
					items: ["dynamic_0", "group_1"],
					poolIndex: 0,
					entryIndex: 0
				},
				{
					id: "group_1",
					type: "group",
					items: ["group_2"],
					poolIndex: 0,
					entryIndex: 0
				},
				{
					id: "group_2",
					type: "sequence",
					items: ["item_0"],
					poolIndex: 0,
					entryIndex: 0
				}
			]
		}
	},
	// Multi-pool loot table
	{
		identifier: "10000000-0000-0000-0000-000000000002",
		data: {
			identifier: { namespace: "test", registry: "loot_table", resource: "reference" },
			...prefiledLootProperties,
			type: "minecraft:equipment",
			randomSequence: "yggdrasil:equipment",
			disabled: false,
			items: [
				{
					id: "item_0",
					name: "yggdrasil:generic/equipment/ominous/item/sword",
					poolIndex: 0,
					entryIndex: 0,
					entryType: "minecraft:loot_table"
				},
				{
					id: "item_1",
					name: "yggdrasil:generic/equipment/ominous/item/helmet",
					poolIndex: 1,
					entryIndex: 0,
					entryType: "minecraft:loot_table"
				},
				{
					id: "item_2",
					name: "yggdrasil:generic/equipment/ominous/item/chestplate",
					poolIndex: 2,
					entryIndex: 0,
					entryType: "minecraft:loot_table"
				}
			],
			groups: []
		}
	}
];
