import type { DataDrivenRegistryElement } from "@/core/Element";
import type { Enchantment } from "@/core/schema/enchant/types";
import type { TagType } from "@/core/Tag";

/**
 * Test enchantments for exclusive_set testing
 * Covers: string, tag, array formats for exclusive_set
 */
export const EXCLUSIVITY_TEST_ENCHANTMENTS: DataDrivenRegistryElement<Enchantment>[] = [
	{
		identifier: { namespace: "test", registry: "enchantment", resource: "sharpness_v2" },
		data: {
			description: { translate: "test.sharpness_v2", fallback: "Sharpness V2" },
			weight: 10,
			max_level: 5,
			min_cost: { base: 1, per_level_above_first: 11 },
			max_cost: { base: 21, per_level_above_first: 11 },
			anvil_cost: 1,
			slots: ["mainhand"],
			exclusive_set: "minecraft:sharpness",
			supported_items: "#minecraft:enchantable/sword"
		}
	},
	{
		identifier: { namespace: "test", registry: "enchantment", resource: "damage_boost" },
		data: {
			description: { translate: "test.damage_boost", fallback: "Damage Boost" },
			weight: 8,
			max_level: 3,
			min_cost: { base: 5, per_level_above_first: 8 },
			max_cost: { base: 25, per_level_above_first: 8 },
			anvil_cost: 2,
			slots: ["mainhand"],
			exclusive_set: "#test:exclusive_set/damage",
			supported_items: "#minecraft:enchantable/weapon"
		}
	},
	{
		identifier: { namespace: "test", registry: "enchantment", resource: "multi_exclusive" },
		data: {
			description: { translate: "test.multi_exclusive", fallback: "Multi Exclusive" },
			weight: 5,
			max_level: 1,
			min_cost: { base: 10, per_level_above_first: 0 },
			max_cost: { base: 40, per_level_above_first: 0 },
			anvil_cost: 3,
			slots: ["mainhand"],
			exclusive_set: ["minecraft:sharpness", "minecraft:smite"],
			supported_items: "#minecraft:enchantable/sword"
		}
	},
	{
		identifier: { namespace: "test", registry: "enchantment", resource: "universal" },
		data: {
			description: { translate: "test.universal", fallback: "Universal" },
			weight: 3,
			max_level: 1,
			min_cost: { base: 1, per_level_above_first: 0 },
			max_cost: { base: 50, per_level_above_first: 0 },
			anvil_cost: 1,
			slots: ["mainhand"],
			supported_items: "#minecraft:enchantable/weapon"
		}
	}
];

/**
 * Test enchantments for primary_items vs supported_items testing
 */
export const PRIMARY_ITEMS_TEST_ENCHANTMENTS: DataDrivenRegistryElement<Enchantment>[] = [
	{
		identifier: { namespace: "test", registry: "enchantment", resource: "supported_only_string" },
		data: {
			description: { translate: "test.supported_only_string", fallback: "Supported Only String" },
			weight: 5,
			max_level: 1,
			min_cost: { base: 1, per_level_above_first: 0 },
			max_cost: { base: 50, per_level_above_first: 0 },
			anvil_cost: 1,
			slots: ["mainhand"],
			supported_items: "minecraft:diamond_sword"
		}
	},
	{
		identifier: { namespace: "test", registry: "enchantment", resource: "supported_only_tag" },
		data: {
			description: { translate: "test.supported_only_tag", fallback: "Supported Only Tag" },
			weight: 5,
			max_level: 1,
			min_cost: { base: 1, per_level_above_first: 0 },
			max_cost: { base: 50, per_level_above_first: 0 },
			anvil_cost: 1,
			slots: ["mainhand"],
			supported_items: "#minecraft:enchantable/sword"
		}
	},
	{
		identifier: { namespace: "test", registry: "enchantment", resource: "supported_only_array" },
		data: {
			description: { translate: "test.supported_only_array", fallback: "Supported Only Array" },
			weight: 5,
			max_level: 1,
			min_cost: { base: 1, per_level_above_first: 0 },
			max_cost: { base: 50, per_level_above_first: 0 },
			anvil_cost: 1,
			slots: ["mainhand"],
			supported_items: ["minecraft:diamond_sword", "minecraft:iron_sword"]
		}
	},
	{
		identifier: { namespace: "test", registry: "enchantment", resource: "primary_wins" },
		data: {
			description: { translate: "test.primary_wins", fallback: "Primary Wins" },
			weight: 5,
			max_level: 1,
			min_cost: { base: 1, per_level_above_first: 0 },
			max_cost: { base: 50, per_level_above_first: 0 },
			anvil_cost: 1,
			slots: ["mainhand"],
			primary_items: "minecraft:diamond_sword",
			supported_items: "minecraft:stone_sword"
		}
	},
	{
		identifier: { namespace: "test", registry: "enchantment", resource: "primary_tag" },
		data: {
			description: { translate: "test.primary_tag", fallback: "Primary Tag" },
			weight: 5,
			max_level: 1,
			min_cost: { base: 1, per_level_above_first: 0 },
			max_cost: { base: 50, per_level_above_first: 0 },
			anvil_cost: 1,
			slots: ["mainhand"],
			primary_items: "#minecraft:enchantable/sword",
			supported_items: "#minecraft:enchantable/weapon"
		}
	},
	{
		identifier: { namespace: "test", registry: "enchantment", resource: "primary_array" },
		data: {
			description: { translate: "test.primary_array", fallback: "Primary Array" },
			weight: 5,
			max_level: 1,
			min_cost: { base: 1, per_level_above_first: 0 },
			max_cost: { base: 50, per_level_above_first: 0 },
			anvil_cost: 1,
			slots: ["mainhand"],
			primary_items: ["minecraft:diamond_sword", "minecraft:netherite_sword"],
			supported_items: "#minecraft:enchantable/weapon"
		}
	}
];

