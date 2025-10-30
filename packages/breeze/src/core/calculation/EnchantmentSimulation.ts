import type { DataDrivenRegistryElement } from "@/core/Element";
import { Identifier } from "@/core/Identifier";
import { TagsProcessor } from "@/core/TagsProcessor";
import type { Enchantment } from "@/core/schema/enchant/types";
import type { TagType } from "@/core/Tag";

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

export interface EnchantmentPossible {
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
	private tagsComparator?: TagsProcessor;
	private inEnchantingTableValues: Set<string> = new Set();
	private itemTagToEnchantmentsMap: Map<string, string[]> = new Map();
	private exclusiveSetCache = new Map<string, Set<string>>();
	private applicableLevelCache = new Map<string, number>();
	private possibleEnchantmentsCache = new Map<string, EnchantmentPossible[]>();

	constructor(enchantments: Map<string, Enchantment>, tags?: DataDrivenRegistryElement<TagType>[]) {
		this.enchantments = enchantments;

		if (tags && tags.length > 0) {
			this.tagsComparator = new TagsProcessor(tags);
			this.initializeInEnchantingTableValues(tags);
		}
		this.buildItemTagToEnchantmentsMap();
		this.preCalculateExclusiveSets();
	}

	private buildItemTagToEnchantmentsMap(): void {
		for (const [id, enchantment] of this.enchantments.entries()) {
			const items = enchantment.primary_items || enchantment.supported_items;
			const itemsArray = Array.isArray(items) ? items : [items];

			for (const item of itemsArray) {
				const enchantments = this.itemTagToEnchantmentsMap.get(item);
				if (enchantments) {
					enchantments.push(id);
				} else {
					this.itemTagToEnchantmentsMap.set(item, [id]);
				}
			}
		}
	}

