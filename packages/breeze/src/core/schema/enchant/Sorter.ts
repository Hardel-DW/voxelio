import type { EnchantmentProps } from "@/core/schema/enchant/types";
import { normalizeSlots } from "../../engine/managers/SlotManager";
import { getAllItems } from "../../ItemList";

/**
 * Available sorting criteria for enchantments
 */
export type EnchantmentSortCriteria = "exclusiveSet" | "supportedItems" | "slots";

/**
 * Sort direction options
 */
export type SortDirection = "asc" | "desc";

/**
 * Options for sorting enchantments
 */
export interface EnchantmentSortOptions {
	sortBy: EnchantmentSortCriteria;
	direction: SortDirection;
}

/**
 * Represents a group of enchantments
 */
export interface EnchantmentGroup {
	key: string;
	enchantments: EnchantmentProps[];
}

/**
 * Sorting utility for enchantments
 */
export class EnchantmentSorter {
	private enchantments: EnchantmentProps[];

	constructor(enchantments: EnchantmentProps[]) {
		this.enchantments = [...enchantments];
	}

	sortBy(criteria: EnchantmentSortCriteria, direction: SortDirection = "asc"): EnchantmentSorter {
		this.enchantments.sort((a, b) => {
			const aKey = this.getKey(a, criteria);
			const bKey = this.getKey(b, criteria);
			const comparison = aKey.localeCompare(bKey);
			return direction === "asc" ? comparison : -comparison;
		});
		return this;
	}

	groupBy(criteria: EnchantmentSortCriteria): EnchantmentGroup[] {
		const groups = new Map<string, EnchantmentProps[]>();

		for (const enchantment of this.enchantments) {
			const key = this.getKey(enchantment, criteria);
			if (!groups.has(key)) {
				groups.set(key, []);
			}

			const group = groups.get(key);
			if (group) {
				group.push(enchantment);
			}
		}

		return Array.from(groups.entries()).map(([key, enchantments]) => ({ key, enchantments }));
	}

	/**
	 * Get the current enchantments
	 */
	getResults(): EnchantmentProps[] {
		return this.enchantments;
	}

	private getKey(enchantment: EnchantmentProps, criteria: EnchantmentSortCriteria): string {
		switch (criteria) {
			// List or String or Undefined
			case "exclusiveSet":
				return enchantment.exclusiveSet ? getAllItems(enchantment.exclusiveSet).sort().join(",") : "none";
			// List or String
			case "supportedItems":
				return getAllItems(enchantment.supportedItems).sort().join(",");
			case "slots": {
				return normalizeSlots(enchantment.slots).sort().join(",");
			}
		}
	}
}
