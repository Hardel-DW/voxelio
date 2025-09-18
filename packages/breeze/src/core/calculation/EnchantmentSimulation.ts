import type { DataDrivenRegistryElement } from "@/core/Element";
import { Identifier } from "@/core/Identifier";
import { TagsComparator } from "@/core/TagComparator";
import type { Enchantment } from "@/schema/Enchantment";
import type { TagType } from "@/schema/TagType";

export interface ItemData {
	id: string;
	enchantability: number;
	tags: string[];
}

interface EnchantmentEntry {
	enchantment: string;
	level: number;
	power: number;
}

interface EnchantmentPossible {
	id: string;
	enchantment: Enchantment;
	weight: number;
	applicableLevel: number;
}

export interface EnchantmentOption {
	level: number;
	cost: number;
	enchantments: Array<EnchantmentEntry>;
}

export interface EnchantmentStats {
	enchantmentId: string;
	probability: number;
	averageLevel: number;
	minLevel: number;
	maxLevel: number;
}

export interface SlotLevelRange {
	slot: number;
	minLevel: number;
	maxLevel: number;
}

/**
 * Accurate Minecraft enchantment system simulation
 * Based on official documentation formulas
 */
export class EnchantmentSimulator {
	private enchantments: Map<string, Enchantment>;
	private tagsComparator?: TagsComparator;
	private inEnchantingTableValues: Set<string> = new Set();
	private itemTagToEnchantmentsMap: Map<string, string[]> = new Map();

	constructor(enchantments: Map<string, Enchantment>, tags?: DataDrivenRegistryElement<TagType>[]) {
		this.enchantments = enchantments;

		if (tags && tags.length > 0) {
			this.tagsComparator = new TagsComparator(tags);
			this.initializeInEnchantingTableValues(tags);
		}
		this.buildItemTagToEnchantmentsMap();
	}

	private buildItemTagToEnchantmentsMap(): void {
		for (const [id, enchantment] of this.enchantments.entries()) {
			const items = enchantment.primary_items || enchantment.supported_items;
			const supportedItems = Array.isArray(items) ? items : [items];

			for (const supportedItem of supportedItems) {
				if (!this.itemTagToEnchantmentsMap.has(supportedItem)) {
					this.itemTagToEnchantmentsMap.set(supportedItem, []);
				}
				this.itemTagToEnchantmentsMap.get(supportedItem)?.push(id);
			}
		}
	}

	/**
	 * Simulates available enchantment options
	 * @param bookshelves Number of bookshelves (0-15)
	 * @param enchantability Item enchantability
	 * @param itemTags Item tags for compatibility checking
	 * @returns The 3 enchantment options (top, middle, bottom)
	 */
	public simulateEnchantmentTable(
		bookshelves: number,
		enchantability: number,
		itemTags: string[] = []
	): [EnchantmentOption, EnchantmentOption, EnchantmentOption] {
		const clampedBookshelves = Math.min(15, Math.max(0, bookshelves));
		const base = this.randomInt(1, 8) + Math.floor(clampedBookshelves / 2) + this.randomInt(0, clampedBookshelves);
		const topSlot = Math.floor(Math.max(base / 3, 1));
		const middleSlot = Math.floor((base * 2) / 3 + 1);
		const bottomSlot = Math.floor(Math.max(base, clampedBookshelves * 2));

		return [
			this.generateEnchantmentOption(topSlot, enchantability, itemTags),
			this.generateEnchantmentOption(middleSlot, enchantability, itemTags),
			this.generateEnchantmentOption(bottomSlot, enchantability, itemTags)
		];
	}

