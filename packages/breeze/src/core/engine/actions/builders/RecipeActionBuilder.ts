import type { RecipeAction } from "../domains/recipe/types";
import { ActionBuilder } from "./ActionBuilder";

/**
 * Builder for recipe actions with fluent API
 */
export class RecipeActionBuilder extends ActionBuilder<RecipeAction> {
	/**
	 * Add ingredients to a slot
	 */
	addIngredient(slot: string): AddIngredientBuilder {
		return new AddIngredientBuilder(slot);
	}

	/**
	 * Add ingredient to shapeless recipe
	 */
	addShapelessIngredient(): AddShapelessIngredientBuilder {
		return new AddShapelessIngredientBuilder();
	}

	/**
	 * Remove ingredients from a slot
	 */
	removeIngredient(slot: string): RemoveIngredientBuilder {
		return new RemoveIngredientBuilder(slot);
	}

	/**
	 * Remove items from all slots in recipe
	 */
	removeItemEverywhere(): RemoveItemEverywhereBuilder {
		return new RemoveItemEverywhereBuilder();
	}

	/**
	 * Replace item everywhere in recipe
	 */
	replaceItemEverywhere(from: string): ReplaceItemEverywhereBuilder {
		return new ReplaceItemEverywhereBuilder(from);
	}

	/**
	 * Clear a slot completely
	 */
	clearSlot(slot: string): ClearSlotBuilder {
		return new ClearSlotBuilder(slot);
	}

	/**
	 * Convert recipe to a different type
	 */
	convertType(newType: string): ConvertRecipeTypeBuilder {
		return new ConvertRecipeTypeBuilder(newType);
	}

	build(): RecipeAction {
		throw new Error("Use specific builder methods to create actions");
	}
}

class AddIngredientBuilder extends ActionBuilder<Extract<RecipeAction, { type: "recipe.add_ingredient" }>> {
	private itemsList: string[] = [];
	private replace = false;

	constructor(private slot: string) {
		super();
	}

	/**
	 * Add items to the slot
	 */
	items(...items: string[]): this {
		this.itemsList.push(...items);
		return this;
	}

	/**
	 * Replace existing items instead of adding to them
	 */
	replaceExisting(): this {
		this.replace = true;
		return this;
	}

	build() {
		if (this.itemsList.length === 0) {
			throw new Error("At least one item must be specified");
		}

		return {
			type: "recipe.add_ingredient" as const,
			slot: this.slot,
			items: this.itemsList,
			...(this.replace && { replace: this.replace })
		};
	}
}

class AddShapelessIngredientBuilder extends ActionBuilder<Extract<RecipeAction, { type: "recipe.add_shapeless_ingredient" }>> {
	private itemsValue?: string | string[];
	/**
	 * Set tag (string) to add
	 */
	tag(tag: string): this {
		this.itemsValue = tag;
		return this;
	}

	/**
	 * Set items (string[]) to add
	 */
	items(...items: string[]): this {
		this.itemsValue = items;
		return this;
	}

	build() {
		if (!this.itemsValue) {
			throw new Error("Items or tag must be specified");
		}

		return {
			type: "recipe.add_shapeless_ingredient" as const,
			items: this.itemsValue
		};
	}
}

class RemoveIngredientBuilder extends ActionBuilder<Extract<RecipeAction, { type: "recipe.remove_ingredient" }>> {
	private itemsList?: string[];

	constructor(private slot: string) {
		super();
	}

	/**
	 * Specify which items to remove (if not specified, removes all)
	 */
	items(...items: string[]): this {
		this.itemsList = items;
		return this;
	}

	build() {
		return {
			type: "recipe.remove_ingredient" as const,
			slot: this.slot,
			...(this.itemsList && { items: this.itemsList })
		};
	}
}

class RemoveItemEverywhereBuilder extends ActionBuilder<Extract<RecipeAction, { type: "recipe.remove_item_everywhere" }>> {
	private itemsList: string[] = [];

	/**
	 * Items to remove from all slots
	 */
	items(...items: string[]): this {
		this.itemsList.push(...items);
		return this;
	}

	build() {
		if (this.itemsList.length === 0) {
			throw new Error("At least one item must be specified");
		}

		return {
			type: "recipe.remove_item_everywhere" as const,
			items: this.itemsList
		};
	}
}

class ReplaceItemEverywhereBuilder extends ActionBuilder<Extract<RecipeAction, { type: "recipe.replace_item_everywhere" }>> {
	private toValue?: string;

	constructor(private from: string) {
		super();
	}

	/**
	 * Item/tag to replace with
	 */
	with(to: string): this {
		this.toValue = to;
		return this;
	}

	build() {
		if (!this.toValue) {
			throw new Error("Replacement item must be specified using .with()");
		}

		return {
			type: "recipe.replace_item_everywhere" as const,
			from: this.from,
			to: this.toValue
		};
	}
}

class ClearSlotBuilder extends ActionBuilder<Extract<RecipeAction, { type: "recipe.clear_slot" }>> {
	constructor(private slot: string) {
		super();
	}

	build() {
		return {
			type: "recipe.clear_slot" as const,
			slot: this.slot
		};
	}
}

class ConvertRecipeTypeBuilder extends ActionBuilder<Extract<RecipeAction, { type: "recipe.convert_recipe_type" }>> {
	private preserveIngredients = true;

	constructor(private newType: string) {
		super();
	}

	/**
	 * Don't preserve ingredients when converting
	 */
	clearIngredients(): this {
		this.preserveIngredients = false;
		return this;
	}

	build() {
		return {
			type: "recipe.convert_recipe_type" as const,
			newType: this.newType,
			...(this.preserveIngredients !== true && { preserveIngredients: this.preserveIngredients })
		};
	}
}
