import type { RecipeProps, RecipeType } from "@/core/schema/recipe/types";
import type { ActionHandler } from "../../types";
import type { RecipeAction } from "./types";

export class AddIngredientHandler implements ActionHandler<RecipeAction> {
    execute(
        action: Extract<RecipeAction, { type: "recipe.add_ingredient" }>,
        element: Record<string, unknown>
    ): Record<string, unknown> | undefined {
        const recipe = structuredClone(element) as RecipeProps;
        if (recipe.type === "minecraft:crafting_shapeless") return recipe;
        const { slot, items, replace } = action;

        if (replace || !recipe.slots[slot]) {
            recipe.slots[slot] = items;
        } else {
            const existing = Array.isArray(recipe.slots[slot]) ? recipe.slots[slot] : [recipe.slots[slot]];
            const existingSet = new Set(existing);
            recipe.slots[slot] = [...existing, ...items.filter((item) => !existingSet.has(item))];
        }

        return recipe;
    }
}

export class AddShapelessIngredientHandler implements ActionHandler<RecipeAction> {
    execute(
        action: Extract<RecipeAction, { type: "recipe.add_shapeless_ingredient" }>,
        element: Record<string, unknown>
    ): Record<string, unknown> | undefined {
        const recipe = structuredClone(element) as RecipeProps;
        if (recipe.type !== "minecraft:crafting_shapeless") return recipe;
        const nextSlot = Object.keys(recipe.slots).length.toString();
        recipe.slots[nextSlot] = action.items;

        return recipe;
    }
}

export class RemoveIngredientHandler implements ActionHandler<RecipeAction> {
    execute(
        action: Extract<RecipeAction, { type: "recipe.remove_ingredient" }>,
        element: Record<string, unknown>
    ): Record<string, unknown> | undefined {
        const recipe = structuredClone(element) as RecipeProps;
        const { slot, items } = action;

        if (!recipe.slots[slot]) return recipe;

        if (!items) {
            delete recipe.slots[slot];
        } else {
            const existing = Array.isArray(recipe.slots[slot]) ? recipe.slots[slot] : [recipe.slots[slot]];
            const filtered = existing.filter((item) => !items.includes(item));
            if (filtered.length === 0) delete recipe.slots[slot];
            else recipe.slots[slot] = filtered;
        }

        return recipe;
    }
}

export class RemoveItemEverywhereHandler implements ActionHandler<RecipeAction> {
    execute(
        action: Extract<RecipeAction, { type: "recipe.remove_item_everywhere" }>,
        element: Record<string, unknown>
    ): Record<string, unknown> | undefined {
        const recipe = structuredClone(element) as RecipeProps;
        const toRemove = new Set(action.items);

        for (const [key, content] of Object.entries(recipe.slots)) {
            if (typeof content === "string") {
                if (toRemove.has(content)) delete recipe.slots[key];
            } else {
                const filtered = content.filter((item) => !toRemove.has(item));
                if (filtered.length === 0) delete recipe.slots[key];
                else recipe.slots[key] = filtered;
            }
        }

        return recipe;
    }
}

export class ReplaceItemEverywhereHandler implements ActionHandler<RecipeAction> {
    execute(
        action: Extract<RecipeAction, { type: "recipe.replace_item_everywhere" }>,
        element: Record<string, unknown>
    ): Record<string, unknown> | undefined {
        const recipe = structuredClone(element) as RecipeProps;
        const { from, to } = action;

        for (const [key, content] of Object.entries(recipe.slots)) {
            if (typeof content === "string" && content === from) {
                recipe.slots[key] = to.startsWith("#") ? to : [to];
            } else if (Array.isArray(content) && content.includes(from)) {
                if (to.startsWith("#")) {
                    recipe.slots[key] = to;
                } else {
                    const replaced = content.map((item) => (item === from ? to : item));
                    recipe.slots[key] = [...new Set(replaced)];
                }
            }
        }

        return recipe;
    }
}

export class ClearSlotHandler implements ActionHandler<RecipeAction> {
    execute(
        action: Extract<RecipeAction, { type: "recipe.clear_slot" }>,
        element: Record<string, unknown>
    ): Record<string, unknown> | undefined {
        const recipe = structuredClone(element) as RecipeProps;
        delete recipe.slots[action.slot];
        return recipe;
    }
}

export class ConvertRecipeTypeHandler implements ActionHandler<RecipeAction> {
    execute(
        action: Extract<RecipeAction, { type: "recipe.convert_recipe_type" }>,
        element: Record<string, unknown>
    ): Record<string, unknown> | undefined {
        const recipe = structuredClone(element) as RecipeProps;
        const { newType, preserveIngredients = true } = action;
        recipe.type = newType as RecipeType;
        if (!preserveIngredients) return recipe;

        const firstSlot = Object.values(recipe.slots).find((content) => content && (typeof content === "string" || content.length > 0));

        switch (newType) {
            case "minecraft:crafting_shapeless":
                recipe.gridSize = undefined;
                break;
            case "minecraft:crafting_shaped":
                recipe.gridSize ??= { width: 3, height: 3 };
                break;
            case "minecraft:smelting":
            case "minecraft:blasting":
            case "minecraft:smoking":
            case "minecraft:campfire_cooking":
                recipe.slots = firstSlot ? { "0": Array.isArray(firstSlot) && firstSlot.length > 1 ? [firstSlot[0]] : firstSlot } : {};
                recipe.gridSize = undefined;
                break;
            case "minecraft:stonecutting":
                recipe.slots = firstSlot ? { "0": Array.isArray(firstSlot) && firstSlot.length > 1 ? [firstSlot[0]] : firstSlot } : {};
                recipe.gridSize = undefined;
                recipe.typeSpecific = undefined;
                break;
        }

        return recipe;
    }
}
