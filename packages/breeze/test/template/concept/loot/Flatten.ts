import { Identifier } from "@/core/Identifier";
import type { DataDrivenRegistryElement } from "@/core/Element";
import type { LootGroup, LootItem, LootTableProps } from "@/core/schema/loot/types";
import type { TagType } from "@/schema/TagType";

const loot = (id: string, items: LootItem[], groups: LootGroup[] = []): LootTableProps => ({
	identifier: Identifier.of(id, "loot_table"),
	type: "minecraft:generic",
	items,
	groups,
	pools: [],
	disabled: false
});

const item = (
	id: string,
	name: string,
	entryType: LootItem["entryType"] = "minecraft:item",
	poolIndex = 0,
	entryIndex = 0,
	weight?: number
): LootItem => ({
	id,
	name,
	entryType,
	poolIndex,
	entryIndex,
	...(weight !== undefined && { weight })
});

const group = (id: string, type: LootGroup["type"], items: string[], poolIndex = 0, entryIndex = 0): LootGroup => ({
	id,
	type,
	items,
	poolIndex,
	entryIndex
});

export const simpleLootTables = () => [loot("test:simple", [item("simple_item", "minecraft:diamond")])];

export const referencedLootTables = () => [
	loot("test:parent", [item("parent_entry", "test:child", "minecraft:loot_table")]),
	loot("test:child", [item("child_item", "minecraft:emerald")])
];

export const cyclicLootTables = () => [
	loot("test:first", [item("first_entry", "test:second", "minecraft:loot_table")]),
	loot("test:second", [item("second_entry", "test:first", "minecraft:loot_table")])
];

export const tagLootTables = () => [loot("test:tagged", [item("tag_entry", "#test:ores", "minecraft:tag")])];

export const itemTagRegistry = (): DataDrivenRegistryElement<TagType>[] => [
	{
		identifier: Identifier.of("test:ores", "tags/item"),
		data: { values: ["minecraft:iron_ingot", "minecraft:gold_ingot"] }
	}
];

export const alternativeLootTables = () => {
	const groupAlt = group("alt_group", "alternatives", ["loot_a", "loot_b"]);
	return [
		loot(
			"test:alt_parent",
			[
				item("loot_a", "test:alt_child_a", "minecraft:loot_table", 0, 0, 1),
				item("loot_b", "test:alt_child_b", "minecraft:loot_table", 0, 1, 3)
			],
			[groupAlt]
		),
		loot("test:alt_child_a", [item("child_a_item", "minecraft:emerald")]),
		loot("test:alt_child_b", [item("child_b_item", "minecraft:diamond")])
	];
};

export const deepReferenceLootTables = () => [
	loot("test:top", [item("top_entry", "test:mid", "minecraft:loot_table")]),
	loot("test:mid", [item("mid_entry", "test:bottom", "minecraft:loot_table")]),
	loot("test:bottom", [item("bottom_item", "minecraft:gold_block")])
];
