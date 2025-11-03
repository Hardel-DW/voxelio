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

export const accuracy_shot: DataDrivenRegistryElement<Enchantment> = {
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
		effects: { test: {} }
	}
};

export const attack_speed: DataDrivenRegistryElement<Enchantment> = {
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
		slots: ["mainhand"]
	}
};

export const poison_aspect: DataDrivenRegistryElement<Enchantment> = {
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
		slots: ["mainhand"]
	}
};

export const sharpness_v2: DataDrivenRegistryElement<Enchantment> = {
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

export const damage_boost: DataDrivenRegistryElement<Enchantment> = {
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

export const multi_exclusive: DataDrivenRegistryElement<Enchantment> = {
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

export const supported_only_string: DataDrivenRegistryElement<Enchantment> = {
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

export const supported_only_tag: DataDrivenRegistryElement<Enchantment> = {
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

export const supported_only_array: DataDrivenRegistryElement<Enchantment> = {
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

export const primary_wins: DataDrivenRegistryElement<Enchantment> = {
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

export const primary_tag: DataDrivenRegistryElement<Enchantment> = {
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

export const primary_array: DataDrivenRegistryElement<Enchantment> = {
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

export const accuracy_shot_with_disabled: DataDrivenRegistryElement<Enchantment> = {
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
			foo: [{ effect: { type: "minecraft:run_function", function: "enchantplus:actions/accuracy_shot/on_shoot" } }],
			bar: { test: {} }
		}
	}
};

export const agility_only_creative: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "enchantplus", registry: "enchantment", resource: "boots/agility" },
	data: {
		description: { translate: "enchantment.enchantplus.agility", fallback: "Agility" },
		supported_items: "#minecraft:enchantable/foot_armor",
		weight: 2,
		max_level: 1,
		min_cost: { base: 20, per_level_above_first: 9 },
		max_cost: { base: 65, per_level_above_first: 9 },
		anvil_cost: 4,
		slots: ["feet"]
	}
};

export const armored_soft_delete: DataDrivenRegistryElement<Enchantment> = {
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

export const minimal: DataDrivenRegistryElement<Enchantment> = {
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

export const unknown_tag: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "unknown" },
	data: {
		description: "Unknown Tag",
		supported_items: "#unknown:nonexistent",
		weight: 1,
		max_level: 1,
		min_cost: { base: 1, per_level_above_first: 0 },
		max_cost: { base: 50, per_level_above_first: 0 },
		anvil_cost: 1,
		slots: ["mainhand"]
	}
};

export const unknown: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "unknown" },
	data: {
		description: { translate: "test.unknown", fallback: "Unknown" },
		supported_items: "#minecraft:enchantable/sword",
		weight: 1,
		max_level: 1,
		min_cost: { base: 1, per_level_above_first: 0 },
		max_cost: { base: 10, per_level_above_first: 0 },
		anvil_cost: 1,
		slots: ["mainhand"]
	}
};

export const direct: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "direct" },
	data: {
		description: "Test",
		supported_items: "minecraft:stick",
		weight: 1,
		max_level: 1,
		min_cost: { base: 1, per_level_above_first: 0 },
		max_cost: { base: 50, per_level_above_first: 0 },
		anvil_cost: 1,
		slots: ["mainhand"]
	}
};

export const array: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "array" },
	data: {
		description: "Test Array",
		supported_items: ["minecraft:apple", "minecraft:bread"],
		weight: 1,
		max_level: 1,
		min_cost: { base: 1, per_level_above_first: 0 },
		max_cost: { base: 50, per_level_above_first: 0 },
		anvil_cost: 1,
		slots: ["mainhand"]
	}
};

export const incomplete: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "incomplete" },
	// @ts-expect-error - Testing incomplete enchantment
	data: {
		description: "Incomplete",
		weight: 1,
		max_level: 1,
		min_cost: { base: 1, per_level_above_first: 0 },
		max_cost: { base: 50, per_level_above_first: 0 },
		anvil_cost: 1,
		slots: ["mainhand"]
	}
};

export const zero_weight: DataDrivenRegistryElement<Enchantment> = {
	identifier: { namespace: "test", registry: "enchantment", resource: "zero_weight" },
	data: {
		description: "Zero Weight",
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
	knockback,
	unbreaking,
	accuracy_shot,
	attack_speed,
	poison_aspect,
	sharpness_v2,
	damage_boost,
	multi_exclusive,
	supported_only_string,
	supported_only_tag,
	supported_only_array,
	primary_wins,
	primary_tag,
	primary_array,
	accuracy_shot_with_disabled,
	agility_only_creative,
	armored_soft_delete,
	minimal,
	unknown
};

export type EnchantmentKey = keyof typeof originalEnchantments;
export const enchantmentDataDriven = Object.values(originalEnchantments);
