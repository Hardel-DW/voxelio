import { Action, updateData } from "@/core/engine/actions";
import { RecipeAction } from "@/core/engine/actions/domains/RecipeAction";
import type { RecipeProps } from "@/core/schema/recipe/types";
import { describe, it, expect } from "vitest";
import { RecipeDataDrivenToVoxelFormat } from "@/core/schema/recipe/Parser";
import { originalRecipes } from "@test/mock/recipe/DataDriven";
import { VoxelToRecipeDataDriven } from "@/core/schema/recipe/Compiler";
import { CoreAction } from "@/core/engine/actions/domains/CoreAction";

// Helper function to update data with proper typing
function updateRecipe(action: Action, recipe: RecipeProps, packVersion = 48): RecipeProps {
	const result = updateData(action, recipe, packVersion);
	expect(result).toBeDefined();
	return result as RecipeProps;
}

describe("Recipe Actions", () => {
	describe("Add Ingredients Actions", () => {
		it("should add ingredient without replace", () => {
			const shaped2Recipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped2 });
			const result = updateRecipe(RecipeAction.addIngredient("1", ["minecraft:diamond"], false), shaped2Recipe);
			expect(result.slots["1"]).toContain("minecraft:diamond");
		});

		it("should add ingredient with replace", () => {
			const shaped2Recipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped2 });
			const result = updateRecipe(RecipeAction.addIngredient("1", ["minecraft:diamond"], true), shaped2Recipe);
			expect(result.slots["1"]).toEqual(["minecraft:diamond"]);
		});

		it("should avoid duplicate items when merging", () => {
			const shapedRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped });
			const recipeWithDuplicates = {
				...shapedRecipe,
				slots: { "0": ["minecraft:diamond", "minecraft:stick"] }
			};

			const result = updateRecipe(RecipeAction.addIngredient("0", ["minecraft:diamond", "minecraft:emerald"]), recipeWithDuplicates);
			expect(result.slots["0"]).toEqual(["minecraft:diamond", "minecraft:stick", "minecraft:emerald"]);
		});
	});

	describe("Add Shapeless Ingredients Actions", () => {
		it("should add ingredients to shapeless recipe", () => {
			const addDiamondAction = RecipeAction.addShapelessIngredient(["minecraft:diamond"]);
			const result = updateRecipe(addDiamondAction, RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless }));
			expect(result.slots["1"]).toEqual(["minecraft:diamond"]);
			expect(result.slots["0"]).toBe("#minecraft:acacia_logs");

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.ingredients).toHaveLength(2);
			expect(compiled.element.data.ingredients?.[0]).toEqual("#minecraft:acacia_logs");
			expect(compiled.element.data.ingredients?.[1]).toEqual("minecraft:diamond");
		});

		it("should replace ingredients in shapeless recipe", () => {
			const replaceAction = RecipeAction.addShapelessIngredient(["minecraft:diamond", "minecraft:emerald"]);
			const result = updateRecipe(replaceAction, RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless }));
			expect(result.slots["1"]).toEqual(["minecraft:diamond", "minecraft:emerald"]);

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.ingredients).toHaveLength(2);
			expect(compiled.element.data.ingredients?.[0]).toEqual("#minecraft:acacia_logs");
			expect(compiled.element.data.ingredients?.[1]).toEqual(["minecraft:diamond", "minecraft:emerald"]);
		});

		it("should remove specific ingredients from recipe", () => {
			const addAction = RecipeAction.addShapelessIngredient(["minecraft:diamond", "minecraft:emerald", "minecraft:gold_ingot"]);
			const resultWithIngredients = updateRecipe(addAction, RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless }));
			expect(resultWithIngredients.slots["1"]).toEqual(["minecraft:diamond", "minecraft:emerald", "minecraft:gold_ingot"]);

			const removeAction = RecipeAction.removeIngredient("1", ["minecraft:emerald"]);
			const result = updateRecipe(removeAction, resultWithIngredients);
			expect(result.slots["1"]).toEqual(["minecraft:diamond", "minecraft:gold_ingot"]);

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.ingredients).toHaveLength(2);
		});

		it("should clear entire slot", () => {
			const addAction = RecipeAction.addShapelessIngredient(["minecraft:diamond"]);
			const resultWithDiamond = updateRecipe(addAction, RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless }));
			expect(resultWithDiamond.slots["1"]).toEqual(["minecraft:diamond"]);

			const clearAction = RecipeAction.clearSlot("1");
			const result = updateRecipe(clearAction, resultWithDiamond);
			expect(result.slots["1"]).toBeUndefined();
			expect(result.slots["0"]).toBe("#minecraft:acacia_logs");
		});

		it("should swap ingredients between slots", () => {
			const addAction = RecipeAction.addShapelessIngredient(["minecraft:diamond"]);
			const result = updateRecipe(addAction, RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless }));
			expect(result.slots["0"]).toEqual("#minecraft:acacia_logs");
			expect(result.slots["1"]).toEqual(["minecraft:diamond"]);

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.ingredients?.[0]).toBe("#minecraft:acacia_logs");
			expect(compiled.element.data.ingredients?.[1]).toBe("minecraft:diamond");
		});

		it("should add tag to shapeless recipe", () => {
			const shapelessRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless });
			const slotsCount = Object.keys(shapelessRecipe.slots).length;

			const result = updateRecipe(RecipeAction.addShapelessIngredient("#minecraft:logs"), shapelessRecipe);
			expect(Object.keys(result.slots)).toHaveLength(slotsCount + 1);
			expect(result.slots[slotsCount.toString()]).toBe("#minecraft:logs");

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.ingredients).toHaveLength(2);
			expect(compiled.element.data.ingredients?.[1]).toBe("#minecraft:logs");
		});

		it("should ignore non-shapeless recipes", () => {
			const shapedRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped });
			const result = updateRecipe(RecipeAction.addShapelessIngredient(["minecraft:emerald"]), shapedRecipe);
			expect(result.slots).toEqual(shapedRecipe.slots);
		});

	});

	describe("Remove Ingredients Actions", () => {
		it("should remove specific ingredient from slot", () => {
			const shaped2Recipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped2 });
			const result = updateRecipe(RecipeAction.removeIngredient("4", ["minecraft:redstone"]), shaped2Recipe);
			expect(result.slots["4"]).toBeUndefined();
		});

		it("should remove specific ingredient from slot with array item", () => {
			const shapedArrayItemRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped_array_item });
			const result = updateRecipe(RecipeAction.removeIngredient("4", ["minecraft:redstone"]), shapedArrayItemRecipe);
			expect(result.slots["4"]).toEqual(["minecraft:redstone_block"]);
		});

		it("should remove entire slot when items not specified", () => {
			const shaped2Recipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped2 });
			const result = updateRecipe(RecipeAction.removeIngredient("4"), shaped2Recipe);
			expect(result.slots["4"]).toBeUndefined();
			expect(result.slots["1"]).toBe("#minecraft:iron_ingot");
		});

		it("should handle removing from non-existent slot gracefully", () => {
			const shapedRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped });
			const result = updateRecipe(RecipeAction.removeIngredient("99"), shapedRecipe);
			expect(result.slots).toEqual(shapedRecipe.slots);
		});
	});

	describe("Remove Item Everywhere Actions", () => {
		it("should remove items from all slots", () => {
			const shapedRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped });
			const testRecipe = {
				...shapedRecipe,
				slots: {
					"0": ["minecraft:acacia_planks", "minecraft:oak_planks"],
					"1": ["minecraft:stone"],
					"2": "#minecraft:logs",
					"3": ["minecraft:acacia_planks"]
				}
			};

			const result = updateRecipe(RecipeAction.removeItemEverywhere(["minecraft:acacia_planks"]), testRecipe);
			expect(result.slots["0"]).toEqual(["minecraft:oak_planks"]);
			expect(result.slots["1"]).toEqual(["minecraft:stone"]);
			expect(result.slots["2"]).toBe("#minecraft:logs");
			expect(result.slots["3"]).toBeUndefined();

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.key).toBeDefined();
		});

		it("should remove tags from slots", () => {
			const shapedRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped });
			const testRecipe = {
				...shapedRecipe,
				slots: {
					"0": ["minecraft:oak_planks"],
					"1": "#minecraft:logs",
					"2": ["minecraft:stone"]
				}
			};

			const result = updateRecipe(RecipeAction.removeItemEverywhere(["#minecraft:logs"]), testRecipe);
			expect(result.slots["0"]).toEqual(["minecraft:oak_planks"]);
			expect(result.slots["1"]).toBeUndefined();
			expect(result.slots["2"]).toEqual(["minecraft:stone"]);

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.pattern).toBeDefined();
		});

		it("should remove multiple items at once", () => {
			const shapedRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped });
			const testRecipe = {
				...shapedRecipe,
				slots: {
					"0": ["minecraft:oak_planks", "minecraft:birch_planks", "minecraft:stone"],
					"1": ["minecraft:oak_planks"],
					"2": ["minecraft:diamond"]
				}
			};

			const result = updateRecipe(RecipeAction.removeItemEverywhere(["minecraft:oak_planks", "minecraft:birch_planks"]), testRecipe);
			expect(result.slots["0"]).toEqual(["minecraft:stone"]);
			expect(result.slots["1"]).toBeUndefined();
			expect(result.slots["2"]).toEqual(["minecraft:diamond"]);

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.key).toBeDefined();
		});
	});

	describe("Replace Item Everywhere Actions", () => {
		it("should replace items in array slots", () => {
			const shapedRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped });
			const testRecipe = {
				...shapedRecipe,
				slots: {
					"0": ["minecraft:oak_planks", "minecraft:stone"],
					"1": ["minecraft:oak_planks"],
					"2": ["minecraft:diamond"]
				}
			};

			const result = updateRecipe(RecipeAction.replaceItemEverywhere("minecraft:oak_planks", "minecraft:birch_planks"), testRecipe);
			expect(result.slots["0"]).toEqual(["minecraft:birch_planks", "minecraft:stone"]);
			expect(result.slots["1"]).toEqual(["minecraft:birch_planks"]);
			expect(result.slots["2"]).toEqual(["minecraft:diamond"]);

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.key).toBeDefined();
		});

		it("should replace tags with items and transform to array", () => {
			const shapedRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped });
			const testRecipe = {
				...shapedRecipe,
				slots: {
					"0": "#minecraft:logs",
					"1": ["minecraft:stone"],
					"2": "#minecraft:logs"
				}
			};

			const result = updateRecipe(RecipeAction.replaceItemEverywhere("#minecraft:logs", "minecraft:oak_log"), testRecipe);
			expect(result.slots["0"]).toEqual(["minecraft:oak_log"]);
			expect(result.slots["1"]).toEqual(["minecraft:stone"]);
			expect(result.slots["2"]).toEqual(["minecraft:oak_log"]);

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.key).toBeDefined();
		});

		it("should remove duplicates after replacement", () => {
			const shapedRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped });
			const testRecipe = {
				...shapedRecipe,
				slots: {
					"0": ["minecraft:oak_planks", "minecraft:birch_planks", "minecraft:oak_planks"],
					"1": ["minecraft:stone"]
				}
			};

			const result = updateRecipe(RecipeAction.replaceItemEverywhere("minecraft:birch_planks", "minecraft:oak_planks"), testRecipe);
			expect(result.slots["0"]).toEqual(["minecraft:oak_planks"]);
			expect(result.slots["1"]).toEqual(["minecraft:stone"]);

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.key).toBeDefined();
		});

		it("should replace items with tags and transform to string", () => {
			const shapedRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped });
			const testRecipe = {
				...shapedRecipe,
				slots: {
					"0": ["minecraft:oak_log"],
					"1": ["minecraft:oak_log", "minecraft:stone"],
					"2": ["minecraft:birch_log"]
				}
			};

			const result = updateRecipe(RecipeAction.replaceItemEverywhere("minecraft:oak_log", "#minecraft:logs"), testRecipe);
			expect(result.slots["0"]).toBe("#minecraft:logs");
			expect(result.slots["1"]).toEqual("#minecraft:logs");
			expect(result.slots["2"]).toEqual(["minecraft:birch_log"]);

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.key).toBeDefined();
		});
	});

	describe("Clear Slot Actions", () => {
		it("should clear slot completely", () => {
			const shaped2Recipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped2 });
			const result = updateRecipe(RecipeAction.clearSlot("4"), shaped2Recipe);
			expect(result.slots["4"]).toBeUndefined();
			expect(result.slots["1"]).toBe("#minecraft:iron_ingot");
		});

		it("should handle clearing non-existent slot gracefully", () => {
			const shapedRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped });
			const result = updateRecipe(RecipeAction.clearSlot("99"), shapedRecipe);
			expect(result.slots).toEqual(shapedRecipe.slots);
		});
	});

	describe("Convert Recipe Type Actions", () => {
		it("should convert shapeless to shaped recipe", () => {
			const convertAction = RecipeAction.convertRecipeType("minecraft:crafting_shaped", true);
			const result = updateRecipe(convertAction, RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless }));
			expect(result.type).toBe("minecraft:crafting_shaped");
			expect(result.gridSize).toEqual({ width: 3, height: 3 });
			expect(result.slots["0"]).toBe("#minecraft:acacia_logs");

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.type).toBe("minecraft:crafting_shaped");
			expect(compiled.element.data.pattern).toBeDefined();
			expect(compiled.element.data.key).toBeDefined();
		});

		it("should convert shaped to smelting recipe", () => {
			const convertAction = RecipeAction.convertRecipeType("minecraft:smelting", true);
			const result = updateRecipe(convertAction, RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped }));
			expect(result.type).toBe("minecraft:smelting");
			expect(result.gridSize).toBeUndefined();
			expect(result.slots["0"]).toEqual(["minecraft:acacia_planks"]);

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.type).toBe("minecraft:smelting");
			expect(compiled.element.data.ingredient).toBe("minecraft:acacia_planks");
			expect(compiled.element.data.pattern).toBeUndefined();
			expect(compiled.element.data.key).toBeUndefined();
		});

		it("should convert smelting to stonecutting recipe", () => {
			const convertAction = RecipeAction.convertRecipeType("minecraft:stonecutting", true);
			const result = updateRecipe(convertAction, RecipeDataDrivenToVoxelFormat({ element: originalRecipes.blasting }));
			expect(result.type).toBe("minecraft:stonecutting");
			expect(result.typeSpecific).toBeUndefined();
			expect(result.slots["0"]).toEqual(["minecraft:iron_ore"]);

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.type).toBe("minecraft:stonecutting");
			expect(compiled.element.data.ingredient).toBe("minecraft:iron_ore");
			expect(compiled.element.data.experience).toBeUndefined();
			expect(compiled.element.data.cookingtime).toBeUndefined();
		});

		it("should convert without preserving ingredients", () => {
			const convertAction = RecipeAction.convertRecipeType("minecraft:crafting_shapeless", false);
			const result = updateRecipe(convertAction, RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped }));
			expect(result.type).toBe("minecraft:crafting_shapeless");
			expect(result.gridSize).toEqual({ width: 3, height: 1 });
			expect(Object.keys(result.slots).length).toBeGreaterThan(0);
		});

		it("should handle recipe type conversion edge cases", () => {
			const shapelessRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless });
			const convertAction = RecipeAction.convertRecipeType("minecraft:crafting_shapeless", true);
			const result = updateRecipe(convertAction, shapelessRecipe);
			expect(result.type).toBe("minecraft:crafting_shapeless");
			expect(result.slots).toEqual(shapelessRecipe.slots);

			const unknownTypeAction = RecipeAction.convertRecipeType("minecraft:unknown_recipe_type", true);
			const result2 = updateRecipe(unknownTypeAction, shapelessRecipe);
			expect(result2.type).toBe("minecraft:unknown_recipe_type");
		});
	});

	describe("Core Actions on Recipes", () => {
		it("should set recipe values using core.set_value", () => {
			const setGroupAction = CoreAction.setValue("group", "custom_planks");
			const result = updateRecipe(setGroupAction, RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless }));
			expect(result.group).toBe("custom_planks");

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.group).toBe("custom_planks");
		});

		it("should toggle recipe values using core.toggle_value", () => {
			const toggleNotificationAction = CoreAction.toggleValue("showNotification", false);
			const result = updateRecipe(toggleNotificationAction, RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless }));
			expect(result.showNotification).toBe(false);

			const updatedResult = updateRecipe(toggleNotificationAction, result);
			expect(updatedResult.showNotification).toBeUndefined();

			const compiled = VoxelToRecipeDataDriven(updatedResult, "recipe");
			expect(compiled.element.data.show_notification).toBeUndefined();
		});

		it("should set result properties using core.set_value", () => {
			const setCountAction = CoreAction.setValue("result.count", 8);
			const result = updateRecipe(setCountAction, RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless }));
			expect(result.result.count).toBe(8);

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.result).toEqual({ count: 8, id: "minecraft:acacia_planks" });
		});

		it("should modify smelting data using core.set_value", () => {
			const setExperienceAction = CoreAction.setValue("typeSpecific.experience", 1.5);
			const updatedResult = updateRecipe(setExperienceAction, RecipeDataDrivenToVoxelFormat({ element: originalRecipes.blasting })) as any;
			expect(updatedResult.typeSpecific?.experience).toBe(1.5);

			const compiled = VoxelToRecipeDataDriven(updatedResult, "recipe");
			expect(compiled.element.data.experience).toBe(1.5);
		});

		it("should use core.set_undefined to remove properties", () => {
			const removeGroupAction = CoreAction.setUndefined("group");
			const result = updateRecipe(removeGroupAction, RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless }));
			expect(result.group).toBeUndefined();

			const compiled = VoxelToRecipeDataDriven(result, "recipe");
			expect(compiled.element.data.group).toBeUndefined();
		});

		it("should handle invalid path operations gracefully", () => {
			const invalidPathAction = CoreAction.setValue("nonexistent.deeply.nested.path", "test");
			const result = updateRecipe(invalidPathAction, RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless })) as any;
			expect(result.nonexistent?.deeply?.nested?.path).toBe("test");
		});
	});

	describe("Complex workflow scenarios", () => {
		it("should handle action chain on shapeless recipe", () => {
			const shapelessRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless });
			const withIngredient = updateRecipe(RecipeAction.addShapelessIngredient(["minecraft:diamond"]), shapelessRecipe);
			const withGroup = updateRecipe(CoreAction.setValue("group", "custom_planks"), withIngredient);
			const withCount = updateRecipe(CoreAction.setValue("result.count", 8), withGroup);
			const replaced = updateRecipe(RecipeAction.replaceItemEverywhere("minecraft:diamond", "minecraft:emerald"), withCount);
			expect(replaced.slots["0"]).toBe("#minecraft:acacia_logs");
			expect(replaced.slots["1"]).toEqual(["minecraft:emerald"]);
			expect(replaced.group).toBe("custom_planks");
			expect(replaced.result.count).toBe(8);

			const compiled = VoxelToRecipeDataDriven(replaced, "recipe");
			expect(compiled.element.data.ingredients).toHaveLength(2);
			expect(compiled.element.data.group).toBe("custom_planks");
			expect(compiled.element.data.result).toEqual({ count: 8, id: "minecraft:acacia_planks" });
			expect(compiled.element.data.ingredients?.[1]).toBe("minecraft:emerald");
		});

		it("should preserve identifier through recipe actions", () => {
			const shapedRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped });
			const result = updateRecipe(RecipeAction.addIngredient("5", ["minecraft:coal"]), shapedRecipe);
			expect(result.identifier).toBeDefined();
			expect(shapedRecipe.identifier).toEqual(result.identifier);
		});
	});
});