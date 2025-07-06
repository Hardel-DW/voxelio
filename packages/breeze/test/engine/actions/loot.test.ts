import { updateData } from "@/core/engine/actions";
import type { LootTableAction } from "@/core/engine/actions/domains/loot_table/types";
import type { LootTableProps } from "@/core/schema/loot/types";
import { describe, it, expect, beforeEach } from "vitest";

// Helper function to update loot table data with proper typing
async function updateLootTable(action: any, lootTable: LootTableProps, packVersion = 48): Promise<LootTableProps> {
    const result = await updateData(action, lootTable, packVersion);
    expect(result).toBeDefined();
    return result as LootTableProps;
}

// Helper function to create mock loot table elements
function createMockLootTable(overrides: Partial<LootTableProps> = {}): LootTableProps {
    return {
        identifier: { namespace: "test", registry: "loot_table", resource: "test_loot" },
        type: "minecraft:entity",
        items: [
            {
                id: "item_0",
                name: "minecraft:experience_bottle",
                weight: 1,
                quality: 0,
                poolIndex: 0,
                entryIndex: 0,
                entryType: "minecraft:item",
                conditions: [],
                functions: []
            }
        ],
        disabled: false,
        groups: [],
        pools: [
            {
                poolIndex: 0,
                rolls: 1,
                unknownFields: {}
            }
        ],
        ...overrides
    };
}

function createComplexLootTable(): LootTableProps {
    return {
        identifier: { namespace: "test", registry: "loot_table", resource: "complex_loot" },
        type: "minecraft:chest",
        disabled: false,
        items: [
            {
                id: "item_0",
                name: "minecraft:diamond",
                weight: 1,
                quality: 10,
                poolIndex: 0,
                entryIndex: 0,
                entryType: "minecraft:item",
                conditions: [{ condition: "minecraft:random_chance", chance: 0.1 }],
                functions: [{ function: "minecraft:set_count", count: { min: 1, max: 3 } }]
            },
            {
                id: "item_1",
                name: "minecraft:emerald",
                weight: 5,
                quality: 5,
                poolIndex: 0,
                entryIndex: 1,
                entryType: "minecraft:item",
                conditions: [],
                functions: []
            },
            {
                id: "item_2",
                name: "minecraft:gold_ingot",
                weight: 10,
                quality: 0,
                poolIndex: 1,
                entryIndex: 0,
                entryType: "minecraft:item",
                conditions: [],
                functions: []
            }
        ],
        groups: [
            {
                id: "group_0",
                type: "alternatives",
                items: ["item_0", "item_1"],
                poolIndex: 0,
                entryIndex: 2,
                conditions: [],
                functions: []
            }
        ],
        pools: [
            {
                poolIndex: 0,
                rolls: { min: 1, max: 3 },
                bonus_rolls: 0,
                unknownFields: {}
            },
            {
                poolIndex: 1,
                rolls: 1,
                unknownFields: {}
            }
        ]
    };
}

