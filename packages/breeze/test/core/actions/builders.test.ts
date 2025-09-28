import { updateData } from "@/core/engine/actions";
import { CoreActions } from "@/core/engine/actions/domains/core/actions";
import { RecipeActions } from "@/core/engine/actions/domains/recipe/actions";
import { LootTableActions } from "@/core/engine/actions/domains/loot_table/actions";
import type { LootTableProps } from "@/core/schema/loot/types";
import type { RecipeProps } from "@/core/schema/recipe/types";
import { describe, it, expect } from "vitest";

describe("Core Actions", () => {
    it("creates and executes a setValue action", async () => {
        const element = { foo: 1 };
        const action = CoreActions.setValue("foo", 42);
        const result = await updateData(action, element, 48);
        expect(result?.foo).toBe(42);
    });

    it("supports sequential execution with instances", async () => {
        const element = { a: 0, b: 0 };
        const sequence = CoreActions.sequential(
            CoreActions.setValue("a", 1),
            CoreActions.setValue("b", 2)
        );
        const result = await updateData(sequence, element, 48);
        expect(result).toEqual({ a: 1, b: 2 });
    });
});

describe("Recipe Actions", () => {
    const baseRecipe: RecipeProps = {
        type: "minecraft:crafting_shaped",
        slots: {},
        identifier: { namespace: "test", registry: "recipe", resource: "foo" }
    } as RecipeProps;

    it("adds an ingredient", async () => {
        const action = RecipeActions.addIngredient("0", ["minecraft:stone"], true);
        const result = await updateData(action, baseRecipe, 48);
        expect(result?.slots?.["0"]).toEqual(["minecraft:stone"]);
    });
});

describe("Loot Table Actions", () => {
    const baseLoot: LootTableProps = {
        disabled: false,
        pools: [],
        items: [],
        groups: [],
        functions: [],
        conditions: [],
        identifier: { namespace: "test", registry: "loot_table", resource: "foo" }
    } as LootTableProps;

    it("adds a loot item", async () => {
        const action = LootTableActions.addLootItem({
            poolIndex: 0,
            item: { name: "minecraft:apple" }
        });
        const result = await updateData(action, baseLoot, 48);
        expect(result?.items).toHaveLength(1);
        expect(result?.items?.[0].name).toBe("minecraft:apple");
    });
});
