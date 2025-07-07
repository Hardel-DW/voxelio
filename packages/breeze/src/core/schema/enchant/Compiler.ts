import type { DataDrivenRegistryElement } from "@/core/Element";
import { Identifier, type IdentifierObject } from "@/core/Identifier";
import type { Analysers } from "@/core/engine/Analyser";
import type { Compiler } from "@/core/engine/Compiler";
import { processElementTags } from "@/core/schema/utils";
import type { Enchantment } from "@/schema/Enchantment";
import { type EnchantmentProps, FUNCTIONALITY_TAGS_CACHE } from "./types";

/**
 * Transform only one enchantment from Voxel Format into a Minecraft JSON Data Driven Enchantment.
 * @param element
 * @param original
 */
export const VoxelToEnchantmentDataDriven: Compiler<EnchantmentProps, Enchantment> = (
	originalElement: EnchantmentProps,
	config: keyof Analysers,
	original?: Enchantment
): {
	element: DataDrivenRegistryElement<Enchantment>;
	tags: IdentifierObject[];
} => {
	const element = structuredClone(originalElement);
	const enchantment = original ? structuredClone(original) : ({} as Enchantment);
	let tags: IdentifierObject[] = processElementTags(element.tags, config);

	enchantment.max_level = element.maxLevel;
	enchantment.weight = element.weight;
	enchantment.anvil_cost = element.anvilCost;
	enchantment.supported_items = element.supportedItems;
	enchantment.slots = element.slots;
	enchantment.effects = element.effects;

	enchantment.min_cost = {
		base: element.minCostBase,
		per_level_above_first: element.minCostPerLevelAboveFirst
	};
	enchantment.max_cost = {
		base: element.maxCostBase,
		per_level_above_first: element.maxCostPerLevelAboveFirst
	};

	if (element.primaryItems) {
		enchantment.primary_items = element.primaryItems;
	}

	if (!element.supportedItems && element.primaryItems) {
		enchantment.supported_items = element.primaryItems;
	}

	if (element.mode === "only_creative") {
		tags = tags.filter((tag) => FUNCTIONALITY_TAGS_CACHE.has(tag.toString()));
	}

	if (element.exclusiveSet) {
		enchantment.exclusive_set = element.exclusiveSet;

		if (typeof element.exclusiveSet === "string") {
			const tagRegistry = `tags/${config}`;
			tags.push(Identifier.of(element.exclusiveSet, tagRegistry));
		}
	}

	if (Array.isArray(enchantment.exclusive_set) && enchantment.exclusive_set.length === 0) {
		enchantment.exclusive_set = undefined;
	}

	if (element.disabledEffects.length > 0 && enchantment.effects) {
		for (const effect of element.disabledEffects) {
			delete enchantment.effects[effect as keyof typeof enchantment.effects];
		}
	}

	if (element.mode === "soft_delete") {
		enchantment.exclusive_set = undefined;
		enchantment.effects = undefined;
		tags = [];
	}

	if (element.unknownFields) {
		Object.assign(enchantment, element.unknownFields);
	}

	return {
		element: {
			data: enchantment,
			identifier: element.identifier
		},
		tags
	};
};
