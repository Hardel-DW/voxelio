import type { DataDrivenElement, VoxelElement } from "@/core/Element";
import { Identifier } from "@/core/Identifier";
import type { SlotRegistryType } from "@/core/SlotManager";
import type { SingleOrMultiple } from "@/index";
import type { TextComponentType } from "@/core/schema/TextComponentType";

export const FUNCTIONALITY_TAGS = [
	{ namespace: "minecraft", registry: "tags/enchantment", resource: "curse" },
	{ namespace: "minecraft", registry: "tags/enchantment", resource: "double_trade_price" },
	{ namespace: "minecraft", registry: "tags/enchantment", resource: "prevents_bee_spawns_when_mining" },
	{ namespace: "minecraft", registry: "tags/enchantment", resource: "prevents_decorated_pot_shattering" },
	{ namespace: "minecraft", registry: "tags/enchantment", resource: "prevents_ice_melting" },
	{ namespace: "minecraft", registry: "tags/enchantment", resource: "prevents_infested_spawns" },
	{ namespace: "minecraft", registry: "tags/enchantment", resource: "smelts_loot" },
	{ namespace: "minecraft", registry: "tags/enchantment", resource: "tooltip_order" }
];

export const FUNCTIONALITY_TAGS_CACHE = new Set(FUNCTIONALITY_TAGS.map((tag) => new Identifier(tag).toString()));
export interface EnchantmentProps extends VoxelElement {
	description: TextComponentType;
	exclusiveSet: SingleOrMultiple<string> | undefined;
	supportedItems: SingleOrMultiple<string>;
	primaryItems: SingleOrMultiple<string> | undefined;
	maxLevel: number;
	weight: number;
	anvilCost: number;
	minCostBase: number;
	minCostPerLevelAboveFirst: number;
	maxCostBase: number;
	maxCostPerLevelAboveFirst: number;
	effects: Record<string, unknown> | undefined;
	slots: SlotRegistryType[];
	tags: string[];
	mode: "normal" | "soft_delete" | "only_creative";
	disabledEffects: string[];
}

export interface Enchantment extends DataDrivenElement {
	description: TextComponentType;
	exclusive_set?: SingleOrMultiple<string>;
	supported_items: SingleOrMultiple<string>;
	primary_items?: SingleOrMultiple<string>;
	weight: number;
	max_level: number;
	min_cost: EnchantmentCost;
	max_cost: EnchantmentCost;
	anvil_cost: number;
	slots: SlotRegistryType[];
	effects?: Record<string, any>;
}

export interface EnchantmentCost {
	base: number;
	per_level_above_first: number;
}