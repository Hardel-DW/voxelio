import type { TagType } from "@/schema/TagType";

export const tagsEnchantment: Record<string, TagType> = {
	curse: {
		values: ["minecraft:binding_curse", "minecraft:vanishing_curse"]
	},
	double_trade_price: {
		values: ["#minecraft:treasure"]
	},
	"exclusive_set/armor": {
		values: ["minecraft:protection", "minecraft:blast_protection", "minecraft:fire_protection", "minecraft:projectile_protection"]
	},
	"exclusive_set/boots": {
		values: ["minecraft:frost_walker", "minecraft:depth_strider"]
	},
	"exclusive_set/bow": {
		values: ["minecraft:infinity", "minecraft:mending"]
	},
	"exclusive_set/crossbow": {
		values: ["minecraft:multishot", "minecraft:piercing"]
	},
	"exclusive_set/damage": {
		values: [
			"minecraft:sharpness",
			"minecraft:smite",
			"minecraft:bane_of_arthropods",
			"minecraft:impaling",
			"minecraft:density",
			"minecraft:breach"
		]
	},
	"exclusive_set/mining": {
		values: ["minecraft:fortune", "minecraft:silk_touch"]
	},
	"exclusive_set/riptide": {
		values: ["minecraft:loyalty", "minecraft:channeling"]
	},
	in_enchanting_table: {
		values: ["#minecraft:non_treasure"]
	},
	non_treasure: {
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
	},
	on_mob_spawn_equipment: {
		values: ["#minecraft:non_treasure"]
	},
	on_random_loot: {
		values: [
			"#minecraft:non_treasure",
			"minecraft:binding_curse",
			"minecraft:vanishing_curse",
			"minecraft:frost_walker",
			"minecraft:mending"
		]
	},
	on_traded_equipment: {
		values: ["#minecraft:non_treasure"]
	},
	prevents_bee_spawns_when_mining: {
		values: ["minecraft:silk_touch"]
	},
	prevents_decorated_pot_shattering: {
		values: ["minecraft:silk_touch"]
	},
	prevents_ice_melting: {
		values: ["minecraft:silk_touch"]
	},
	prevents_infested_spawns: {
		values: ["minecraft:silk_touch"]
	},
	smelts_loot: {
		values: ["minecraft:fire_aspect"]
	},
	tooltip_order: {
		values: [
			"minecraft:binding_curse",
			"minecraft:vanishing_curse",
			"minecraft:riptide",
			"minecraft:channeling",
			"minecraft:wind_burst",
			"minecraft:frost_walker",
			"minecraft:sharpness",
			"minecraft:smite",
			"minecraft:bane_of_arthropods",
			"minecraft:impaling",
			"minecraft:power",
			"minecraft:density",
			"minecraft:breach",
			"minecraft:piercing",
			"minecraft:sweeping_edge",
			"minecraft:multishot",
			"minecraft:fire_aspect",
			"minecraft:flame",
			"minecraft:knockback",
			"minecraft:punch",
			"minecraft:protection",
			"minecraft:blast_protection",
			"minecraft:fire_protection",
			"minecraft:projectile_protection",
			"minecraft:feather_falling",
			"minecraft:fortune",
			"minecraft:looting",
			"minecraft:silk_touch",
			"minecraft:luck_of_the_sea",
			"minecraft:efficiency",
			"minecraft:quick_charge",
			"minecraft:lure",
			"minecraft:respiration",
			"minecraft:aqua_affinity",
			"minecraft:soul_speed",
			"minecraft:swift_sneak",
			"minecraft:depth_strider",
			"minecraft:thorns",
			"minecraft:loyalty",
			"minecraft:unbreaking",
			"minecraft:infinity",
			"minecraft:mending"
		]
	},
	tradeable: {
		values: [
			"#minecraft:non_treasure",
			"minecraft:binding_curse",
			"minecraft:vanishing_curse",
			"minecraft:frost_walker",
			"minecraft:mending"
		]
	},
	treasure: {
		values: [
			"minecraft:binding_curse",
			"minecraft:vanishing_curse",
			"minecraft:swift_sneak",
			"minecraft:soul_speed",
			"minecraft:frost_walker",
			"minecraft:mending",
			"minecraft:wind_burst"
		]
	}
};
