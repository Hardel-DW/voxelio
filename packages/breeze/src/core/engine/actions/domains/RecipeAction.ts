import type { RecipeProps, RecipeType } from "@/core/schema/recipe/types";
import { Action } from "@/core/engine/actions/Action";

export class AddIngredientAction extends Action<{ slot: string; items: string[]; replace?: boolean }> {
	readonly type = "recipe.add_ingredient" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const recipe = structuredClone(element) as RecipeProps;
		if (recipe.type === "minecraft:crafting_shapeless") return recipe;

		const { slot, items, replace } = this.params;
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

export class AddShapelessIngredientAction extends Action<{ items: string | string[] }> {
	readonly type = "recipe.add_shapeless_ingredient" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const recipe = structuredClone(element) as RecipeProps;
		if (recipe.type !== "minecraft:crafting_shapeless") return recipe;

		const nextSlot = Object.keys(recipe.slots).length.toString();
		recipe.slots[nextSlot] = this.params.items;
		return recipe;
	}
}

export class RemoveIngredientAction extends Action<{ slot: string; items?: string[] }> {
	readonly type = "recipe.remove_ingredient" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const recipe = structuredClone(element) as RecipeProps;
		const { slot, items } = this.params;
		const content = recipe.slots[slot];
		if (!content) return recipe;

		if (!items) {
			delete recipe.slots[slot];
			return recipe;
		}

		const existing = Array.isArray(content) ? content : [content];
		const filtered = existing.filter((item) => !items.includes(item));
		if (filtered.length === 0) delete recipe.slots[slot];
		else recipe.slots[slot] = filtered;
		return recipe;
	}
}

export class RemoveItemEverywhereAction extends Action<{ items: string[] }> {
	readonly type = "recipe.remove_item_everywhere" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const recipe = structuredClone(element) as RecipeProps;
		const toRemove = new Set(this.params.items);

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

export class ReplaceItemEverywhereAction extends Action<{ from: string; to: string }> {
	readonly type = "recipe.replace_item_everywhere" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const recipe = structuredClone(element) as RecipeProps;
		const { from, to } = this.params;

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

export class ClearSlotAction extends Action<{ slot: string }> {
	readonly type = "recipe.clear_slot" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const recipe = structuredClone(element) as RecipeProps;
		delete recipe.slots[this.params.slot];
		return recipe;
	}
}

export class ConvertRecipeTypeAction extends Action<{ newType: string; preserveIngredients?: boolean }> {
	readonly type = "recipe.convert_recipe_type" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const recipe = structuredClone(element) as RecipeProps;
		const { newType, preserveIngredients = true } = this.params;
		recipe.type = newType as RecipeType;
		if (!preserveIngredients) return recipe;

		const firstSlot = Object.values(recipe.slots).find(
			(content) => content && (typeof content === "string" || (Array.isArray(content) && content.length > 0))
		);

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
				recipe.slots = firstSlot ? { "0": Array.isArray(firstSlot) ? [firstSlot[0]] : firstSlot } : {};
				recipe.gridSize = undefined;
				break;
			case "minecraft:stonecutting":
				recipe.slots = firstSlot ? { "0": Array.isArray(firstSlot) ? [firstSlot[0]] : firstSlot } : {};
				recipe.gridSize = undefined;
				recipe.typeSpecific = undefined;
				break;
		}

		return recipe;
	}
}

// Liste des classes d'actions Recipe - ajouter ici pour créer une nouvelle action
export const RECIPE_ACTION_CLASSES = [
	AddIngredientAction,
	AddShapelessIngredientAction,
	RemoveIngredientAction,
	RemoveItemEverywhereAction,
	ReplaceItemEverywhereAction,
	ClearSlotAction,
	ConvertRecipeTypeAction
] as const;
