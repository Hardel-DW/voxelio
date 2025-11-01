import type { DataDrivenRegistryElement } from "@/core/Element";
import type { Enchantment } from "@/core/schema/enchant/types";

export const sharpness: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "minecraft", registry: "enchantment", resource: "sharpness" },
	data: {
		description: { translate: "enchantment.minecraft.sharpness", fallback: "Sharpness" },
		exclusive_set: "#minecraft:exclusive_set/damage",
		primary_items: "#minecraft:enchantable/sword",
		supported_items: "#minecraft:enchantable/sharp_weapon",
		weight: 10,
		max_level: 5,
		min_cost: { base: 1, per_level_above_first: 11 },
		max_cost: { base: 21, per_level_above_first: 11 },
		anvil_cost: 1,
		slots: ["mainhand"]
	}
};

export const smite: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "minecraft", registry: "enchantment", resource: "smite" },
	data: {
		description: { translate: "enchantment.minecraft.smite", fallback: "Smite" },
		exclusive_set: "#minecraft:exclusive_set/damage",
		supported_items: "#minecraft:enchantable/sword",
		weight: 5,
		max_level: 5,
		min_cost: { base: 5, per_level_above_first: 8 },
		max_cost: { base: 25, per_level_above_first: 8 },
		anvil_cost: 1,
		slots: ["mainhand"]
	}
};

export const baneOfArthropods: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "minecraft", registry: "enchantment", resource: "bane_of_arthropods" },
	data: {
		description: { translate: "enchantment.minecraft.bane_of_arthropods", fallback: "Bane of Arthropods" },
		exclusive_set: "#minecraft:exclusive_set/damage",
		supported_items: "#minecraft:enchantable/sword",
		weight: 5,
		max_level: 5,
		min_cost: { base: 5, per_level_above_first: 8 },
		max_cost: { base: 25, per_level_above_first: 8 },
		anvil_cost: 1,
		slots: ["mainhand"]
	}
};

export const knockback: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "minecraft", registry: "enchantment", resource: "knockback" },
	data: {
		description: { translate: "enchantment.minecraft.knockback", fallback: "Knockback" },
		supported_items: "#minecraft:enchantable/sword",
		weight: 5,
		max_level: 2,
		min_cost: { base: 5, per_level_above_first: 20 },
		max_cost: { base: 55, per_level_above_first: 20 },
		anvil_cost: 2,
		slots: ["mainhand"]
	}
};

export const channeling: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "minecraft", registry: "enchantment", resource: "channeling" },
	data: {
		description: { translate: "enchantment.minecraft.channeling", fallback: "Channeling" },
		supported_items: "#minecraft:enchantable/trident",
		weight: 1,
		max_level: 1,
		min_cost: { base: 25, per_level_above_first: 0 },
		max_cost: { base: 50, per_level_above_first: 0 },
		anvil_cost: 8,
		slots: ["mainhand"]
	}
};

export const unbreaking: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "minecraft", registry: "enchantment", resource: "unbreaking" },
	data: {
		description: { translate: "enchantment.minecraft.unbreaking", fallback: "Unbreaking" },
		supported_items: ["#minecraft:enchantable/sword", "#minecraft:enchantable/armor"],
		weight: 5,
		max_level: 3,
		min_cost: { base: 5, per_level_above_first: 8 },
		max_cost: { base: 55, per_level_above_first: 8 },
		anvil_cost: 1,
		slots: ["any"]
	}
};

export const accuracyShot: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "enchantplus", registry: "enchantment", resource: "bow/accuracy_shot" },
	data: {
		description: { translate: "enchantment.enchantplus.accuracy_shot", fallback: "Accuracy Shot" },
		supported_items: "#voxel:enchantable/range",
		weight: 2,
		max_level: 1,
		min_cost: { base: 20, per_level_above_first: 9 },
		max_cost: { base: 65, per_level_above_first: 9 },
		anvil_cost: 4,
		slots: ["mainhand", "offhand"],
		effects: {
			"minecraft:projectile_spawned": [
				{
					effect: {
						type: "minecraft:run_function",
						function: "enchantplus:actions/accuracy_shot/on_shoot"
					}
				}
			]
		}
	}
};

