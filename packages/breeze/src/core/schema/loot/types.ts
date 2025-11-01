import type { DataDrivenElement, VoxelElement } from "@/core/Element";

export interface LootTableProps extends VoxelElement {
	type?: string;
	items: LootItem[];
	groups: LootGroup[];
	randomSequence?: string;
	functions?: any[];
	pools?: PoolData[];
	disabled: boolean;
}

/**
 * LootItem is a simplified loot table item.
 * id. Represents the item id.
 */
export interface LootItem {
	id: string;
	name: string;
	entryType?: EntryType;
	value?: any;
	weight?: number;
	quality?: number;
	count?: {
		min: number;
		max: number;
	};
	conditions?: any[];
	functions?: any[];
	expand?: boolean;
	poolIndex: number;
	entryIndex: number;
	[key: string]: any;
}

/**
 * LootGroup is a simplified loot table group.
 * id. Represents the group id.
 */
export interface LootGroup {
	id: string;
	type: "alternatives" | "group" | "sequence";
	name?: string;
	items: string[];
	conditions?: any[];
	functions?: any[];
	poolIndex: number;
	entryIndex: number;
	[key: string]: any;
}

export interface PoolData {
	poolIndex: number;
	rolls: any;
	bonus_rolls?: any;
	functions?: any[];
	conditions?: any[];
	[key: string]: any;
}

export interface MinecraftLootTable extends DataDrivenElement {
	type?: string;
	pools?: MinecraftLootPool[];
	functions?: any[];
	random_sequence?: string;
	[key: string]: any;
}

export interface MinecraftLootPool {
	rolls: any;
	bonus_rolls?: any;
	entries: MinecraftLootEntry[];
	functions?: any[];
	conditions?: any[];
	[key: string]: any;
}

export interface MinecraftLootEntry {
	type: string;
	name?: string;
	value?: any;
	weight?: number;
	quality?: number;
	functions?: any[];
	conditions?: any[];
	children?: MinecraftLootEntry[];
	expand?: boolean;
	[key: string]: any;
}

export type EntryType =
	| "minecraft:item"
	| "minecraft:tag"
	| "minecraft:loot_table"
	| "minecraft:dynamic"
	| "minecraft:alternatives"
	| "minecraft:group"
	| "minecraft:empty"
	| "minecraft:sequence"
	| string;

export type GroupType = "alternatives" | "group" | "sequence";

export interface ProcessingContext {
	items: LootItem[];
	groups: LootGroup[];
	itemCounter: number;
	groupCounter: number;
}