	/**
	 * Calculates probability statistics for each enchantment
	 * @param bookshelves Number of bookshelves
	 * @param enchantability Item enchantability
	 * @param itemTags Item tags
	 * @param iterations Number of iterations for statistical calculation
	 * @param slotIndex Specific slot index (0=top, 1=middle, 2=bottom). If undefined, all slots are considered
	 * @returns Statistics for each enchantment
	 */
	public calculateEnchantmentProbabilities(
		bookshelves: number,
		enchantability: number,
		itemTags: string[] = [],
		iterations = 10000,
		slotIndex?: number
	): EnchantmentStats[] {
		const results = new Map<string, { occurrences: number; levels: number[] }>();

		for (const [id] of this.enchantments) {
			results.set(id, { occurrences: 0, levels: [] });
		}

		if (slotIndex !== undefined && (slotIndex < 0 || slotIndex > 2)) {
			throw new Error(`Invalid slotIndex: ${slotIndex}. Must be 0, 1, or 2.`);
		}

		for (let i = 0; i < iterations; i++) {
			const options = this.simulateEnchantmentTable(bookshelves, enchantability, itemTags);
			const targetOptions = slotIndex !== undefined ? [options[slotIndex]] : options;

			for (const option of targetOptions) {
				for (const ench of option.enchantments) {
					const result = results.get(ench.enchantment);
					if (result) {
						result.occurrences++;
						result.levels.push(ench.level);
					}
				}
			}
		}

		const totalOptions = slotIndex !== undefined ? iterations : iterations * 3;

		return Array.from(results.entries())
			.map(([id, data]) => ({
				enchantmentId: id,
				probability: (data.occurrences / totalOptions) * 100,
				averageLevel: data.levels.length > 0 ? data.levels.reduce((a, b) => a + b, 0) / data.levels.length : 0,
				minLevel: data.levels.length > 0 ? Math.min(...data.levels) : 0,
				maxLevel: data.levels.length > 0 ? Math.max(...data.levels) : 0
			}))
			.filter((stat) => stat.probability > 0)
			.sort((a, b) => b.probability - a.probability);
	}

	/**
	 * Calculates the level ranges for each enchantment table slot
	 * @param bookshelves Number of bookshelves (0-15)
	 * @returns Array of slot ranges [top, middle, bottom]
	 */
	public getSlotLevelRanges(bookshelves: number): SlotLevelRange[] {
		const clampedBookshelves = Math.min(15, Math.max(0, bookshelves));

		// Calculate base range: randomInt(1,8) + floor(bookshelves/2) + randomInt(0,bookshelves)
		const minBase = 1 + Math.floor(clampedBookshelves / 2) + 0;
		const maxBase = 8 + Math.floor(clampedBookshelves / 2) + clampedBookshelves;

		// Calculate slot ranges
		const topMin = Math.floor(Math.max(minBase / 3, 1));
		const topMax = Math.floor(Math.max(maxBase / 3, 1));

		const middleMin = Math.floor((minBase * 2) / 3 + 1);
		const middleMax = Math.floor((maxBase * 2) / 3 + 1);

		const bottomMin = Math.floor(Math.max(minBase, clampedBookshelves * 2));
		const bottomMax = Math.floor(Math.max(maxBase, clampedBookshelves * 2));

		return [
			{ slot: 0, minLevel: topMin, maxLevel: topMax },
			{ slot: 1, minLevel: middleMin, maxLevel: middleMax },
			{ slot: 2, minLevel: bottomMin, maxLevel: bottomMax }
		];
	}

	private generateEnchantmentOption(baseLevel: number, enchantability: number, itemTags: string[]): EnchantmentOption {
		const modifiedLevel = this.applyEnchantabilityModifiers(baseLevel, enchantability);
		const itemTagSet = new Set(itemTags);
		const possibleEnchantments = this.findPossibleEnchantments(modifiedLevel, itemTagSet);
		const selectedEnchantments = this.selectEnchantments(possibleEnchantments, modifiedLevel);

		return {
			level: baseLevel,
			cost: baseLevel,
			enchantments: selectedEnchantments
		};
	}

	private applyEnchantabilityModifiers(baseLevel: number, enchantability: number): number {
		const modifier1 = this.randomInt(0, Math.floor(enchantability / 4)) + 1;
		const modifier2 = this.randomInt(0, Math.floor(enchantability / 4)) + 1;
		let modifiedLevel = baseLevel + modifier1 + modifier2;

		// Random bonus (0.85 - 1.15)
		const randomBonus = 1 + (Math.random() + Math.random() - 1) * 0.15;
		modifiedLevel = Math.round(modifiedLevel * randomBonus);

		return Math.max(1, modifiedLevel);
	}

	private findPossibleEnchantments(level: number, itemTagSet: Set<string>): Array<EnchantmentPossible> {
		const candidateEnchantmentIds = new Set<string>();
		for (const tag of itemTagSet) {
			const enchantments = this.itemTagToEnchantmentsMap.get(tag) ?? [];
			for (const enchId of enchantments) {
				candidateEnchantmentIds.add(enchId);
			}
			const hashTag = `#${tag}`;
			const enchantmentsForHash = this.itemTagToEnchantmentsMap.get(hashTag) ?? [];
			for (const enchId of enchantmentsForHash) {
				candidateEnchantmentIds.add(enchId);
			}
		}

		const possible: Array<EnchantmentPossible> = [];
		for (const id of candidateEnchantmentIds) {
			const enchantment = this.enchantments.get(id);
			if (!enchantment) continue;

			if (!this.isEnchantmentInEnchantingTable(id)) {
				continue;
			}

			const enchLevel = this.calculateApplicableLevel(enchantment, level);
			if (enchLevel > 0) {
				possible.push({
					id,
					enchantment,
					weight: enchantment.weight,
					applicableLevel: enchLevel
				});
			}
		}

		return possible;
	}

