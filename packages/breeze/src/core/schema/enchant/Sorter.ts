import type { EnchantmentProps } from "@/core/schema/enchant/types";
import { SlotManager } from "../../SlotManager";
import { getAllItems } from "../../ItemList";

/**
 * Available sorting criteria for enchantments
 */
export type EnchantmentSortCriteria = "exclusiveSet" | "supportedItems" | "slots";
export type SortDirection = "asc" | "desc";
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
		this.enchantments = this.enchantments.toSorted((a, b) => {
			const comparison = this.getKey(a, criteria).localeCompare(this.getKey(b, criteria));
			return direction === "asc" ? comparison : -comparison;
		});
		return this;
	}

	groupBy(criteria: EnchantmentSortCriteria): EnchantmentGroup[] {
		const groups = Object.groupBy(this.enchantments, (enchantment) => this.getKey(enchantment, criteria));
		return Object.entries(groups).map(([key, enchantments]) => ({ key, enchantments: enchantments ?? [] }));
	}

	/**
	 * Get the current enchantments
	 */
	getResults(): EnchantmentProps[] {
		return this.enchantments;
	}

	private getKey(enchantment: EnchantmentProps, criteria: EnchantmentSortCriteria): string {
		switch (criteria) {
			case "exclusiveSet":
				return enchantment.exclusiveSet ? getAllItems(enchantment.exclusiveSet).sort().join(",") : "none";
			case "supportedItems":
				return getAllItems(enchantment.supportedItems).sort().join(",");
			case "slots":
				return new SlotManager(enchantment.slots).normalize().toArray().sort().join(",");
		}
	}
}