describe("Loot Table Actions", () => {
    let mockLootTable: LootTableProps;
    let complexLootTable: LootTableProps;

    beforeEach(() => {
        mockLootTable = createMockLootTable();
        complexLootTable = createComplexLootTable();
    });

    describe("Loot Table Domain Actions", () => {
        describe("add_loot_item", () => {
            it("should add item to existing pool", async () => {
                // Vérifie l'état initial
                expect(mockLootTable.items).toHaveLength(1);

                const action: LootTableAction = {
                    type: "loot_table.add_loot_item",
                    poolIndex: 0,
                    item: {
                        name: "minecraft:diamond",
                        weight: 10,
                        quality: 5
                    }
                };

                const result = await updateLootTable(action, mockLootTable);
                expect(result.items).toHaveLength(2);

                const newItem = result.items[1];
                expect(newItem.name).toBe("minecraft:diamond");
                expect(newItem.weight).toBe(10);
                expect(newItem.quality).toBe(5);
                expect(newItem.poolIndex).toBe(0);
                expect(newItem.id).toBeDefined();

                // Vérifie que l'objet original n'a pas changé
                expect(mockLootTable.items).toHaveLength(1);
                expect(result).not.toBe(mockLootTable);
            });

            it("should add item to new pool", async () => {
                const action: LootTableAction = {
                    type: "loot_table.add_loot_item",
                    poolIndex: 1, // Nouveau pool
                    item: {
                        name: "minecraft:emerald",
                        weight: 5
                    }
                };

                const result = await updateLootTable(action, mockLootTable);
                expect(result.items).toHaveLength(2);

                const newItem = result.items[1];
                expect(newItem.poolIndex).toBe(1);
                expect(newItem.entryIndex).toBe(0); // Premier dans le nouveau pool
            });

            it("should add item with conditions and functions", async () => {
                const action: LootTableAction = {
                    type: "loot_table.add_loot_item",
                    poolIndex: 0,
                    item: {
                        name: "minecraft:netherite_ingot",
                        weight: 1,
                        quality: 15,
                        conditions: ["minecraft:killed_by_player"],
                        functions: ["minecraft:enchant_randomly"]
                    }
                };

                const result = await updateLootTable(action, mockLootTable);
                const newItem = result.items[1];

                expect(newItem.conditions).toContain("minecraft:killed_by_player");
                expect(newItem.functions).toContain("minecraft:enchant_randomly");
            });
        });

        describe("remove_loot_item", () => {
            it("should remove existing item", async () => {
                // Vérifie l'état initial
                expect(mockLootTable.items).toHaveLength(1);
                expect(mockLootTable.items[0].id).toBe("item_0");

                const action: LootTableAction = {
                    type: "loot_table.remove_loot_item",
                    itemId: "item_0"
                };

                const result = await updateLootTable(action, mockLootTable);
                expect(result.items).toHaveLength(0);

                // Vérifie que l'objet original n'a pas changé
                expect(mockLootTable.items).toHaveLength(1);
                expect(result).not.toBe(mockLootTable);
            });

            it("should handle removing non-existent item gracefully", async () => {
                const action: LootTableAction = {
                    type: "loot_table.remove_loot_item",
                    itemId: "non_existent"
                };

                const result = await updateLootTable(action, mockLootTable);
                expect(result.items).toHaveLength(1); // Pas de changement
                expect(result.items[0].id).toBe("item_0");
            });
        });

        describe("modify_loot_item", () => {
            it("should modify item weight", async () => {
                // Vérifie l'état initial
                expect(mockLootTable.items[0].weight).toBe(1);

                const action: LootTableAction = {
                    type: "loot_table.modify_loot_item",
                    itemId: "item_0",
                    property: "weight",
                    value: 50
                };

                const result = await updateLootTable(action, mockLootTable);
                expect(result.items[0].weight).toBe(50);

                // Vérifie que l'objet original n'a pas changé
                expect(mockLootTable.items[0].weight).toBe(1);
                expect(result).not.toBe(mockLootTable);
            });

            it("should modify item quality", async () => {
                const action: LootTableAction = {
                    type: "loot_table.modify_loot_item",
                    itemId: "item_0",
                    property: "quality",
                    value: 15
                };

                const result = await updateLootTable(action, mockLootTable);
                expect(result.items[0].quality).toBe(15);
            });

            it("should modify item name", async () => {
                const action: LootTableAction = {
                    type: "loot_table.modify_loot_item",
                    itemId: "item_0",
                    property: "name",
                    value: "minecraft:diamond_sword"
                };

                const result = await updateLootTable(action, mockLootTable);
                expect(result.items[0].name).toBe("minecraft:diamond_sword");
            });
        });

        describe("create_loot_group", () => {
            it("should create alternatives group", async () => {
                // D'abord ajouter un item pour avoir deux items à grouper
                const addAction: LootTableAction = {
                    type: "loot_table.add_loot_item",
                    poolIndex: 0,
                    item: { name: "minecraft:emerald", weight: 5 }
                };

                let result = await updateLootTable(addAction, mockLootTable);
                expect(result.items).toHaveLength(2);

                const groupAction: LootTableAction = {
                    type: "loot_table.create_loot_group",
                    groupType: "alternatives",
                    itemIds: ["item_0", result.items[1].id],
                    poolIndex: 0
                };

                result = await updateLootTable(groupAction, result);
                expect(result.groups).toHaveLength(1);

                const group = result.groups[0];
                expect(group.type).toBe("alternatives");
                expect(group.items).toHaveLength(2);
                expect(group.poolIndex).toBe(0);
                expect(group.id).toBeDefined();
            });

            it("should create sequence group", async () => {
                const action: LootTableAction = {
                    type: "loot_table.create_loot_group",
                    groupType: "sequence",
                    itemIds: ["item_0"],
                    poolIndex: 0
                };

                const result = await updateLootTable(action, mockLootTable);
                expect(result.groups).toHaveLength(1);
                expect(result.groups[0].type).toBe("sequence");
            });

            it("should create group at specific entry index", async () => {
                const action: LootTableAction = {
                    type: "loot_table.create_loot_group",
                    groupType: "group",
                    itemIds: ["item_0"],
                    poolIndex: 0,
                    entryIndex: 5
                };

                const result = await updateLootTable(action, mockLootTable);
                expect(result.groups[0].entryIndex).toBe(5);
            });
        });

        describe("dissolve_loot_group", () => {
            it("should dissolve existing group", async () => {
                // Utiliser le complexLootTable qui a déjà un groupe
                expect(complexLootTable.groups).toHaveLength(1);
                expect(complexLootTable.groups[0].id).toBe("group_0");

                const action: LootTableAction = {
                    type: "loot_table.dissolve_loot_group",
                    groupId: "group_0"
                };

                const result = await updateLootTable(action, complexLootTable);
                expect(result.groups).toHaveLength(0);

                // Vérifie que l'objet original n'a pas changé
                expect(complexLootTable.groups).toHaveLength(1);
                expect(result).not.toBe(complexLootTable);
            });

            it("should handle dissolving non-existent group gracefully", async () => {
                const action: LootTableAction = {
                    type: "loot_table.dissolve_loot_group",
                    groupId: "non_existent"
                };

                const result = await updateLootTable(action, mockLootTable);
                expect(result.groups).toHaveLength(0); // Pas de changement
            });
        });

        describe("move_item_between_pools", () => {
            it("should move item to different pool", async () => {
                // Utiliser complexLootTable qui a des items dans différents pools
                expect(complexLootTable.items[2].poolIndex).toBe(1);

                const action: LootTableAction = {
                    type: "loot_table.move_item_between_pools",
                    itemId: "item_2",
                    targetPoolIndex: 0
                };

                const result = await updateLootTable(action, complexLootTable);
                const movedItem = result.items.find((item) => item.id === "item_2");
                expect(movedItem?.poolIndex).toBe(0);

                // Vérifie que l'objet original n'a pas changé
                expect(complexLootTable.items[2].poolIndex).toBe(1);
                expect(result).not.toBe(complexLootTable);
            });

            it("should handle moving to same pool gracefully", async () => {
                const action: LootTableAction = {
                    type: "loot_table.move_item_between_pools",
                    itemId: "item_0",
                    targetPoolIndex: 0 // Même pool
                };

                const result = await updateLootTable(action, complexLootTable);
                const item = result.items.find((item) => item.id === "item_0");
                expect(item?.poolIndex).toBe(0); // Pas de changement
            });
        });

        describe("duplicate_loot_item", () => {
            it("should duplicate item in same pool", async () => {
                expect(mockLootTable.items).toHaveLength(1);

                const action: LootTableAction = {
                    type: "loot_table.duplicate_loot_item",
                    itemId: "item_0"
                };

                const result = await updateLootTable(action, mockLootTable);
                expect(result.items).toHaveLength(2);

                const original = result.items[0];
                const duplicate = result.items[1];

                expect(original.name).toBe(duplicate.name);
                expect(original.weight).toBe(duplicate.weight);
                expect(original.poolIndex).toBe(duplicate.poolIndex);
                expect(original.id).not.toBe(duplicate.id); // ID différent
            });

            it("should duplicate item to different pool", async () => {
                const action: LootTableAction = {
                    type: "loot_table.duplicate_loot_item",
                    itemId: "item_0",
                    targetPoolIndex: 1
                };

                const result = await updateLootTable(action, mockLootTable);
                expect(result.items).toHaveLength(2);

                const duplicate = result.items[1];
                expect(duplicate.poolIndex).toBe(1);
                expect(duplicate.entryIndex).toBe(0); // Premier dans le nouveau pool
            });
        });

        describe("bulk_modify_items", () => {
            it("should multiply weights of multiple items", async () => {
                const action: LootTableAction = {
                    type: "loot_table.bulk_modify_items",
                    itemIds: ["item_0", "item_1"],
                    property: "weight",
                    operation: "multiply",
                    value: 2
                };

                const result = await updateLootTable(action, complexLootTable);

                const item0 = result.items.find((item) => item.id === "item_0");
                const item1 = result.items.find((item) => item.id === "item_1");

                expect(item0?.weight).toBe(2); // 1 * 2
                expect(item1?.weight).toBe(10); // 5 * 2
            });

            it("should add to quality of multiple items", async () => {
                const action: LootTableAction = {
                    type: "loot_table.bulk_modify_items",
                    itemIds: ["item_0", "item_1"],
                    property: "quality",
                    operation: "add",
                    value: 5
                };

                const result = await updateLootTable(action, complexLootTable);

                const item0 = result.items.find((item) => item.id === "item_0");
                const item1 = result.items.find((item) => item.id === "item_1");

                expect(item0?.quality).toBe(15); // 10 + 5
                expect(item1?.quality).toBe(10); // 5 + 5
            });

            it("should set weight of multiple items", async () => {
                const action: LootTableAction = {
                    type: "loot_table.bulk_modify_items",
                    itemIds: ["item_0", "item_1", "item_2"],
                    property: "weight",
                    operation: "set",
                    value: 25
                };

                const result = await updateLootTable(action, complexLootTable);

                const items = result.items.filter((item) => ["item_0", "item_1", "item_2"].includes(item.id));
                for (const item of items) {
                    expect(item.weight).toBe(25);
                }
            });
        });
    });

    describe("Complex Loot Operations", () => {
        it("should handle sequential loot modifications", async () => {
            const sequentialAction = {
                type: "core.sequential",
                actions: [
                    {
                        type: "loot_table.add_loot_item",
                        poolIndex: 0,
                        item: { name: "minecraft:diamond", weight: 1 }
                    },
                    {
                        type: "loot_table.create_loot_group",
                        groupType: "alternatives",
                        itemIds: ["item_0"], // L'ID sera résolu dynamiquement
                        poolIndex: 0
                    },
                    {
                        type: "loot_table.modify_loot_item",
                        itemId: "item_0",
                        property: "weight",
                        value: 100
                    }
                ]
            };

            const result = await updateLootTable(sequentialAction, mockLootTable);
            expect(result.items).toHaveLength(2); // Original + nouveau
            expect(result.groups).toHaveLength(1); // Nouveau groupe
            expect(result.items[0].weight).toBe(100); // Modifié

            // Vérifie que l'objet original n'a pas changé
            expect(mockLootTable.items).toHaveLength(1);
            expect(mockLootTable.groups).toHaveLength(0);
            expect(mockLootTable.items[0].weight).toBe(1);
            expect(result).not.toBe(mockLootTable);
        });

        it("should preserve identifier through loot actions", async () => {
            const action: LootTableAction = {
                type: "loot_table.add_loot_item",
                poolIndex: 0,
                item: { name: "minecraft:coal" }
            };

            const result = await updateLootTable(action, mockLootTable);
            expect(result.identifier).toBeDefined();
            expect(mockLootTable.identifier).toEqual(result.identifier);
        });

        it("should handle complex group operations", async () => {
            // Créer plusieurs groupes imbriqués
            const complexGroupAction = {
                type: "core.sequential",
                actions: [
                    // Ajouter plus d'items
                    {
                        type: "loot_table.add_loot_item",
                        poolIndex: 0,
                        item: { name: "minecraft:iron_ingot", weight: 15 }
                    },
                    {
                        type: "loot_table.add_loot_item",
                        poolIndex: 0,
                        item: { name: "minecraft:copper_ingot", weight: 20 }
                    },
                    // Créer un groupe alternatives avec les nouveaux items
                    {
                        type: "loot_table.create_loot_group",
                        groupType: "alternatives",
                        itemIds: [], // Sera rempli par le handler
                        poolIndex: 0
                    },
                    // Dupliquer un item
                    {
                        type: "loot_table.duplicate_loot_item",
                        itemId: "item_0",
                        targetPoolIndex: 1
                    }
                ]
            };

            const result = await updateLootTable(complexGroupAction, mockLootTable);
            expect(result.items.length).toBeGreaterThan(mockLootTable.items.length);

            // Vérifie que l'item dupliqué est dans le pool 1
            const duplicatedItem = result.items.find((item) => item.poolIndex === 1 && item.name === "minecraft:experience_bottle");
            expect(duplicatedItem).toBeDefined();
        });
    });

    describe("Error Handling", () => {
        it("should handle invalid item IDs gracefully", async () => {
            const action: LootTableAction = {
                type: "loot_table.modify_loot_item",
                itemId: "invalid_id",
                property: "weight",
                value: 50
            };

            const result = await updateLootTable(action, mockLootTable);
            expect(result.items).toEqual(mockLootTable.items); // Pas de changement
        });

        it("should handle invalid group IDs gracefully", async () => {
            const action: LootTableAction = {
                type: "loot_table.dissolve_loot_group",
                groupId: "invalid_group"
            };

            const result = await updateLootTable(action, mockLootTable);
            expect(result.groups).toEqual(mockLootTable.groups); // Pas de changement
        });

        it("should handle negative pool indices", async () => {
            const action: LootTableAction = {
                type: "loot_table.add_loot_item",
                poolIndex: -1,
                item: { name: "minecraft:dirt" }
            };

            // L'action devrait soit échouer gracieusement, soit normaliser l'index
            const result = await updateLootTable(action, mockLootTable);
            expect(result).toBeDefined();
        });
    });
});