	private selectEnchantments(possibleEnchantments: Array<EnchantmentPossible>, level: number): Array<EnchantmentEntry> {
		if (possibleEnchantments.length === 0) return [];

		const selected: Array<EnchantmentEntry> = [];
		let remaining = [...possibleEnchantments];

		const first = this.weightedRandomSelect(remaining);
		if (first) {
			selected.push({
				enchantment: first.id,
				level: first.applicableLevel,
				power: first.applicableLevel
			});
			remaining = remaining.filter((e) => e.id !== first.id);
		}

		let extraChance = (level + 1) / 50.0;

		while (remaining.length > 0 && Math.random() < extraChance) {
			remaining = remaining.filter((e) =>
				this.areEnchantmentsCompatible(
					e.id,
					selected.map((s) => s.enchantment)
				)
			);

			if (remaining.length === 0) break;

			const next = this.weightedRandomSelect(remaining);
			if (next) {
				selected.push({
					enchantment: next.id,
					level: next.applicableLevel,
					power: next.applicableLevel
				});
				remaining = remaining.filter((e) => e.id !== next.id);
			}

			extraChance *= 0.5;
		}

		return selected;
	}

	private areEnchantmentsCompatible(newEnchantmentId: string, existingEnchantmentIds: string[]): boolean {
		const newEnchant = this.enchantments.get(newEnchantmentId);
		if (!newEnchant || !newEnchant.exclusive_set) {
			return true;
		}

		const newSets = Array.isArray(newEnchant.exclusive_set) ? newEnchant.exclusive_set : [newEnchant.exclusive_set];

		for (const existingId of existingEnchantmentIds) {
			const existingEnchant = this.enchantments.get(existingId);
			if (!existingEnchant || !existingEnchant.exclusive_set) {
				continue;
			}

			const existingSets = Array.isArray(existingEnchant.exclusive_set)
				? existingEnchant.exclusive_set
				: [existingEnchant.exclusive_set];

			for (const newSet of newSets) {
				for (const existingSet of existingSets) {
					if (newSet === existingSet) {
						return false;
					}
				}
			}
		}

		return true;
	}

	private calculateEnchantmentCost(cost: { base: number; per_level_above_first: number }, level: number): number {
		return cost.base + Math.max(0, level - 1) * cost.per_level_above_first;
	}

	private weightedRandomSelect<T extends { weight: number }>(items: T[]): T | null {
		if (items.length === 0) return null;

		const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
		if (totalWeight === 0) {
			return items[Math.floor(Math.random() * items.length)];
		}

		let random = Math.random() * totalWeight;
		for (const item of items) {
			if (random < item.weight) {
				return item;
			}
			random -= item.weight;
		}

		return null;
	}

	private randomInt(min: number, max: number): number {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	private initializeInEnchantingTableValues(tags: DataDrivenRegistryElement<TagType>[]): void {
		const inEnchantingTableTag = tags.find(
			(tag) => tag.identifier.resource === "in_enchanting_table" && tag.identifier.registry === "tags/enchantment"
		);

		if (inEnchantingTableTag && this.tagsComparator) {
			const values = this.tagsComparator.getRecursiveValues(inEnchantingTableTag.identifier);
			this.inEnchantingTableValues = new Set(values);
		}
	}

	private isEnchantmentInEnchantingTable(enchantmentId: string): boolean {
		if (this.inEnchantingTableValues.size === 0) return true;
		const normalizedId = Identifier.normalize(enchantmentId, "enchantment");
		return this.inEnchantingTableValues.has(normalizedId);
	}

	private calculateApplicableLevel(enchantment: Enchantment, powerLevel: number): number {
		for (let level = enchantment.max_level; level >= 1; level--) {
			const minCost = this.calculateEnchantmentCost(enchantment.min_cost, level);
			const maxCost = this.calculateEnchantmentCost(enchantment.max_cost, level);
			if (powerLevel >= minCost && powerLevel <= maxCost) {
				return level;
			}
		}

		return 0;
	}
}
