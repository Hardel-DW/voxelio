import type { DataDrivenRegistryElement } from "@/core/Element";
import type { TagType } from "@/core/Tag";

export const vanillaDatapackTags: DataDrivenRegistryElement<TagType>[] = [
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "in_enchanting_table" },
		data: { values: ["#minecraft:non_treasure"] }
	},
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "non_treasure" },
		data: { values: ["minecraft:sharpness", "minecraft:unbreaking", "minecraft:efficiency"] }
	},
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "exclusive_set/damage" },
		data: { values: ["minecraft:sharpness", "minecraft:smite", "minecraft:bane_of_arthropods"] }
	}
];

export const customDatapackTags: DataDrivenRegistryElement<TagType>[] = [
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "in_enchanting_table" },
		data: { values: ["enchantplus:bow/eternal_frost", "enchantplus:sword/lightning"] }
	},
	{
		identifier: { namespace: "enchantplus", registry: "tags/enchantment", resource: "exclusive_set/custom" },
		data: { values: ["enchantplus:bow/eternal_frost", "enchantplus:bow/flame_burst"] }
	}
];

export const advancedDatapackTags: DataDrivenRegistryElement<TagType>[] = [
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "in_enchanting_table" },
		data: { values: ["enchantplus:bow/eternal_frost", "enchantplus:sword/lightning"] }
	},
	{
		identifier: { namespace: "enchantplus", registry: "tags/enchantment", resource: "exclusive_set/custom" },
		data: { values: ["enchantplus:bow/eternal_frost", "enchantplus:bow/flame_burst"] }
	},
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "non_treasure" },
		data: { values: ["enchantplus:yay", "#enchantplus:exclusive_set/custom"] }
	}
];

export const replacingDatapackTags: DataDrivenRegistryElement<TagType>[] = [
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "non_treasure" },
		data: { values: ["enchantplus:custom_only"], replace: true }
	}
];

export const enchantplusTags: DataDrivenRegistryElement<TagType>[] = [
	{
		identifier: { namespace: "enchantplus", registry: "tags/enchantment", resource: "exclusive_set/archery" },
		data: { values: ["enchantplus:bow/accuracy_shot"] }
	},
	{
		identifier: { namespace: "enchantplus", registry: "tags/enchantment", resource: "exclusive_set/armor" },
		data: { values: ["enchantplus:boots/agility", "enchantplus:elytra/armored"] }
	},
	{
		identifier: { namespace: "enchantplus", registry: "tags/enchantment", resource: "exclusive_set/aspect" },
		data: { values: ["enchantplus:sword/poison_aspect", "enchantplus:sword/attack_speed", "enchantplus:sword/death_touch"] }
	}
];

export const vanillaTags: DataDrivenRegistryElement<TagType>[] = [
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "curse" },
		data: { values: ["enchantplus:sword/poison_aspect"] }
	},
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "double_trade_price" },
		data: { values: ["enchantplus:sword/attack_speed", "enchantplus:sword/poison_aspect"] }
	},
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "in_enchanting_table" },
		data: { values: ["enchantplus:sword/poison_aspect"] }
	},
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "non_treasure" },
		data: { values: ["enchantplus:bow/accuracy_shot", "enchantplus:sword/poison_aspect", "enchantplus:sword/attack_speed"] }
	},
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "on_random_loot" },
		data: { values: ["enchantplus:elytra/armored", "enchantplus:sword/poison_aspect", "enchantplus:sword/attack_speed"] }
	},
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "prevents_bee_spawns_when_mining" },
		data: { values: ["enchantplus:boots/agility"] }
	},
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "exclusive_set/armor" },
		data: { values: ["enchantplus:elytra/armored"] }
	}
];

export const exclusivityTestTags: DataDrivenRegistryElement<TagType>[] = [
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "exclusive_set/damage" },
		data: {
			values: ["minecraft:sharpness", "minecraft:smite", "minecraft:bane_of_arthropods"]
		}
	},
	{
		identifier: { namespace: "test", registry: "tags/enchantment", resource: "exclusive_set/damage" },
		data: {
			values: ["minecraft:sharpness", "minecraft:smite", "minecraft:bane_of_arthropods", "test:damage_boost"]
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

export const simulationTags: DataDrivenRegistryElement<TagType>[] = [
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "in_enchanting_table" },
		data: { values: ["#minecraft:non_treasure"] }
	},
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "non_treasure" },
		data: {
			values: [
				"minecraft:protection",
				"minecraft:fire_protection",
				"minecraft:feather_falling",
				"minecraft:blast_protection",
				"minecraft:projectile_protection",
				"minecraft:respiration",
				"minecraft:aqua_affinity",
				"minecraft:thorns",
				"minecraft:depth_strider",
				"minecraft:sharpness",
				"minecraft:smite",
				"minecraft:bane_of_arthropods",
				"minecraft:knockback",
				"minecraft:fire_aspect",
				"minecraft:looting",
				"minecraft:sweeping_edge",
				"minecraft:efficiency",
				"minecraft:silk_touch",
				"minecraft:unbreaking",
				"minecraft:fortune",
				"minecraft:power",
				"minecraft:punch",
				"minecraft:flame",
				"minecraft:infinity",
				"minecraft:luck_of_the_sea",
				"minecraft:lure",
				"minecraft:loyalty",
				"minecraft:impaling",
				"minecraft:riptide",
				"minecraft:channeling",
				"minecraft:multishot",
				"minecraft:quick_charge",
				"minecraft:piercing",
				"minecraft:density",
				"minecraft:breach"
			]
		}
	},
	{
		identifier: { namespace: "minecraft", registry: "tags/enchantment", resource: "exclusive_set/damage" },
		data: { values: ["minecraft:sharpness", "minecraft:smite", "minecraft:bane_of_arthropods"] }
	}
];
