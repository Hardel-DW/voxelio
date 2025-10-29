import { updateData } from "@/core/engine/actions";
import { VoxelToRecipeDataDriven } from "@/core/schema/recipe/Compiler";
import type { RecipeProps } from "@/core/schema/recipe/types";
import type { Action } from "@/core/engine/actions/index";
import { describe, it, expect } from "vitest";
import { RecipeAction } from "@/core/engine/actions/domains/RecipeAction";
import { CoreAction } from "@/core/engine/actions/domains/CoreAction";
import { originalRecipes } from "@test/mock/recipe/DataDriven";
import { RecipeDataDrivenToVoxelFormat } from "@/core/schema/recipe/Parser";

function updateRecipe(action: Action, recipe: RecipeProps, packVersion = 48): RecipeProps {
	const result = updateData(action, recipe, packVersion);
	expect(result).toBeDefined();
	return result as RecipeProps;
}

describe("Recipe E2E Actions Tests", () => {
	describe("Complete workflow: Parse → Actions → Compile", () => {
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
		});

		describe("Remove Item Everywhere Actions", () => {
			it("should remove item everywhere", () => {
				const shaped2Recipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped2 });
				const result = updateRecipe(RecipeAction.removeItemEverywhere(["minecraft:redstone"]), shaped2Recipe);
				expect(result.slots["4"]).toBeUndefined();
				expect(result.slots["1"]).toBe("#minecraft:iron_ingot");
			});
		});

		describe("Replace Item Everywhere Actions", () => {
			it("should replace item in all slots", () => {
				const shaped2Recipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped2 });
				const result = updateRecipe(RecipeAction.replaceItemEverywhere("minecraft:redstone", "minecraft:glowstone"), shaped2Recipe);
				expect(result.slots["4"]).toEqual(["minecraft:glowstone"]);
			});
		});

		describe("Clear Slot Actions", () => {
			it("should clear slot completely", () => {
				const shaped2Recipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped2 });
				const result = updateRecipe(RecipeAction.clearSlot("4"), shaped2Recipe);
				expect(result.slots["4"]).toBeUndefined();
				expect(result.slots["1"]).toBe("#minecraft:iron_ingot");
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
		});
	});
});
