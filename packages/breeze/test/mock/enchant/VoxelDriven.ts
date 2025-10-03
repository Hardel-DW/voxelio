import type { VoxelRegistryElement } from "@/core/Element";
import type { EnchantmentProps } from "@/core/schema/enchant/types";

export const createMockEnchantmentElement = (data: Partial<EnchantmentProps> = {}): VoxelRegistryElement<EnchantmentProps> => ({
	identifier: "foo",
	data: {
		identifier: { namespace: "namespace", resource: "enchantment", registry: "foo" },
		description: { translate: "enchantment.test.foo" },
		exclusiveSet: undefined,
		supportedItems: "#minecraft:sword",
		primaryItems: undefined,
		maxLevel: 1,
		weight: 1,
		anvilCost: 1,
		minCostBase: 1,
		minCostPerLevelAboveFirst: 1,
		maxCostBase: 10,
		maxCostPerLevelAboveFirst: 10,
		effects: undefined,
		slots: ["head", "chest"],
		tags: ["#minecraft:enchantable/bow", "#minecraft:enchantable/armor"],
		disabledEffects: [],
		mode: "normal",
		...data
	}
});

// Lightweight test mocks
export const simpleVoxelElement: VoxelRegistryElement<EnchantmentProps> = createMockEnchantmentElement({
	identifier: { namespace: "enchantplus", registry: "enchantment", resource: "bow/accuracy_shot" },
	description: { translate: "enchantment.enchantplus.accuracy_shot", fallback: "Accuracy Shot" },
	supportedItems: "#voxel:enchantable/range",
	exclusiveSet: "#enchantplus:exclusive_set/bow",
	weight: 2,
	anvilCost: 4,
	minCostBase: 20,
	minCostPerLevelAboveFirst: 9,
	maxCostBase: 65,
	maxCostPerLevelAboveFirst: 9,
	tags: ["#minecraft:non_treasure"],
	disabledEffects: ["minecraft:damage"],
	slots: ["mainhand", "offhand"],
	effects: {
		"minecraft:projectile_spawned": [{ effect: "minecraft:run_function", function: "enchantplus:actions/accuracy_shot/on_shoot" }],
		"minecraft:damage": [{ amount: 1 }]
	}
});

export const onlyCreativeVoxelElement: VoxelRegistryElement<EnchantmentProps> = createMockEnchantmentElement({
	identifier: { namespace: "enchantplus", registry: "enchantment", resource: "boots/agility" },
	description: { translate: "enchantment.enchantplus.agility", fallback: "Agility" },
	mode: "only_creative",
	supportedItems: "#minecraft:enchantable/foot_armor",
	tags: ["#minecraft:non_treasure"],
	slots: ["feet"]
});

export const softDeleteVoxelElement: VoxelRegistryElement<EnchantmentProps> = createMockEnchantmentElement({
	identifier: { namespace: "enchantplus", registry: "enchantment", resource: "elytra/armored" },
	description: { translate: "enchantment.enchantplus.armored", fallback: "Armored" },
	mode: "soft_delete",
	supportedItems: "#voxel:enchantable/elytra",
	tags: [],
	slots: ["chest"]
});

export const createComplexMockElement = (data: Partial<EnchantmentProps> = {}): VoxelRegistryElement<EnchantmentProps> => ({
	identifier: "foo",
	data: {
		identifier: { namespace: "enchantplus", registry: "enchantment", resource: "bow/accuracy_shot" },
		anvilCost: 4,
		description: { translate: "enchantment.test.foo", fallback: "Enchantment Test" },
		disabledEffects: [],
		effects: {
			"minecraft:projectile_spawned": [
				{
					effect: {
						type: "minecraft:run_function",
						function: "enchantplus:actions/accuracy_shot/on_shoot"
					}
				}
			]
		},
		exclusiveSet: ["minecraft:efficiency", "minecraft:unbreaking"],
		maxLevel: 1,
		mode: "normal",
		minCostBase: 1,
		minCostPerLevelAboveFirst: 1,
		maxCostBase: 10,
		maxCostPerLevelAboveFirst: 10,
		primaryItems: undefined,
		supportedItems: "#voxel:enchantable/range",
		slots: ["mainhand", "offhand"],
		tags: [
			"#minecraft:non_treasure",
			"#yggdrasil:structure/alfheim_tree/ominous_vault",
			"#yggdrasil:structure/alfheim_tree/ominous_vault/floor",
			"#yggdrasil:structure/asflors/common"
		],
		weight: 2,
		...data
	}
});

export const attack_speed_element: EnchantmentProps[] = [
	{
		exclusiveSet: undefined,
		primaryItems: undefined,
		identifier: {
			namespace: "enchantplus",
			registry: "enchantment",
			resource: "sword/attack_speed"
		},
		description: {
			translate: "enchantment.enchantplus.attack_speed",
			fallback: "Attack Speed"
		},
		supportedItems: "#minecraft:enchantable/sword",
		maxLevel: 2,
		weight: 4,
		anvilCost: 2,
		minCostBase: 8,
		minCostPerLevelAboveFirst: 11,
		maxCostBase: 21,
		maxCostPerLevelAboveFirst: 9,
		effects: {},
		tags: ["#minecraft:non_treasure", "#yggdrasil:equipment/item/sword", "#yggdrasil:structure/alfheim_tree/random_loot"],
		slots: ["mainhand"],
		mode: "normal",
		disabledEffects: []
	}
];