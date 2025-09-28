import type { ActionLike } from "@/core/engine/actions/EngineAction";
import type { ActionJsonFromClasses } from "@/core/engine/actions/domain";
import { RECIPE_ACTION_CLASSES } from "@/core/engine/actions/domains/recipe/actions";

export { RecipeActions, RECIPE_ACTION_CLASSES } from "@/core/engine/actions/domains/recipe/actions";
export type { RecipeActionInstance } from "@/core/engine/actions/domains/recipe/actions";
export type RecipeAction = ActionJsonFromClasses<typeof RECIPE_ACTION_CLASSES>;

export function isRecipeAction(action: ActionLike): action is RecipeAction {
	return typeof action === "object" && action !== null && "type" in action && String(action.type).startsWith("recipe.");
}

export const recipeActionTypes = RECIPE_ACTION_CLASSES.map((ctor) => ctor.type) as readonly string[];
