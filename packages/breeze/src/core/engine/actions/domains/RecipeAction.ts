import type { RecipeProps, RecipeType } from "@/core/schema/recipe/types";
import type { ActionJsonFromClasses } from "@/core/engine/actions/domain";
import { EngineAction } from "@/core/engine/actions/EngineAction";

abstract class RecipeEngineAction<TPayload extends Record<string, unknown>> extends EngineAction<TPayload> {
	protected clone(element: Record<string, unknown>): RecipeProps {
		return structuredClone(element) as RecipeProps;
	}
}

type AddIngredientPayload = { slot: string; items: string[]; replace?: boolean };

export class AddIngredientAction extends RecipeEngineAction<AddIngredientPayload> {
	static readonly type = "recipe.add_ingredient" as const;
	readonly type = AddIngredientAction.type;

	static create(slot: string, items: string[], replace = false): AddIngredientAction {
		return new AddIngredientAction({ slot, items, replace });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const recipe = this.clone(element);
		if (recipe.type === "minecraft:crafting_shapeless") return recipe;

		const { slot, items, replace } = this.payload;
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

type AddShapelessIngredientPayload = { items: string | string[] };

export class AddShapelessIngredientAction extends RecipeEngineAction<AddShapelessIngredientPayload> {
	static readonly type = "recipe.add_shapeless_ingredient" as const;
	readonly type = AddShapelessIngredientAction.type;

	static create(items: string | string[]): AddShapelessIngredientAction {
		return new AddShapelessIngredientAction({ items });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const recipe = this.clone(element);
		if (recipe.type !== "minecraft:crafting_shapeless") return recipe;

		const nextSlot = Object.keys(recipe.slots).length.toString();
		recipe.slots[nextSlot] = this.payload.items;
		return recipe;
	}
}

type RemoveIngredientPayload = { slot: string; items?: string[] };

export class RemoveIngredientAction extends RecipeEngineAction<RemoveIngredientPayload> {
	static readonly type = "recipe.remove_ingredient" as const;
	readonly type = RemoveIngredientAction.type;

	static create(slot: string, items?: string[]): RemoveIngredientAction {
		return new RemoveIngredientAction({ slot, items });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const recipe = this.clone(element);
		const { slot, items } = this.payload;
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

type RemoveItemEverywherePayload = { items: string[] };

export class RemoveItemEverywhereAction extends RecipeEngineAction<RemoveItemEverywherePayload> {
	static readonly type = "recipe.remove_item_everywhere" as const;
	readonly type = RemoveItemEverywhereAction.type;

	static create(items: string[]): RemoveItemEverywhereAction {
		return new RemoveItemEverywhereAction({ items });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const recipe = this.clone(element);
		const toRemove = new Set(this.payload.items);

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

type ReplaceItemEverywherePayload = { from: string; to: string };

export class ReplaceItemEverywhereAction extends RecipeEngineAction<ReplaceItemEverywherePayload> {
	static readonly type = "recipe.replace_item_everywhere" as const;
	readonly type = ReplaceItemEverywhereAction.type;

	static create(from: string, to: string): ReplaceItemEverywhereAction {
		return new ReplaceItemEverywhereAction({ from, to });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const recipe = this.clone(element);
		const { from, to } = this.payload;

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

type ClearSlotPayload = { slot: string };

export class ClearSlotAction extends RecipeEngineAction<ClearSlotPayload> {
	static readonly type = "recipe.clear_slot" as const;
	readonly type = ClearSlotAction.type;

	static create(slot: string): ClearSlotAction {
		return new ClearSlotAction({ slot });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const recipe = this.clone(element);
		delete recipe.slots[this.payload.slot];
		return recipe;
	}
}

type ConvertRecipeTypePayload = { newType: string; preserveIngredients?: boolean };

export class ConvertRecipeTypeAction extends RecipeEngineAction<ConvertRecipeTypePayload> {
	static readonly type = "recipe.convert_recipe_type" as const;
	readonly type = ConvertRecipeTypeAction.type;

	static create(newType: string, preserveIngredients = true): ConvertRecipeTypeAction {
		return new ConvertRecipeTypeAction({ newType, preserveIngredients });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const recipe = this.clone(element);
		const { newType, preserveIngredients = true } = this.payload;
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

export const RECIPE_ACTION_CLASSES = [
	AddIngredientAction,
	AddShapelessIngredientAction,
	RemoveIngredientAction,
	RemoveItemEverywhereAction,
	ReplaceItemEverywhereAction,
	ConvertRecipeTypeAction,
	ClearSlotAction
] as const;

export type RecipeAction = ActionJsonFromClasses<typeof RECIPE_ACTION_CLASSES>;

export const RecipeActions = {
	addIngredient: (slot: string, items: string[], replace = false) => AddIngredientAction.create(slot, items, replace),
	addShapelessIngredient: (items: string | string[]) => AddShapelessIngredientAction.create(items),
	removeIngredient: (slot: string, items?: string[]) => RemoveIngredientAction.create(slot, items),
	removeItemEverywhere: (items: string[]) => RemoveItemEverywhereAction.create(items),
	replaceItemEverywhere: (from: string, to: string) => ReplaceItemEverywhereAction.create(from, to),
	clearSlot: (slot: string) => ClearSlotAction.create(slot),
	convertType: (newType: string, preserveIngredients = true) => ConvertRecipeTypeAction.create(newType, preserveIngredients)
};
