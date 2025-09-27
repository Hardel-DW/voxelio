import { LootDataDrivenToVoxelFormat } from "@/core/schema/loot/Parser";
import type { MinecraftLootTable } from "@/core/schema/loot/types";
import { finalBossOfLootTable } from "./DataDriven";

const simpleLoot: MinecraftLootTable = {
	type: "minecraft:chest",
	pools: [
		{
			entries: [
				{
					type: "minecraft:item",
					name: "minecraft:diamond_pickaxe",
					weight: 1
				},
				{
					type: "minecraft:item",
					name: "minecraft:diamond_shovel",
					weight: 2
				},
				{
					type: "minecraft:item",
					name: "minecraft:crossbow",
					weight: 3
				},
				{
					type: "minecraft:item",
					name: "minecraft:crossbow",
					weight: 4
				},
				{
					type: "minecraft:item",
					name: "minecraft:crossbow",
					weight: 5
				},
				{
					type: "minecraft:item",
					name: "minecraft:ancient_debris",
					weight: 6
				},
				{
					type: "minecraft:item",
					name: "minecraft:netherite_scrap",
					weight: 7
				},
				{
					type: "minecraft:item",
					name: "minecraft:spectral_arrow",
					weight: 8
				},
				{
					type: "minecraft:item",
					name: "minecraft:piglin_banner_pattern",
					weight: 9
				},
				{
					type: "minecraft:item",
					name: "minecraft:music_disc_pigstep",
					weight: 10
				},
				{
					type: "minecraft:item",
					name: "minecraft:golden_carrot",
					weight: 10
				},
				{
					type: "minecraft:item",
					name: "minecraft:golden_apple",
					weight: 10
				},
				{
					type: "minecraft:item",
					name: "minecraft:book",
					weight: 10
				}
			],
			rolls: 1
		}
	],
	random_sequence: "minecraft:chests/bastion_other"
};

export const simpleSimulationLootTable = LootDataDrivenToVoxelFormat({
	element: {
		identifier: {
			namespace: "test",
			resource: "simple",
			registry: "loot_table"
		},
		data: simpleLoot
	}
});

export const extremeLootTable = LootDataDrivenToVoxelFormat({
	element: {
		identifier: {
			namespace: "test",
			resource: "extreme",
			registry: "loot_table"
		},
		data: finalBossOfLootTable
	}
});
