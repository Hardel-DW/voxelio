import type { LootTableAction } from "../domains/loot_table/types";
import { ActionBuilder } from "./ActionBuilder";

/**
 * Builder for loot table actions with fluent API
 */
export class LootTableActionBuilder extends ActionBuilder<LootTableAction> {
    /**
     * Add a new loot item
     */
    addItem(poolIndex: number): AddLootItemBuilder {
        return new AddLootItemBuilder(poolIndex);
    }

    /**
     * Remove a loot item
     */
    removeItem(itemId: string): RemoveLootItemBuilder {
        return new RemoveLootItemBuilder(itemId);
    }

    /**
     * Modify an existing loot item
     */
    modifyItem(itemId: string): ModifyLootItemBuilder {
        return new ModifyLootItemBuilder(itemId);
    }

    /**
     * Create a new loot group
     */
    createGroup(groupType: "alternatives" | "group" | "sequence", poolIndex: number): CreateLootGroupBuilder {
        return new CreateLootGroupBuilder(groupType, poolIndex);
    }

    /**
     * Modify an existing loot group
     */
    modifyGroup(groupId: string): ModifyLootGroupBuilder {
        return new ModifyLootGroupBuilder(groupId);
    }

    /**
     * Dissolve a loot group
     */
    dissolveGroup(groupId: string): DissolveLootGroupBuilder {
        return new DissolveLootGroupBuilder(groupId);
    }

    /**
     * Move item between pools
     */
    moveItem(itemId: string, targetPoolIndex: number): MoveItemBuilder {
        return new MoveItemBuilder(itemId, targetPoolIndex);
    }

    /**
     * Balance weights in a pool
     */
    balanceWeights(poolIndex: number): BalanceWeightsBuilder {
        return new BalanceWeightsBuilder(poolIndex);
    }

    build(): LootTableAction {
        throw new Error("Use specific builder methods to create actions");
    }
}

class AddLootItemBuilder extends ActionBuilder<Extract<LootTableAction, { type: "loot_table.add_loot_item" }>> {
    private item: { name: string; weight?: number; quality?: number; conditions?: string[]; functions?: string[] } = { name: "" };

    constructor(private poolIndex: number) {
        super();
    }

    /**
     * Set the item name
     */
    name(name: string): this {
        this.item.name = name;
        return this;
    }

    /**
     * Set the item weight
     */
    weight(weight: number): this {
        this.item.weight = weight;
        return this;
    }

    /**
     * Set the item quality
     */
    quality(quality: number): this {
        this.item.quality = quality;
        return this;
    }

    /**
     * Add conditions
     */
    conditions(...conditions: string[]): this {
        this.item.conditions = [...(this.item.conditions || []), ...conditions];
        return this;
    }

    /**
     * Add functions
     */
    functions(...functions: string[]): this {
        this.item.functions = [...(this.item.functions || []), ...functions];
        return this;
    }

    build() {
        if (!this.item.name) {
            throw new Error("Item name is required");
        }

        return {
            type: "loot_table.add_loot_item" as const,
            poolIndex: this.poolIndex,
            item: this.item
        };
    }
}

class RemoveLootItemBuilder extends ActionBuilder<Extract<LootTableAction, { type: "loot_table.remove_loot_item" }>> {
    constructor(private itemId: string) {
        super();
    }

    build() {
        return {
            type: "loot_table.remove_loot_item" as const,
            itemId: this.itemId
        };
    }
}

class ModifyLootItemBuilder extends ActionBuilder<Extract<LootTableAction, { type: "loot_table.modify_loot_item" }>> {
    private property?: "name" | "weight" | "quality";
    private value?: unknown;

    constructor(private itemId: string) {
        super();
    }

    /**
     * Set the name property
     */
    name(name: string): this {
        this.property = "name";
        this.value = name;
        return this;
    }

    /**
     * Set the weight property
     */
    weight(weight: number): this {
        this.property = "weight";
        this.value = weight;
        return this;
    }

    /**
     * Set the quality property
     */
    quality(quality: number): this {
        this.property = "quality";
        this.value = quality;
        return this;
    }

    build() {
        if (!this.property || this.value === undefined) {
            throw new Error("Property and value must be set");
        }

        return {
            type: "loot_table.modify_loot_item" as const,
            itemId: this.itemId,
            property: this.property,
            value: this.value
        };
    }
}

class CreateLootGroupBuilder extends ActionBuilder<Extract<LootTableAction, { type: "loot_table.create_loot_group" }>> {
    private itemIds: string[] = [];
    private entryIndexValue?: number;

    constructor(
        private groupType: "alternatives" | "group" | "sequence",
        private poolIndex: number
    ) {
        super();
    }

    /**
     * Add items to the group
     */
    items(...itemIds: string[]): this {
        this.itemIds.push(...itemIds);
        return this;
    }

    /**
     * Set the entry index
     */
    entryIndex(index: number): this {
        this.entryIndexValue = index;
        return this;
    }

    build() {
        return {
            type: "loot_table.create_loot_group" as const,
            groupType: this.groupType,
            itemIds: this.itemIds,
            poolIndex: this.poolIndex,
            ...(this.entryIndexValue !== undefined && { entryIndex: this.entryIndexValue })
        };
    }
}

class ModifyLootGroupBuilder extends ActionBuilder<Extract<LootTableAction, { type: "loot_table.modify_loot_group" }>> {
    private operation?: "add_item" | "remove_item" | "change_type";
    private value?: unknown;

    constructor(private groupId: string) {
        super();
    }

    /**
     * Add an item to the group
     */
    addItem(itemId: string): this {
        this.operation = "add_item";
        this.value = itemId;
        return this;
    }

    /**
     * Remove an item from the group
     */
    removeItem(itemId: string): this {
        this.operation = "remove_item";
        this.value = itemId;
        return this;
    }

    /**
     * Change the group type
     */
    changeType(type: "alternatives" | "group" | "sequence"): this {
        this.operation = "change_type";
        this.value = type;
        return this;
    }

    build() {
        if (!this.operation || this.value === undefined) {
            throw new Error("Operation and value must be set");
        }

        return {
            type: "loot_table.modify_loot_group" as const,
            groupId: this.groupId,
            operation: this.operation,
            value: this.value
        };
    }
}

class DissolveLootGroupBuilder extends ActionBuilder<Extract<LootTableAction, { type: "loot_table.dissolve_loot_group" }>> {
    constructor(private groupId: string) {
        super();
    }

    build() {
        return {
            type: "loot_table.dissolve_loot_group" as const,
            groupId: this.groupId
        };
    }
}

class MoveItemBuilder extends ActionBuilder<Extract<LootTableAction, { type: "loot_table.move_item_between_pools" }>> {
    constructor(
        private itemId: string,
        private targetPoolIndex: number
    ) {
        super();
    }

    build() {
        return {
            type: "loot_table.move_item_between_pools" as const,
            itemId: this.itemId,
            targetPoolIndex: this.targetPoolIndex
        };
    }
}

class BalanceWeightsBuilder extends ActionBuilder<Extract<LootTableAction, { type: "loot_table.balance_weights" }>> {
    private targetTotalValue?: number;

    constructor(private poolIndex: number) {
        super();
    }

    /**
     * Set the target total weight
     */
    targetTotal(total: number): this {
        this.targetTotalValue = total;
        return this;
    }

    build() {
        return {
            type: "loot_table.balance_weights" as const,
            poolIndex: this.poolIndex,
            ...(this.targetTotalValue !== undefined && { targetTotal: this.targetTotalValue })
        };
    }
}