export const agility: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "enchantplus", registry: "enchantment", resource: "boots/agility" },
	data: {
		description: { translate: "enchantment.enchantplus.agility", fallback: "Agility" },
		supported_items: "#minecraft:enchantable/foot_armor",
		weight: 2,
		max_level: 1,
		min_cost: { base: 20, per_level_above_first: 9 },
		max_cost: { base: 65, per_level_above_first: 9 },
		anvil_cost: 4,
		slots: ["feet"],
		effects: {
			"minecraft:attributes": [
				{
					id: "minecraft:enchantment.agility",
					attribute: "minecraft:movement_speed",
					amount: {
						type: "minecraft:linear",
						base: 0.2,
						per_level_above_first: 0.2
					},
					operation: "add_multiplied_total"
				}
			]
		}
	}
};

export const armored: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "enchantplus", registry: "enchantment", resource: "elytra/armored" },
	data: {
		description: { translate: "enchantment.enchantplus.armored", fallback: "Armored" },
		supported_items: "#voxel:enchantable/elytra",
		weight: 1,
		max_level: 1,
		min_cost: { base: 20, per_level_above_first: 9 },
		max_cost: { base: 65, per_level_above_first: 9 },
		anvil_cost: 4,
		slots: ["chest"],
		effects: {
			"minecraft:damage_protection": [
				{
					effect: {
						type: "minecraft:add",
						value: 9
					},
					requirements: {
						condition: "minecraft:damage_source_properties",
						predicate: {
							tags: [
								{
									expected: false,
									id: "minecraft:bypasses_invulnerability"
								}
							]
						}
					}
				}
			]
		}
	}
};

export const attackSpeed: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "enchantplus", registry: "enchantment", resource: "sword/attack_speed" },
	data: {
		description: { translate: "enchantment.enchantplus.attack_speed", fallback: "Attack Speed" },
		exclusive_set: "#enchantplus:exclusive_set/sword_attribute",
		supported_items: "#minecraft:enchantable/sword",
		weight: 4,
		max_level: 2,
		min_cost: { base: 8, per_level_above_first: 11 },
		max_cost: { base: 21, per_level_above_first: 9 },
		anvil_cost: 2,
		slots: ["mainhand"],
		effects: {
			"minecraft:attributes": [
				{
					id: "minecraft:enchantment.attack_speed",
					attribute: "minecraft:attack_speed",
					amount: {
						type: "minecraft:linear",
						base: 0.15,
						per_level_above_first: 0.15
					},
					operation: "add_multiplied_base"
				}
			]
		}
	}
};

export const deathTouch: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "enchantplus", registry: "enchantment", resource: "sword/death_touch" },
	data: {
		description: { translate: "enchantment.enchantplus.death_touch", fallback: "Death Touch" },
		exclusive_set: "#enchantplus:exclusive_set/sword_effect",
		primary_items: "#minecraft:enchantable/sword",
		supported_items: "#minecraft:enchantable/weapon",
		weight: 2,
		max_level: 1,
		min_cost: { base: 20, per_level_above_first: 9 },
		max_cost: { base: 65, per_level_above_first: 9 },
		anvil_cost: 4,
		slots: ["mainhand"],
		effects: {
			"minecraft:post_attack": [
				{
					enchanted: "attacker",
					affected: "victim",
					effect: {
						type: "minecraft:run_function",
						function: "enchantplus:actions/death_touch"
					},
					requirements: {
						condition: "minecraft:random_chance",
						chance: 0.5
					}
				}
			]
		}
	}
};

export const poisonAspect: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "enchantplus", registry: "enchantment", resource: "sword/poison_aspect" },
	data: {
		description: { translate: "enchantment.enchantplus.poison_aspect", fallback: "Poison Aspect" },
		exclusive_set: "#enchantplus:exclusive_set/aspect",
		primary_items: "#minecraft:enchantable/sword",
		supported_items: "#minecraft:enchantable/weapon",
		weight: 2,
		max_level: 1,
		min_cost: { base: 20, per_level_above_first: 9 },
		max_cost: { base: 65, per_level_above_first: 9 },
		anvil_cost: 4,
		slots: ["mainhand"],
		effects: {
			"minecraft:post_attack": [
				{
					affected: "victim",
					enchanted: "attacker",
					effect: {
						type: "minecraft:apply_mob_effect",
						max_duration: {
							type: "minecraft:linear",
							base: 3.25,
							per_level_above_first: 1.25
						},
						max_amplifier: {
							type: "minecraft:linear",
							base: 2,
							per_level_above_first: 1
						},
						min_duration: 3.25,
						min_amplifier: 2,
						to_apply: "minecraft:wither"
					}
				}
			]
		}
	}
};

