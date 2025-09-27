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
