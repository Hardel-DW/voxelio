import type { Enchantment } from "@/core/schema/enchant/types";

export const enchantment: Record<string, Enchantment> = {
	aqua_affinity: {
		anvil_cost: 4,
		description: "Aqua Affinity",
		max_cost: {
			base: 41,
			per_level_above_first: 0
		},
		max_level: 1,
		min_cost: {
			base: 1,
			per_level_above_first: 0
		},
		slots: ["head"],
		supported_items: "#minecraft:enchantable/head_armor",
		weight: 2
	},
	bane_of_arthropods: {
		anvil_cost: 2,
		description: "Bane of Arthropods",
		exclusive_set: "#minecraft:exclusive_set/damage",
		max_cost: {
			base: 25,
			per_level_above_first: 8
		},
		max_level: 5,
		min_cost: {
			base: 5,
			per_level_above_first: 8
		},
		primary_items: "#minecraft:enchantable/sword",
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/weapon",
		weight: 5
	},
	binding_curse: {
		anvil_cost: 8,
		description: "Binding Curse",
		max_cost: {
			base: 50,
			per_level_above_first: 0
		},
		max_level: 1,
		min_cost: {
			base: 25,
			per_level_above_first: 0
		},
		slots: ["armor"],
		supported_items: "#minecraft:enchantable/equippable",
		weight: 1
	},
	blast_protection: {
		anvil_cost: 4,
		description: "Blast Protection",
		exclusive_set: "#minecraft:exclusive_set/armor",
		max_cost: {
			base: 13,
			per_level_above_first: 8
		},
		max_level: 4,
		min_cost: {
			base: 5,
			per_level_above_first: 8
		},
		slots: ["armor"],
		supported_items: "#minecraft:enchantable/armor",
		weight: 2
	},
	breach: {
		anvil_cost: 4,
		description: "Breach",
		exclusive_set: "#minecraft:exclusive_set/damage",
		max_cost: {
			base: 65,
			per_level_above_first: 9
		},
		max_level: 4,
		min_cost: {
			base: 15,
			per_level_above_first: 9
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/mace",
		weight: 2
	},
	channeling: {
		anvil_cost: 8,
		description: "Channeling",
		max_cost: {
			base: 50,
			per_level_above_first: 0
		},
		max_level: 1,
		min_cost: {
			base: 25,
			per_level_above_first: 0
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/trident",
		weight: 1
	},
	density: {
		anvil_cost: 2,
		description: "Density",
		exclusive_set: "#minecraft:exclusive_set/damage",
		max_cost: {
			base: 25,
			per_level_above_first: 8
		},
		max_level: 5,
		min_cost: {
			base: 5,
			per_level_above_first: 8
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/mace",
		weight: 5
	},
	depth_strider: {
		anvil_cost: 4,
		description: "Depth Strider",
		exclusive_set: "#minecraft:exclusive_set/boots",
		max_cost: {
			base: 25,
			per_level_above_first: 10
		},
		max_level: 3,
		min_cost: {
			base: 10,
			per_level_above_first: 10
		},
		slots: ["feet"],
		supported_items: "#minecraft:enchantable/foot_armor",
		weight: 2
	},
	efficiency: {
		anvil_cost: 1,
		description: "Efficiency",
		max_cost: {
			base: 51,
			per_level_above_first: 10
		},
		max_level: 5,
		min_cost: {
			base: 1,
			per_level_above_first: 10
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/mining",
		weight: 10
	},
	feather_falling: {
		anvil_cost: 2,
		description: "Feather Falling",
		max_cost: {
			base: 11,
			per_level_above_first: 6
		},
		max_level: 4,
		min_cost: {
			base: 5,
			per_level_above_first: 6
		},
		slots: ["armor"],
		supported_items: "#minecraft:enchantable/foot_armor",
		weight: 5
	},
	fire_aspect: {
		anvil_cost: 4,
		description: "Fire Aspect",
		max_cost: {
			base: 60,
			per_level_above_first: 20
		},
		max_level: 2,
		min_cost: {
			base: 10,
			per_level_above_first: 20
		},
		primary_items: "#minecraft:enchantable/sword",
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/fire_aspect",
		weight: 2
	},
	fire_protection: {
		anvil_cost: 2,
		description: "Fire Protection",
		exclusive_set: "#minecraft:exclusive_set/armor",
		max_cost: {
			base: 18,
			per_level_above_first: 8
		},
		max_level: 4,
		min_cost: {
			base: 10,
			per_level_above_first: 8
		},
		slots: ["armor"],
		supported_items: "#minecraft:enchantable/armor",
		weight: 5
	},
	flame: {
		anvil_cost: 4,
		description: "Flame",
		max_cost: {
			base: 50,
			per_level_above_first: 0
		},
		max_level: 1,
		min_cost: {
			base: 20,
			per_level_above_first: 0
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/bow",
		weight: 2
	},
	fortune: {
		anvil_cost: 4,
		description: "Fortune",
		exclusive_set: "#minecraft:exclusive_set/mining",
		max_cost: {
			base: 65,
			per_level_above_first: 9
		},
		max_level: 3,
		min_cost: {
			base: 15,
			per_level_above_first: 9
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/mining_loot",
		weight: 2
	},
	frost_walker: {
		anvil_cost: 4,
		description: "Frost Walker",
		exclusive_set: "#minecraft:exclusive_set/boots",
		max_cost: {
			base: 25,
			per_level_above_first: 10
		},
		max_level: 2,
		min_cost: {
			base: 10,
			per_level_above_first: 10
		},
		slots: ["feet"],
		supported_items: "#minecraft:enchantable/foot_armor",
		weight: 2
	},
	impaling: {
		anvil_cost: 4,
		description: "Impaling",
		exclusive_set: "#minecraft:exclusive_set/damage",
		max_cost: {
			base: 21,
			per_level_above_first: 8
		},
		max_level: 5,
		min_cost: {
			base: 1,
			per_level_above_first: 8
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/trident",
		weight: 2
	},
	infinity: {
		anvil_cost: 8,
		description: "Infinity",
		exclusive_set: "#minecraft:exclusive_set/bow",
		max_cost: {
			base: 50,
			per_level_above_first: 0
		},
		max_level: 1,
		min_cost: {
			base: 20,
			per_level_above_first: 0
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/bow",
		weight: 1
	},
	knockback: {
		anvil_cost: 2,
		description: "Knockback",
		max_cost: {
			base: 55,
			per_level_above_first: 20
		},
		max_level: 2,
		min_cost: {
			base: 5,
			per_level_above_first: 20
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/sword",
		weight: 5
	},
	looting: {
		anvil_cost: 4,
		description: "Looting",
		max_cost: {
			base: 65,
			per_level_above_first: 9
		},
		max_level: 3,
		min_cost: {
			base: 15,
			per_level_above_first: 9
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/sword",
		weight: 2
	},
	loyalty: {
		anvil_cost: 2,
		description: "Loyalty",
		max_cost: {
			base: 50,
			per_level_above_first: 0
		},
		max_level: 3,
		min_cost: {
			base: 12,
			per_level_above_first: 7
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/trident",
		weight: 5
	},
	luck_of_the_sea: {
		anvil_cost: 4,
		description: "Luck of the Sea",
		max_cost: {
			base: 65,
			per_level_above_first: 9
		},
		max_level: 3,
		min_cost: {
			base: 15,
			per_level_above_first: 9
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/fishing",
		weight: 2
	},
	lure: {
		anvil_cost: 4,
		description: "Lure",
		max_cost: {
			base: 65,
			per_level_above_first: 9
		},
		max_level: 3,
		min_cost: {
			base: 15,
			per_level_above_first: 9
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/fishing",
		weight: 2
	},
	mending: {
		anvil_cost: 4,
		description: "Mending",
		max_cost: {
			base: 75,
			per_level_above_first: 25
		},
		max_level: 1,
		min_cost: {
			base: 25,
			per_level_above_first: 25
		},
		slots: ["any"],
		supported_items: "#minecraft:enchantable/durability",
		weight: 2
	},
	multishot: {
		anvil_cost: 4,
		description: "Multishot",
		exclusive_set: "#minecraft:exclusive_set/crossbow",
		max_cost: {
			base: 50,
			per_level_above_first: 0
		},
		max_level: 1,
		min_cost: {
			base: 20,
			per_level_above_first: 0
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/crossbow",
		weight: 2
	},
	piercing: {
		anvil_cost: 1,
		description: "Piercing",
		exclusive_set: "#minecraft:exclusive_set/crossbow",
		max_cost: {
			base: 50,
			per_level_above_first: 0
		},
		max_level: 4,
		min_cost: {
			base: 1,
			per_level_above_first: 10
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/crossbow",
		weight: 10
	},
	power: {
		anvil_cost: 1,
		description: "Power",
		max_cost: {
			base: 16,
			per_level_above_first: 10
		},
		max_level: 5,
		min_cost: {
			base: 1,
			per_level_above_first: 10
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/bow",
		weight: 10
	},
	projectile_protection: {
		anvil_cost: 2,
		description: "Projectile Protection",
		exclusive_set: "#minecraft:exclusive_set/armor",
		max_cost: {
			base: 9,
			per_level_above_first: 6
		},
		max_level: 4,
		min_cost: {
			base: 3,
			per_level_above_first: 6
		},
		slots: ["armor"],
		supported_items: "#minecraft:enchantable/armor",
		weight: 5
	},
	protection: {
		anvil_cost: 1,
		description: "Protection",
		exclusive_set: "#minecraft:exclusive_set/armor",
		max_cost: {
			base: 12,
			per_level_above_first: 11
		},
		max_level: 4,
		min_cost: {
			base: 1,
			per_level_above_first: 11
		},
		slots: ["armor"],
		supported_items: "#minecraft:enchantable/armor",
		weight: 10
	},
	punch: {
		anvil_cost: 4,
		description: "Punch",
		max_cost: {
			base: 37,
			per_level_above_first: 20
		},
		max_level: 2,
		min_cost: {
			base: 12,
			per_level_above_first: 20
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/bow",
		weight: 2
	},
	quick_charge: {
		anvil_cost: 2,
		description: "Quick Charge",
		max_cost: {
			base: 50,
			per_level_above_first: 0
		},
		max_level: 3,
		min_cost: {
			base: 12,
			per_level_above_first: 20
		},
		slots: ["mainhand", "offhand"],
		supported_items: "#minecraft:enchantable/crossbow",
		weight: 5
	},
	respiration: {
		anvil_cost: 4,
		description: "Respiration",
		max_cost: {
			base: 40,
			per_level_above_first: 10
		},
		max_level: 3,
		min_cost: {
			base: 10,
			per_level_above_first: 10
		},
		slots: ["head"],
		supported_items: "#minecraft:enchantable/head_armor",
		weight: 2
	},
	riptide: {
		anvil_cost: 4,
		description: "Riptide",
		exclusive_set: "#minecraft:exclusive_set/riptide",
		max_cost: {
			base: 50,
			per_level_above_first: 0
		},
		max_level: 3,
		min_cost: {
			base: 17,
			per_level_above_first: 7
		},
		slots: ["hand"],
		supported_items: "#minecraft:enchantable/trident",
		weight: 2
	},
	sharpness: {
		anvil_cost: 1,
		description: "Sharpness",
		exclusive_set: "#minecraft:exclusive_set/damage",
		max_cost: {
			base: 21,
			per_level_above_first: 11
		},
		max_level: 5,
		min_cost: {
			base: 1,
			per_level_above_first: 11
		},
		primary_items: "#minecraft:enchantable/sword",
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/sharp_weapon",
		weight: 10
	},
	silk_touch: {
		anvil_cost: 8,
		description: "Silk Touch",
		exclusive_set: "#minecraft:exclusive_set/mining",
		max_cost: {
			base: 65,
			per_level_above_first: 0
		},
		max_level: 1,
		min_cost: {
			base: 15,
			per_level_above_first: 0
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/mining_loot",
		weight: 1
	},
	smite: {
		anvil_cost: 2,
		description: "Smite",
		exclusive_set: "#minecraft:exclusive_set/damage",
		max_cost: {
			base: 25,
			per_level_above_first: 8
		},
		max_level: 5,
		min_cost: {
			base: 5,
			per_level_above_first: 8
		},
		primary_items: "#minecraft:enchantable/sword",
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/weapon",
		weight: 5
	},
	soul_speed: {
		anvil_cost: 8,
		description: "Soul Speed",
		max_cost: {
			base: 25,
			per_level_above_first: 10
		},
		max_level: 3,
		min_cost: {
			base: 10,
			per_level_above_first: 10
		},
		slots: ["feet"],
		supported_items: "#minecraft:enchantable/foot_armor",
		weight: 1
	},
	sweeping_edge: {
		anvil_cost: 4,
		description: "Sweeping Edge",
		max_cost: {
			base: 20,
			per_level_above_first: 9
		},
		max_level: 3,
		min_cost: {
			base: 5,
			per_level_above_first: 9
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/sword",
		weight: 2
	},
	swift_sneak: {
		anvil_cost: 8,
		description: "Swift Sneak",
		max_cost: {
			base: 75,
			per_level_above_first: 25
		},
		max_level: 3,
		min_cost: {
			base: 25,
			per_level_above_first: 25
		},
		slots: ["legs"],
		supported_items: "#minecraft:enchantable/leg_armor",
		weight: 1
	},
	thorns: {
		anvil_cost: 8,
		description: "Thorns",
		max_cost: {
			base: 60,
			per_level_above_first: 20
		},
		max_level: 3,
		min_cost: {
			base: 10,
			per_level_above_first: 20
		},
		primary_items: "#minecraft:enchantable/chest_armor",
		slots: ["any"],
		supported_items: "#minecraft:enchantable/armor",
		weight: 1
	},
	unbreaking: {
		anvil_cost: 2,
		description: "Unbreaking",
		max_cost: {
			base: 55,
			per_level_above_first: 8
		},
		max_level: 3,
		min_cost: {
			base: 5,
			per_level_above_first: 8
		},
		slots: ["any"],
		supported_items: "#minecraft:enchantable/durability",
		weight: 5
	},
	vanishing_curse: {
		anvil_cost: 8,
		description: "Vanishing Curse",
		max_cost: {
			base: 50,
			per_level_above_first: 0
		},
		max_level: 1,
		min_cost: {
			base: 25,
			per_level_above_first: 0
		},
		slots: ["any"],
		supported_items: "#minecraft:enchantable/vanishing",
		weight: 1
	},
	wind_burst: {
		anvil_cost: 4,
		description: "Wind Burst",
		max_cost: {
			base: 65,
			per_level_above_first: 9
		},
		max_level: 3,
		min_cost: {
			base: 15,
			per_level_above_first: 9
		},
		slots: ["mainhand"],
		supported_items: "#minecraft:enchantable/mace",
		weight: 2
	}
};