	private preCalculateExclusiveSets(): void {
		for (const [id, enchantment] of this.enchantments.entries()) {
			if (!enchantment.exclusive_set) continue;
			this.exclusiveSetCache.set(id, this.resolveExclusiveSet(enchantment.exclusive_set));
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
	 * @param iterations Maximum number of iterations for statistical calculation
	 * @param slotIndex Specific slot index (0=top, 1=middle, 2=bottom). If undefined, all slots are considered
	 * @param convergenceThreshold Threshold for early stopping (default: 0.001 = 0.1% change)
	 * @returns Statistics for each enchantment
	 */
	public calculateEnchantmentProbabilities(
		bookshelves: number,
		enchantability: number,
		itemTags: string[] = [],
		iterations = 1000,
		slotIndex?: number,
		convergenceThreshold = 0.001
	): EnchantmentStats[] {
		if (slotIndex !== undefined && (slotIndex < 0 || slotIndex > 2)) {
			throw new Error(`Invalid slotIndex: ${slotIndex}. Must be 0, 1, or 2.`);
		}

		const results = new Map<string, { occurrences: number; totalLevel: number; minLevel: number; maxLevel: number }>();
		for (const [id] of this.enchantments) {
			results.set(id, { occurrences: 0, totalLevel: 0, minLevel: Number.POSITIVE_INFINITY, maxLevel: 0 });
		}

		let previousProbabilities: Map<string, number> | null = null;
		const convergenceCheckInterval = 100;
		const minIterationsBeforeConvergence = 200;
		let actualIterations = 0;

		for (let i = 0; i < iterations; i++) {
			actualIterations = i + 1;
			const options = this.simulateEnchantmentTable(bookshelves, enchantability, itemTags);
			const targetOptions = slotIndex !== undefined ? [options[slotIndex]] : options;

			for (const option of targetOptions) {
				for (const ench of option.enchantments) {
					const result = results.get(ench.enchantment);
					if (!result) continue;

					result.occurrences++;
					result.totalLevel += ench.level;
					if (ench.level < result.minLevel) result.minLevel = ench.level;
					if (ench.level > result.maxLevel) result.maxLevel = ench.level;
				}
			}

			if (i > minIterationsBeforeConvergence && i % convergenceCheckInterval === 0) {
				const currentTotalOptions = slotIndex !== undefined ? actualIterations : actualIterations * 3;
				const currentProbabilities = new Map<string, number>();

				for (const [id, data] of results) {
					if (data.occurrences === 0) continue;
					currentProbabilities.set(id, (data.occurrences / currentTotalOptions) * 100);
				}

				if (previousProbabilities && this.hasConverged(previousProbabilities, currentProbabilities, convergenceThreshold)) {
					break;
				}

				previousProbabilities = currentProbabilities;
			}
		}

		const totalOptions = slotIndex !== undefined ? actualIterations : actualIterations * 3;
		const stats: EnchantmentStats[] = [];

		for (const [id, data] of results) {
			if (data.occurrences === 0) continue;

			stats.push({
				enchantmentId: id,
				probability: (data.occurrences / totalOptions) * 100,
				averageLevel: data.totalLevel / data.occurrences,
				minLevel: data.minLevel,
				maxLevel: data.maxLevel
			});
		}

		return stats.sort((a, b) => b.probability - a.probability);
	}

	private hasConverged(previous: Map<string, number>, current: Map<string, number>, threshold: number): boolean {
		let maxChange = 0;

		for (const [id, currentProb] of current) {
			const previousProb = previous.get(id) ?? 0;
			const change = Math.abs(currentProb - previousProb);
			if (change > maxChange) maxChange = change;
		}

		for (const [id, previousProb] of previous) {
			if (!current.has(id)) {
				if (previousProb > maxChange) maxChange = previousProb;
			}
		}

		return maxChange < threshold;
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
		const sortedTags = Array.from(itemTagSet).sort().join("|");
		const cacheKey = `${level}:${sortedTags}`;
		const cached = this.possibleEnchantmentsCache.get(cacheKey);
		if (cached) return cached;

		const candidateIds = new Set<string>();

		for (const tag of itemTagSet) {
			const directEnchantments = this.itemTagToEnchantmentsMap.get(tag);
			if (directEnchantments) {
				for (const enchId of directEnchantments) candidateIds.add(enchId);
			}

			const taggedEnchantments = this.itemTagToEnchantmentsMap.get(`#${tag}`);
			if (taggedEnchantments) {
				for (const enchId of taggedEnchantments) candidateIds.add(enchId);
			}
		}

		const result: EnchantmentPossible[] = [];

		for (const id of candidateIds) {
			const enchantment = this.enchantments.get(id);
			if (!enchantment || !this.isEnchantmentInEnchantingTable(id)) continue;

			const enchLevel = this.calculateApplicableLevel(enchantment, level);
			if (enchLevel > 0) {
				result.push({ id, enchantment, weight: enchantment.weight, applicableLevel: enchLevel });
			}
		}

		this.possibleEnchantmentsCache.set(cacheKey, result);
		return result;
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
		const resolvedNewSets = this.exclusiveSetCache.get(newEnchantmentId);
		if (!resolvedNewSets) return true;

		for (const existingId of existingEnchantmentIds) {
			const resolvedExistingSets = this.exclusiveSetCache.get(existingId);
			if (!resolvedExistingSets) continue;

			for (const newSet of resolvedNewSets) {
				if (resolvedExistingSets.has(newSet)) return false;
			}
		}

		return true;
	}

	private resolveExclusiveSet(exclusiveSet: string | string[]): Set<string> {
		const sets = Array.isArray(exclusiveSet) ? exclusiveSet : [exclusiveSet];
		const resolved = new Set<string>();

		for (const set of sets) {
			if (set.startsWith("#") && this.tagsComparator) {
				const tagId = Identifier.of(set, "tags/enchantment");
				for (const value of this.tagsComparator.getRecursiveValues(tagId.get())) {
					resolved.add(value);
				}
				continue;
			}
			resolved.add(set);
		}

		return resolved;
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

	/**
	 * Extracts all primary items from all enchantments
	 * Returns a flattened array of all unique item identifiers
	 * from primary_items field (falls back to supported_items if primary_items is not defined)
	 * @param itemTags Array of item tags for resolving tag references
	 * @returns Array of item identifiers that can be enchanted
	 */
	public getFlattenedPrimaryItems(itemTags: DataDrivenRegistryElement<TagType>[]): string[] {
		const items = new Set<string>();
		const itemTagsProcessor = itemTags.length > 0 ? new TagsProcessor(itemTags) : null;

		for (const [enchantmentId, enchantment] of this.enchantments) {
			const itemsField = enchantment.primary_items ?? enchantment.supported_items;
			if (!itemsField) {
				throw new Error(`Enchantment ${enchantmentId} has neither primary_items nor supported_items defined`);
			}

			const itemsArray = Array.isArray(itemsField) ? itemsField : [itemsField];

			for (const item of itemsArray) {
				if (!item.startsWith("#")) {
					items.add(item);
					continue;
				}

				if (!itemTagsProcessor) continue;
				const resolvedItems = itemTagsProcessor.getRecursiveValues(Identifier.of(item, "tags/item").get());
				for (const resolvedItem of resolvedItems) {
					items.add(resolvedItem);
				}
			}
		}

		return Array.from(items).sort();
	}

	private calculateApplicableLevel(enchantment: Enchantment, powerLevel: number): number {
		const cacheKey = `${enchantment.max_level}:${enchantment.min_cost.base}:${enchantment.min_cost.per_level_above_first}:${enchantment.max_cost.base}:${enchantment.max_cost.per_level_above_first}:${powerLevel}`;
		const cached = this.applicableLevelCache.get(cacheKey);
		if (cached !== undefined) return cached;

		for (let level = enchantment.max_level; level >= 1; level--) {
			const minCost = this.calculateEnchantmentCost(enchantment.min_cost, level);
			const maxCost = this.calculateEnchantmentCost(enchantment.max_cost, level);
			if (powerLevel >= minCost && powerLevel <= maxCost) {
				this.applicableLevelCache.set(cacheKey, level);
				return level;
			}
		}

		this.applicableLevelCache.set(cacheKey, 0);
		return 0;
	}
}