export const sharpnessV2: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "sharpness_v2" },
	data: {
		description: { translate: "test.sharpness_v2", fallback: "Sharpness V2" },
		exclusive_set: "minecraft:sharpness",
		supported_items: "#minecraft:enchantable/sword",
		weight: 10,
		max_level: 5,
		min_cost: { base: 1, per_level_above_first: 11 },
		max_cost: { base: 21, per_level_above_first: 11 },
		anvil_cost: 1,
		slots: ["mainhand"]
	}
};

export const damageBoost: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "damage_boost" },
	data: {
		description: { translate: "test.damage_boost", fallback: "Damage Boost" },
		exclusive_set: "#test:exclusive_set/damage",
		supported_items: "#minecraft:enchantable/weapon",
		weight: 8,
		max_level: 3,
		min_cost: { base: 5, per_level_above_first: 8 },
		max_cost: { base: 25, per_level_above_first: 8 },
		anvil_cost: 2,
		slots: ["mainhand"]
	}
};

export const multiExclusive: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "multi_exclusive" },
	data: {
		description: { translate: "test.multi_exclusive", fallback: "Multi Exclusive" },
		exclusive_set: ["minecraft:sharpness", "minecraft:smite"],
		supported_items: "#minecraft:enchantable/sword",
		weight: 5,
		max_level: 1,
		min_cost: { base: 10, per_level_above_first: 0 },
		max_cost: { base: 40, per_level_above_first: 0 },
		anvil_cost: 3,
		slots: ["mainhand"]
	}
};

export const supportedOnlyString: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "supported_only_string" },
	data: {
		description: { translate: "test.supported_only_string", fallback: "Supported Only String" },
		supported_items: "minecraft:diamond_sword",
		weight: 5,
		max_level: 1,
		min_cost: { base: 1, per_level_above_first: 0 },
		max_cost: { base: 50, per_level_above_first: 0 },
		anvil_cost: 1,
		slots: ["mainhand"]
	}
};

export const supportedOnlyTag: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "supported_only_tag" },
	data: {
		description: { translate: "test.supported_only_tag", fallback: "Supported Only Tag" },
		supported_items: "#minecraft:enchantable/sword",
		weight: 5,
		max_level: 1,
		min_cost: { base: 1, per_level_above_first: 0 },
		max_cost: { base: 50, per_level_above_first: 0 },
		anvil_cost: 1,
		slots: ["mainhand"]
	}
};

export const supportedOnlyArray: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "supported_only_array" },
	data: {
		description: { translate: "test.supported_only_array", fallback: "Supported Only Array" },
		supported_items: ["minecraft:diamond_sword", "minecraft:iron_sword"],
		weight: 5,
		max_level: 1,
		min_cost: { base: 1, per_level_above_first: 0 },
		max_cost: { base: 50, per_level_above_first: 0 },
		anvil_cost: 1,
		slots: ["mainhand"]
	}
};

export const primaryWins: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "primary_wins" },
	data: {
		description: { translate: "test.primary_wins", fallback: "Primary Wins" },
		primary_items: "minecraft:diamond_sword",
		supported_items: "minecraft:stone_sword",
		weight: 5,
		max_level: 1,
		min_cost: { base: 1, per_level_above_first: 0 },
		max_cost: { base: 50, per_level_above_first: 0 },
		anvil_cost: 1,
		slots: ["mainhand"]
	}
};

export const primaryTag: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "primary_tag" },
	data: {
		description: { translate: "test.primary_tag", fallback: "Primary Tag" },
		primary_items: "#minecraft:enchantable/sword",
		supported_items: "#minecraft:enchantable/weapon",
		weight: 5,
		max_level: 1,
		min_cost: { base: 1, per_level_above_first: 0 },
		max_cost: { base: 50, per_level_above_first: 0 },
		anvil_cost: 1,
		slots: ["mainhand"]
	}
};

export const primaryArray: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "primary_array" },
	data: {
		description: { translate: "test.primary_array", fallback: "Primary Array" },
		primary_items: ["minecraft:diamond_sword", "minecraft:netherite_sword"],
		supported_items: "#minecraft:enchantable/weapon",
		weight: 5,
		max_level: 1,
		min_cost: { base: 1, per_level_above_first: 0 },
		max_cost: { base: 50, per_level_above_first: 0 },
		anvil_cost: 1,
		slots: ["mainhand"]
	}
};

