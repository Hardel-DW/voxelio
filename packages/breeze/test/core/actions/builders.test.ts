import { updateData } from "@/core/engine/actions";
import { CoreActions } from "@/core/engine/actions/domains/CoreAction";
import { RecipeActions } from "@/core/engine/actions/domains/RecipeAction";
import { LootTableActions } from "@/core/engine/actions/domains/LootTableAction";
import { StructureActions } from "@/core/engine/actions/domains/StructureAction";
import type { LootTableProps } from "@/core/schema/loot/types";
import type { RecipeProps } from "@/core/schema/recipe/types";
import type { StructureProps } from "@/core/schema/structure/types";
import { describe, expect, it } from "vitest";

describe("Core Actions", () => {
    it("creates and executes a setValue action", async () => {
        const element = { foo: 1 };
        const action = CoreActions.setValue("foo", 42);
        const result = await updateData(action, element, 48);
        expect(result?.foo).toBe(42);
    });
});

describe("Structure Actions", () => {
    const baseStructure: StructureProps = {
        type: "minecraft:jigsaw",
        biomes: [],
        step: "surface_structures",
        identifier: { namespace: "test", registry: "structure", resource: "foo" }
    } as StructureProps;

    it("updates jigsaw config without wrapping structure", async () => {
        const action = StructureActions.setJigsawConfig({
            startPool: "minecraft:village/plains",
            size: 2
        });
        const result = await updateData(action, baseStructure, 48);
        expect(result?.startPool).toBe("minecraft:village/plains");
        expect(result?.size).toBe(2);
        expect(result).not.toHaveProperty("structure");
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
