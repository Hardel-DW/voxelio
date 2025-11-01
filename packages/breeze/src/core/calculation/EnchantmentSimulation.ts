import type { DataDrivenRegistryElement } from "@/core/Element";
import { Identifier } from "@/core/Identifier";
import { TagsProcessor } from "@/core/TagsProcessor";
import type { Enchantment } from "@/core/schema/enchant/types";
import type { TagType } from "@/core/Tag";
import { randomInt } from "@/utils";

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
 * Simulates Minecraft's vanilla enchanting table mechanics.
 * @see {@link https://minecraft.wiki/w/Enchanting_mechanics | Enchanting Mechanics}
 * @see {@link https://minecraft.wiki/w/Enchantment_definition | Enchantment Definition}
 */
export class EnchantmentSimulator {
	private enchantments: Map<string, Enchantment>;
	private tagsComparator?: TagsProcessor;
	private inEnchantingTableValues: Set<string> = new Set();
	private itemTagToEnchantmentsMap: Map<string, string[]> = new Map();
	private exclusiveSetCache = new Map<string, Set<string>>();
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

	/**
	 * Builds a reverse lookup map from item tags to enchantment IDs.
	 * Allows O(1) lookup of which enchantments apply to items with specific tags.
	 * Processes both `primary_items` and `supported_items` fields.
	 */
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

	/**
	 * Pre-calculates and caches resolved exclusive sets for all enchantments.
	 * Runs during construction to resolve tag references in `exclusive_set` fields.
	 * Significantly improves performance during compatibility checks (x2 speedup).
	 */
	private preCalculateExclusiveSets(): void {
		for (const [id, enchantment] of this.enchantments.entries()) {
			if (!enchantment.exclusive_set) continue;
			this.exclusiveSetCache.set(id, this.resolveExclusiveSet(enchantment.exclusive_set));
		}
	}

	/**
	 * Simulates the 3 enchanting table slot options.
	 * Formula: `base = randomInt(1,8) + floor(bookshelves/2) + randomInt(0,bookshelves)`
	 * - Top: `floor(max(base/3, 1))`
	 * - Middle: `floor(base*2/3 + 1)`
	 * - Bottom: `floor(max(base, bookshelves*2))`
	 *
	 * @param bookshelves - Number of bookshelves (0-15)
	 * @param enchantability - Item enchantability value
	 * @param itemTags - Item tags for compatibility
	 * @returns [top, middle, bottom] enchantment options
	 * @see {@link https://minecraft.wiki/w/Enchanting_mechanics#How_enchantments_are_chosen | Selection Algorithm}
	 */
	public simulateEnchantmentTable(
		bookshelves: number,
		enchantability: number,
		itemTags: string[] = []
	): [EnchantmentOption, EnchantmentOption, EnchantmentOption] {
		const clampedBookshelves = Math.min(15, Math.max(0, bookshelves));
		const base = randomInt(1, 8) + Math.floor(clampedBookshelves / 2) + randomInt(0, clampedBookshelves);
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
	 * Calculates enchantment probability statistics via Monte Carlo simulation with early stopping.
	 * @param bookshelves - Number of bookshelves (0-15)
	 * @param enchantability - Item enchantability value
	 * @param itemTags - Item tags for compatibility
	 * @param iterations - Maximum simulations (default: 1000)
	 * @param slotIndex - Specific slot (0=top, 1=middle, 2=bottom) or undefined for all
	 * @param convergenceThreshold - Early stop threshold (default: 0.001)
	 * @returns Statistics sorted by probability (descending)
	 * @see {@link https://minecraft.wiki/w/Enchanting_mechanics | Enchanting Mechanics}
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

	/**
	 * Checks if probability calculations have converged (early stopping criteria).
	 * Compares maximum probability change between iterations against threshold.
	 * Allows stopping simulations early once probabilities stabilize.
	 * @param previous - Previous iteration's probabilities
	 * @param current - Current iteration's probabilities
	 * @param threshold - Maximum allowed change (e.g., 0.001 = 0.1%)
	 * @returns `true` if converged, `false` if more iterations needed
	 */
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
	 * Calculates min/max level ranges for each enchanting table slot.
	 * @param bookshelves - Number of bookshelves (0-15)
	 * @returns [top, middle, bottom] slot ranges
	 * @see {@link https://minecraft.wiki/w/Enchanting_mechanics#Bookshelf_placement | Bookshelf Mechanics}
	 */
	public getSlotLevelRanges(bookshelves: number): SlotLevelRange[] {
		const clampedBookshelves = Math.min(15, Math.max(0, bookshelves));
		const minBase = 1 + Math.floor(clampedBookshelves / 2) + 0;
		const maxBase = 8 + Math.floor(clampedBookshelves / 2) + clampedBookshelves;
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

	/**
	 * Generates a complete enchantment option for one slot.
	 * Pipeline: base level → apply enchantability → find possible → select compatible
	 * @param baseLevel - Raw level from slot calculation
	 * @param enchantability - Item enchantability value
	 * @param itemTags - Item tags for filtering
	 * @returns Complete enchantment option with level, cost, and selected enchantments
	 */
	private generateEnchantmentOption(baseLevel: number, enchantability: number, itemTags: string[]): EnchantmentOption {
		const modifiedLevel = this.applyEnchantabilityModifiers(baseLevel, enchantability);
		const itemTagSet = new Set(itemTags);
		const possibleEnchantments = this.findPossibleEnchantments(modifiedLevel, itemTagSet);
		const selectedEnchantments = this.selectEnchantments(possibleEnchantments, modifiedLevel);
		return { level: baseLevel, cost: baseLevel, enchantments: selectedEnchantments };
	}

	/**
	 * Applies enchantability modifiers using triangular distribution.
	 * Formula: `level + 2 * (randomInt(0, floor(enchantability/4)) + 1)`, then multiply by `[0.85-1.15]`
	 * @param baseLevel - Base level from slot
	 * @param enchantability - Item enchantability
	 * @see {@link https://minecraft.wiki/w/Enchanting_mechanics#Enchantability | Enchantability Mechanics}
	 */
	private applyEnchantabilityModifiers(baseLevel: number, enchantability: number): number {
		const modifier1 = randomInt(0, Math.floor(enchantability / 4)) + 1;
		const modifier2 = randomInt(0, Math.floor(enchantability / 4)) + 1;
		const modifiedLevel = baseLevel + modifier1 + modifier2;
		const randomBonus = 1 + (Math.random() + Math.random() - 1) * 0.15;
		const modifiedLevelWithBonus = Math.round(modifiedLevel * randomBonus);
		return Math.max(1, modifiedLevelWithBonus);
	}

	/**
	 * Finds enchantments applicable to the item at the given power level.
	 * Matches item tags (direct and `#` references), filters by enchanting table availability.
	 * @param level - Modified power level
	 * @param itemTagSet - Item tags
	 */
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

	/**
	 * Selects enchantments via weighted random with compatibility checks.
	 * Extra chance formula: `(level + 1) / 50`, then `*= 0.5` per additional enchantment.
	 * @param possibleEnchantments - Available enchantments
	 * @param level - Modified power level
	 * @see {@link https://minecraft.wiki/w/Enchanting_mechanics#Selecting_enchantments | Selection Algorithm}
	 */
	private selectEnchantments(possibleEnchantments: Array<EnchantmentPossible>, level: number): Array<EnchantmentEntry> {
		if (possibleEnchantments.length === 0) return [];

		const selected: Array<EnchantmentEntry> = [];
		let remaining = [...possibleEnchantments];

		const first = this.weightedRandomSelect(remaining);
		if (first) {
			selected.push({ enchantment: first.id, level: first.applicableLevel, power: first.applicableLevel });
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
				selected.push({ enchantment: next.id, level: next.applicableLevel, power: next.applicableLevel });
				remaining = remaining.filter((e) => e.id !== next.id);
			}

			extraChance *= 0.5;
		}

		return selected;
	}

	/**
	 * Checks enchantment compatibility via exclusive sets. Uses pre-calculated cache for O(1) lookups.
	 * @param newEnchantmentId - Enchantment to test
	 * @param existingEnchantmentIds - Already selected enchantments
	 * @see {@link https://minecraft.wiki/w/Enchantment_tag_(Java_Edition) | Exclusive Sets}
	 */
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

	/**
	 * Resolves exclusive set identifiers, expanding `#` tag references recursively.
	 * @param exclusiveSet - String, array, or tag reference
	 */
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

	/**
	 * Calculates enchantment cost. Formula: `base + max(0, level - 1) * per_level_above_first`
	 * @param cost - Cost structure
	 * @param level - Enchantment level
	 */
	private calculateEnchantmentCost(cost: { base: number; per_level_above_first: number }, level: number): number {
		return cost.base + Math.max(0, level - 1) * cost.per_level_above_first;
	}

	/**
	 * Weighted random selection via cumulative distribution. Falls back to uniform if total weight is 0.
	 * @param items - Items with weight property
	 */
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

	/**
	 * Initializes enchantments available in tables via `#minecraft:in_enchanting_table` tag.
	 * Excludes treasure enchantments not in this tag.
	 * @param tags - Enchantment tags
	 */
	private initializeInEnchantingTableValues(tags: DataDrivenRegistryElement<TagType>[]): void {
		const inEnchantingTableTag = tags.find(
			(tag) => tag.identifier.resource === "in_enchanting_table" && tag.identifier.registry === "tags/enchantment"
		);

		if (inEnchantingTableTag && this.tagsComparator) {
			const values = this.tagsComparator.getRecursiveValues(inEnchantingTableTag.identifier);
			this.inEnchantingTableValues = new Set(values);
		}
	}

	/**
	 * Checks if enchantment can appear in tables. Returns `true` if no tag defined or ID is in tag set.
	 * @param enchantmentId - Enchantment ID to check
	 */
	private isEnchantmentInEnchantingTable(enchantmentId: string): boolean {
		if (this.inEnchantingTableValues.size === 0) return true;
		const normalizedId = Identifier.normalize(enchantmentId, "enchantment");
		return this.inEnchantingTableValues.has(normalizedId);
	}

	/**
	 * Extracts all unique primary items from registered enchantments. Resolves `#` tag references.
	 * Falls back to `supported_items` if `primary_items` is not defined.
	 * @param itemTags - Item tag definitions for resolving references
	 * @returns Sorted unique item identifiers
	 * @throws {Error} If enchantment lacks both `primary_items` and `supported_items`
	 * @see {@link https://minecraft.wiki/w/Enchantment_definition#JSON_structure | Enchantment JSON}
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

	/**
	 * Calculates which enchantment level is applicable for the given power level.
	 * Tests from max_level down to 1, checking if power falls within min_cost/max_cost range.
	 * Cost formula: `base + max(0, level - 1) * per_level_above_first`
	 * @param enchantment - Enchantment to calculate
	 * @param powerLevel - Modified power level
	 * @returns Applicable level (1 to max_level), or 0 if not applicable
	 * @see {@link https://minecraft.wiki/w/Enchanting_mechanics#Enchantment_level | Level Calculation}
	 */
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
