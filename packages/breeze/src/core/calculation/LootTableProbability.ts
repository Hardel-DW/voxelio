import type { LootGroup, LootItem, LootTableProps } from "@/core/schema/loot/types";

export interface ProbabilityResult {
    itemId: string;
    itemIndex: number;
    poolIndex: number;
    probability: number;
    name: string;
    entryType?: string;
}

export interface ProbabilityOptions {
    luck?: number;
    excludedItemIds?: string[];
    excludeConditionTypes?: string[];
}

type PoolEntry = { item?: LootItem; group?: LootGroup; itemIndex?: number };

export class LootTableProbabilityCalculator {
    private itemMap: Map<string, LootItem & { index: number }>;
    private groupMap: Map<string, LootGroup>;
    private itemsInGroups: Set<string>;
    private childGroups: Set<string>;

    constructor(private lootTable: LootTableProps) {
        this.itemMap = new Map(lootTable.items.map((item, index) => [item.id, { ...item, index }]));
        this.groupMap = new Map(lootTable.groups.map((group) => [group.id, group]));
        this.itemsInGroups = new Set(lootTable.groups.flatMap((g) => g.items));
        this.childGroups = new Set(lootTable.groups.flatMap((g) => g.items).filter((id) => this.groupMap.has(id)));
    }

    calculateProbabilities(options: ProbabilityOptions = {}): ProbabilityResult[] {
        const { luck = 0, excludedItemIds = [], excludeConditionTypes = [] } = options;
        const poolItems = this.groupItemsByPool();

        return Array.from(poolItems.entries()).flatMap(([, entries]) =>
            this.calculatePoolProbabilities(entries, luck, excludedItemIds, excludeConditionTypes)
        );
    }

    private groupItemsByPool(): Map<number, PoolEntry[]> {
        const poolItems = new Map<number, PoolEntry[]>();
        for (const [index, item] of this.lootTable.items.entries()) {
            if (!this.itemsInGroups.has(item.id)) {
                this.addToPool(poolItems, item.poolIndex, { item, itemIndex: index });
            }
        }

        for (const group of this.lootTable.groups) {
            if (!this.childGroups.has(group.id)) {
                this.addToPool(poolItems, group.poolIndex, { group });
            }
        }

        return poolItems;
    }

    private addToPool(poolItems: Map<number, PoolEntry[]>, poolIndex: number, entry: PoolEntry): void {
        poolItems.set(poolIndex, [...(poolItems.get(poolIndex) ?? []), entry]);
    }

    private calculatePoolProbabilities(
        entries: PoolEntry[],
        luck: number,
        excludedItemIds: string[],
        excludeConditionTypes: string[]
    ): ProbabilityResult[] {
        const validEntries = entries.filter((entry) => this.isValidEntry(entry, excludedItemIds, excludeConditionTypes));
        if (!validEntries.length) return [];

        const weights = validEntries.map((entry) => this.calculateWeight(entry, luck));
        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

        if (totalWeight === 0) return [];

        return validEntries.flatMap((entry, index) => {
            const probability = weights[index] / totalWeight;
            return this.processEntry(entry, probability, luck, excludedItemIds, excludeConditionTypes);
        });
    }

    private isValidEntry(entry: PoolEntry, excludedItemIds: string[], excludeConditionTypes: string[]): boolean {
        if (entry.item?.id && excludedItemIds.includes(entry.item.id)) return false;
        return !this.hasExcludedCondition(entry.item?.conditions ?? entry.group?.conditions ?? [], excludeConditionTypes);
    }

    private calculateWeight(entry: PoolEntry, luck: number): number {
        const weight = entry.item?.weight ?? 1;
        const quality = entry.item?.quality ?? 0;
        return Math.floor(weight + quality * luck);
    }

    private processEntry(
        entry: PoolEntry,
        probability: number,
        luck: number,
        excludedItemIds: string[],
        excludeConditionTypes: string[]
    ): ProbabilityResult[] {
        if (entry.item && entry.itemIndex !== undefined) {
            const { id, poolIndex, name, entryType } = entry.item;
            return [{ itemId: id, itemIndex: entry.itemIndex, poolIndex, probability, name, entryType }];
        }

        return entry.group ? this.calculateGroupProbabilities(entry.group, probability, luck, excludedItemIds, excludeConditionTypes) : [];
    }

    private calculateGroupProbabilities(
        group: LootGroup,
        groupProbability: number,
        luck: number,
        excludedItemIds: string[],
        excludeConditionTypes: string[]
    ): ProbabilityResult[] {
        const validItems = group.items.filter((itemId) => this.isValidItem(itemId, excludedItemIds, excludeConditionTypes));
        if (!validItems.length) return [];

        return group.type === "alternatives"
            ? this.processAlternatives(validItems, groupProbability, luck, excludedItemIds, excludeConditionTypes)
            : this.processGroupSequence(validItems, groupProbability, luck, excludedItemIds, excludeConditionTypes);
    }

    private isValidItem(itemId: string, excludedItemIds: string[], excludeConditionTypes: string[]): boolean {
        if (excludedItemIds.includes(itemId)) return false;

        const item = this.itemMap.get(itemId);
        const nestedGroup = this.groupMap.get(itemId);

        return !this.hasExcludedCondition(item?.conditions ?? nestedGroup?.conditions ?? [], excludeConditionTypes);
    }

    private processAlternatives(
        validItems: string[],
        groupProbability: number,
        luck: number,
        excludedItemIds: string[],
        excludeConditionTypes: string[]
    ): ProbabilityResult[] {
        const weights = validItems.map((itemId) => {
            const item = this.itemMap.get(itemId);
            return this.calculateWeight({ item }, luck);
        });

        const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        if (totalWeight === 0) return [];

        return validItems.flatMap((itemId, index) => {
            const probability = (weights[index] / totalWeight) * groupProbability;
            return this.processItemOrGroup(itemId, probability, luck, excludedItemIds, excludeConditionTypes);
        });
    }

    private processGroupSequence(
        validItems: string[],
        groupProbability: number,
        luck: number,
        excludedItemIds: string[],
        excludeConditionTypes: string[]
    ): ProbabilityResult[] {
        return validItems.flatMap((itemId) =>
            this.processItemOrGroup(itemId, groupProbability, luck, excludedItemIds, excludeConditionTypes)
        );
    }

    private processItemOrGroup(
        itemId: string,
        probability: number,
        luck: number,
        excludedItemIds: string[],
        excludeConditionTypes: string[]
    ): ProbabilityResult[] {
        const item = this.itemMap.get(itemId);
        const itemIndex = this.lootTable.items.findIndex((i) => i.id === itemId);
        if (item) {
            return [{ itemId: item.id, itemIndex, poolIndex: item.poolIndex, probability, name: item.name, entryType: item.entryType }];
        }

        const nestedGroup = this.groupMap.get(itemId);
        return nestedGroup ? this.calculateGroupProbabilities(nestedGroup, probability, luck, excludedItemIds, excludeConditionTypes) : [];
    }

    private hasExcludedCondition(conditions: any[], excludeConditionTypes: string[]): boolean {
        return conditions.some((condition) => {
            const conditionType = typeof condition === "object" ? condition.condition : condition;
            return typeof conditionType === "string" && excludeConditionTypes.includes(conditionType);
        });
    }

    getItemById = (itemId: string) => this.itemMap.get(itemId);
    getItemByIndex = (index: number) => this.lootTable.items[index];
    getGroupById = (groupId: string) => this.groupMap.get(groupId);
}
