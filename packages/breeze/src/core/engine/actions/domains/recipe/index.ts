import type { ActionHandler } from "../../types";
import {
    AddIngredientHandler,
    AddShapelessIngredientHandler,
    ClearSlotHandler,
    ConvertRecipeTypeHandler,
    RemoveIngredientHandler,
    RemoveItemEverywhereHandler,
    ReplaceItemEverywhereHandler
} from "./AddIngredientHandler";
import type { RecipeAction } from "./types";
import { createRecipeHandlers } from "./types";

export default function register(): Map<string, ActionHandler<RecipeAction>> {
    const handlerDefinitions = createRecipeHandlers({
        "recipe.add_ingredient": new AddIngredientHandler(),
        "recipe.add_shapeless_ingredient": new AddShapelessIngredientHandler(),
        "recipe.remove_ingredient": new RemoveIngredientHandler(),
        "recipe.remove_item_everywhere": new RemoveItemEverywhereHandler(),
        "recipe.replace_item_everywhere": new ReplaceItemEverywhereHandler(),
        "recipe.convert_recipe_type": new ConvertRecipeTypeHandler(),
        "recipe.clear_slot": new ClearSlotHandler()
    });

    return new Map(Object.entries(handlerDefinitions));
}