export const accuracyShotWithDisabledEffects: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "enchantplus", registry: "enchantment", resource: "bow/accuracy_shot" },
	data: {
		description: { translate: "enchantment.enchantplus.accuracy_shot", fallback: "Accuracy Shot" },
		exclusive_set: "#enchantplus:exclusive_set/bow",
		supported_items: "#voxel:enchantable/range",
		weight: 2,
		max_level: 1,
		min_cost: { base: 20, per_level_above_first: 9 },
		max_cost: { base: 65, per_level_above_first: 9 },
		anvil_cost: 4,
		slots: ["mainhand", "offhand"],
		effects: {
			"minecraft:projectile_spawned": [
				{
					effect: {
						type: "minecraft:run_function",
						function: "enchantplus:actions/accuracy_shot/on_shoot"
					}
				}
			],
			"minecraft:damage": [
				{
					amount: 1
				}
			]
		}
	}
};

export const agilityOnlyCreative: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "enchantplus", registry: "enchantment", resource: "boots/agility" },
	data: {
		description: { translate: "enchantment.enchantplus.agility", fallback: "Agility" },
		supported_items: "#minecraft:enchantable/foot_armor",
		weight: 2,
		max_level: 1,
		min_cost: { base: 20, per_level_above_first: 9 },
		max_cost: { base: 65, per_level_above_first: 9 },
		anvil_cost: 4,
		slots: ["feet"],
		effects: {
			"minecraft:attributes": [
				{
					id: "minecraft:enchantment.agility",
					attribute: "minecraft:movement_speed",
					amount: {
						type: "minecraft:linear",
						base: 0.2,
						per_level_above_first: 0.2
					},
					operation: "add_multiplied_total"
				}
			]
		}
	}
};

export const armoredSoftDelete: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "enchantplus", registry: "enchantment", resource: "elytra/armored" },
	data: {
		description: { translate: "enchantment.enchantplus.armored", fallback: "Armored" },
		supported_items: "#voxel:enchantable/elytra",
		weight: 1,
		max_level: 1,
		min_cost: { base: 20, per_level_above_first: 9 },
		max_cost: { base: 65, per_level_above_first: 9 },
		anvil_cost: 4,
		slots: ["chest"]
	}
};

export const minimalEnchantment: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "minimal" },
	data: {
		description: { translate: "test.minimal", fallback: "Minimal" },
		supported_items: "#minecraft:enchantable/sword",
		weight: 1,
		max_level: 1,
		min_cost: { base: 1, per_level_above_first: 0 },
		max_cost: { base: 10, per_level_above_first: 0 },
		anvil_cost: 1,
		slots: ["mainhand"]
	}
};

export const unknownEnchantment: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "unknown" },
	data: {
		description: { translate: "test.unknown", fallback: "Unknown" },
		supported_items: "#minecraft:enchantable/sword",
		weight: 1,
		max_level: 1,
		min_cost: { base: 1, per_level_above_first: 0 },
		max_cost: { base: 10, per_level_above_first: 0 },
		anvil_cost: 1,
		slots: ["mainhand"],
		effects: {
			"modname:custom_effect": [
				{
					custom_field: "value"
				}
			]
		}
	}
};

export const zeroWeightEnchantment: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "zero_weight" },
	data: {
		description: { translate: "test.zero_weight", fallback: "Zero Weight" },
		supported_items: "#minecraft:enchantable/sword",
		weight: 0,
		max_level: 1,
		min_cost: { base: 1, per_level_above_first: 0 },
		max_cost: { base: 50, per_level_above_first: 0 },
		anvil_cost: 1,
		slots: ["mainhand"]
	}
};

export const originalEnchantments = {
	sharpness,
	smite,
	bane_of_arthropods: baneOfArthropods,
	knockback,
	channeling,
	unbreaking,
	accuracy_shot: accuracyShot,
	agility,
	armored,
	attack_speed: attackSpeed,
	death_touch: deathTouch,
	poison_aspect: poisonAspect,
	sharpness_v2: sharpnessV2,
	damage_boost: damageBoost,
	multi_exclusive: multiExclusive,
	supported_only_string: supportedOnlyString,
	supported_only_tag: supportedOnlyTag,
	supported_only_array: supportedOnlyArray,
	primary_wins: primaryWins,
	primary_tag: primaryTag,
	primary_array: primaryArray,
	accuracy_shot_with_disabled: accuracyShotWithDisabledEffects,
	agility_only_creative: agilityOnlyCreative,
	armored_soft_delete: armoredSoftDelete,
	minimal: minimalEnchantment,
	unknown: unknownEnchantment,
	zero_weight: zeroWeightEnchantment
};

export type EnchantmentKey = keyof typeof originalEnchantments;
export const enchantmentDataDriven = Object.values(originalEnchantments);
