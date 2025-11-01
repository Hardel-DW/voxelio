import type { Parser, ParserParams } from "@/core/Datapack";
import type { Enchantment } from "@/core/schema/enchant/types";
import { type EnchantmentProps, FUNCTIONALITY_TAGS_CACHE } from "@/core/schema/enchant/types";

/**
 * Take only one Enchantments with their tags, to transform it to Voxel format
 * @param enchantment
 * @param tags
 */
export const EnchantmentDataDrivenToVoxelFormat: Parser<EnchantmentProps, Enchantment> = ({
	element,
	tags = [],
	configurator
}: ParserParams<Enchantment>): EnchantmentProps => {
	const clone = structuredClone(element);
	const data = clone.data;

	const description = data.description;
	const maxLevel = data.max_level;
	const weight = data.weight;
	const anvilCost = data.anvil_cost;
	const minCostBase = data.min_cost.base;
	const minCostPerLevelAboveFirst = data.min_cost.per_level_above_first;
	const maxCostBase = data.max_cost.base;
	const maxCostPerLevelAboveFirst = data.max_cost.per_level_above_first;
	const exclusiveSet = data.exclusive_set;
	const supportedItems = data.supported_items;
	const primaryItems = data.primary_items;
	const effects = data.effects;
	const slots = data.slots;

	const hasEffects = data.effects && Object.entries(data.effects).length > 0;
	const hasExclusiveSet = data.exclusive_set !== undefined;
	let mode: "normal" | "soft_delete" | "only_creative" = "normal";

	if (tags.every((tag) => FUNCTIONALITY_TAGS_CACHE.has(tag))) {
		mode = "only_creative";
	}

	if (!hasEffects && tags.length === 0 && !hasExclusiveSet) {
		mode = "soft_delete";
	}

	return {
		identifier: element.identifier,
		description,
		exclusiveSet,
		supportedItems,
		primaryItems,
		maxLevel,
		weight,
		anvilCost,
		minCostBase,
		minCostPerLevelAboveFirst,
		maxCostBase,
		maxCostPerLevelAboveFirst,
		effects,
		tags,
		slots,
		mode,
		disabledEffects: [],
		override: configurator
	};
};
