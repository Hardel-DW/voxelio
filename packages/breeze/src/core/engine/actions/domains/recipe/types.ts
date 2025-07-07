import { type AllExpectedHandlerKeys, type ValidateHandlerRegistry, createHandlers } from "../../types";

export interface RecipeActions {
	add_ingredient: {
		slot: string;
		items: string[];
		replace?: boolean;
	};
	add_shapeless_ingredient: {
		items: string | string[];
	};
	remove_ingredient: {
		slot: string;
		items?: string[];
	};
	remove_item_everywhere: {
		items: string[];
	};
	replace_item_everywhere: {
		from: string;
		to: string;
	};
	convert_recipe_type: {
		newType: string;
		preserveIngredients?: boolean;
	};
	clear_slot: {
		slot: string;
	};
}

export type RecipeAction = {
	[K in keyof RecipeActions]: RecipeActions[K] & { type: `recipe.${K}` };
}[keyof RecipeActions];

export type RecipeHandlerKeys = AllExpectedHandlerKeys<"recipe", RecipeActions>;
export const createRecipeHandlers = <T extends Record<RecipeHandlerKeys, any>>(
	handlers: ValidateHandlerRegistry<T, RecipeHandlerKeys>
): T => createHandlers(handlers);