/**
 * Vanilla enchantments for testing exclusivity
 */
export const VANILLA_TEST_ENCHANTMENTS: DataDrivenRegistryElement<Enchantment>[] = [
	{
		identifier: { namespace: "minecraft", registry: "enchantment", resource: "sharpness" },
		data: {
			description: { translate: "enchantment.minecraft.sharpness", fallback: "Sharpness" },
			weight: 10,
			max_level: 5,
			min_cost: { base: 1, per_level_above_first: 11 },
			max_cost: { base: 21, per_level_above_first: 11 },
			anvil_cost: 1,
			slots: ["mainhand"],
			exclusive_set: "#minecraft:exclusive_set/damage",
			supported_items: "#minecraft:enchantable/sword"
		}
	},
	{
		identifier: { namespace: "minecraft", registry: "enchantment", resource: "smite" },
		data: {
			description: { translate: "enchantment.minecraft.smite", fallback: "Smite" },
			weight: 5,
			max_level: 5,
			min_cost: { base: 5, per_level_above_first: 8 },
			max_cost: { base: 25, per_level_above_first: 8 },
			anvil_cost: 2,
			slots: ["mainhand"],
			exclusive_set: "#minecraft:exclusive_set/damage",
			supported_items: "#minecraft:enchantable/sword"
		}
	},
	{
		identifier: { namespace: "minecraft", registry: "enchantment", resource: "unbreaking" },
		data: {
			description: { translate: "enchantment.minecraft.unbreaking", fallback: "Unbreaking" },
			weight: 5,
			max_level: 3,
			min_cost: { base: 5, per_level_above_first: 8 },
			max_cost: { base: 55, per_level_above_first: 8 },
			anvil_cost: 2,
			slots: ["mainhand", "offhand", "feet", "legs", "chest", "head"],
			supported_items: "#minecraft:enchantable/durability"
		}
	}
];

/**
 * Test tags for exclusive_set testing
 */
export const EXCLUSIVITY_TEST_TAGS: DataDrivenRegistryElement<TagType>[] = [
	{
		identifier: { namespace: "test", registry: "tags/enchantment", resource: "exclusive_set/damage" },
		data: {
			values: [
				"minecraft:sharpness",
				"minecraft:smite",
				"minecraft:bane_of_arthropods",
				"test:damage_boost"
			]
		}
	},
	{
		identifier: { namespace: "test", registry: "tags/enchantment", resource: "exclusive_set/protection" },
		data: {
			values: ["minecraft:protection", "minecraft:fire_protection", "minecraft:blast_protection", "minecraft:projectile_protection"]
		}
	},
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "in_enchanting_table" },
		data: {
			values: [
				"#minecraft:non_treasure",
				"test:sharpness_v2",
				"test:damage_boost",
				"test:multi_exclusive",
				"test:universal",
				"test:supported_only_string",
				"test:supported_only_tag",
				"test:supported_only_array",
				"test:primary_wins",
				"test:primary_tag",
				"test:primary_array"
			]
		}
	}
];
