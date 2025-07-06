export interface LootTableActions {
    add_loot_item: {
        poolIndex: number;
        item: { name: string; weight?: number; quality?: number; conditions?: string[]; functions?: string[] };
    };
    remove_loot_item: {
        itemId: string;
    };
    modify_loot_item: {
        itemId: string;
        property: "name" | "weight" | "quality";
        value: unknown;
    };
    create_loot_group: {
        groupType: "alternatives" | "group" | "sequence";
        itemIds: string[];
        poolIndex: number;
        entryIndex?: number;
    };
    modify_loot_group: {
        groupId: string;
        operation: "add_item" | "remove_item" | "change_type";
        value: unknown;
    };
    dissolve_loot_group: {
        groupId: string;
    };
    move_item_between_pools: {
        itemId: string;
        targetPoolIndex: number;
    };
    move_group_between_pools: {
        groupId: string;
        targetPoolIndex: number;
    };
    duplicate_loot_item: {
        itemId: string;
        targetPoolIndex?: number;
    };
    bulk_modify_items: {
        itemIds: string[];
        property: "weight" | "quality";
        operation: "multiply" | "add" | "set";
        value: number;
    };
    convert_item_to_group: {
        itemId: string;
        groupType: "alternatives" | "group" | "sequence";
        additionalItems?: string[];
    };
    convert_group_to_item: {
        groupId: string;
        keepFirstItem?: boolean;
    };
    nest_group_in_group: {
        childGroupId: string;
        parentGroupId: string;
        position?: number;
    };
    unnest_group: {
        groupId: string;
    };
    balance_weights: {
        poolIndex: number;
        targetTotal?: number;
    };
    conditional_loot: {
        condition: {
            type: "pool_empty" | "item_count" | "group_exists";
            poolIndex?: number;
            itemId?: string;
            groupId?: string;
            count?: number;
        };
        thenAction: any;
        elseAction?: any;
    };
}

export type LootTableAction = {
    [K in keyof LootTableActions]: LootTableActions[K] & { type: `loot_table.${K}` };
}[keyof LootTableActions];
