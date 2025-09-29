import type { RecipeProps, RecipeType } from "@/core/schema/recipe/types";
import { Action } from "@/core/engine/actions/index";

export class RecipeAction<P = any> extends Action<P> {
	constructor(
		params: P,
		private applyFn: (element: Record<string, unknown>, params: P) => Record<string, unknown>
	) {
		super(params);
	}

	apply(element: Record<string, unknown>): Record<string, unknown> {
		return this.applyFn(element, this.params);
	}

	static addIngredient(slot: string, items: string[], replace?: boolean) {
		return new RecipeAction({ slot, items, replace }, (el, p: { slot: string; items: string[]; replace?: boolean }) => {
			const recipe = structuredClone(el) as RecipeProps;
			if (recipe.type === "minecraft:crafting_shapeless") return recipe;

			if (p.replace || !recipe.slots[p.slot]) {
				recipe.slots[p.slot] = p.items;
			} else {
				const existing = Array.isArray(recipe.slots[p.slot]) ? recipe.slots[p.slot] : [recipe.slots[p.slot]];
				const existingSet = new Set(existing as string[]);
				recipe.slots[p.slot] = [...(existing as string[]), ...p.items.filter((item) => !existingSet.has(item))];
			}

			return recipe;
		});
	}

	static addShapelessIngredient(items: string | string[]) {
		return new RecipeAction({ items }, (el, p: { items: string | string[] }) => {
			const recipe = structuredClone(el) as RecipeProps;
			if (recipe.type !== "minecraft:crafting_shapeless") return recipe;

			const nextSlot = Object.keys(recipe.slots).length.toString();
			recipe.slots[nextSlot] = p.items;
			return recipe;
		});
	}

	static removeIngredient(slot: string, items?: string[]) {
		return new RecipeAction({ slot, items }, (el, p: { slot: string; items?: string[] }) => {
			const recipe = structuredClone(el) as RecipeProps;
			const content = recipe.slots[p.slot];
			if (!content) return recipe;

			if (!p.items) {
				delete recipe.slots[p.slot];
				return recipe;
			}

			const existing = Array.isArray(content) ? content : [content];
			const filtered = existing.filter((item) => !p.items?.includes(item));
			if (filtered.length === 0) delete recipe.slots[p.slot];
			else recipe.slots[p.slot] = filtered;
			return recipe;
		});
	}

	static removeItemEverywhere(items: string[]) {
		return new RecipeAction({ items }, (el, p: { items: string[] }) => {
			const recipe = structuredClone(el) as RecipeProps;
			const toRemove = new Set(p.items);

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
		});
	}

	static replaceItemEverywhere(from: string, to: string) {
		return new RecipeAction({ from, to }, (el, p: { from: string; to: string }) => {
			const recipe = structuredClone(el) as RecipeProps;

			for (const [key, content] of Object.entries(recipe.slots)) {
				if (typeof content === "string" && content === p.from) {
					recipe.slots[key] = p.to.startsWith("#") ? p.to : [p.to];
				} else if (Array.isArray(content) && content.includes(p.from)) {
					if (p.to.startsWith("#")) {
						recipe.slots[key] = p.to;
					} else {
						const replaced = content.map((item) => (item === p.from ? p.to : item));
						recipe.slots[key] = [...new Set(replaced)];
					}
				}
			}

			return recipe;
		});
	}

	static clearSlot(slot: string) {
		return new RecipeAction({ slot }, (el, p: { slot: string }) => {
			const recipe = structuredClone(el) as RecipeProps;
			delete recipe.slots[p.slot];
			return recipe;
		});
	}

	static convertRecipeType(newType: string, preserveIngredients?: boolean) {
		return new RecipeAction({ newType, preserveIngredients }, (el, p: { newType: string; preserveIngredients?: boolean }) => {
			const recipe = structuredClone(el) as RecipeProps;
			const shouldPreserve = p.preserveIngredients ?? true;
			recipe.type = p.newType as RecipeType;
			if (!shouldPreserve) return recipe;

			const firstSlot = Object.values(recipe.slots).find(
				(content) => content && (typeof content === "string" || (Array.isArray(content) && content.length > 0))
			);

			switch (p.newType) {
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
		});
	}
}
