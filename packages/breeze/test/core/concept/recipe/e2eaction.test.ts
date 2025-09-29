import { parseDatapack } from "@/core/engine/Parser";
import { updateData } from "@/core/engine/actions";
import { VoxelToRecipeDataDriven } from "@/core/schema/recipe/Compiler";
import type { RecipeProps } from "@/core/schema/recipe/types";
import type { Action } from "@/core/engine/actions/index";
import { recipeFile } from "@test/mock/datapack";
import { createZipFile } from "@test/mock/utils";
import { describe, it, expect, beforeEach } from "vitest";
import { RecipeAction } from "@/core/engine/actions/domains/RecipeAction";
import { CoreAction } from "@/core/engine/actions/domains/CoreAction";


// Helper function to update recipe data with proper typing
function updateRecipe(action: Action, recipe: RecipeProps, packVersion = 48): RecipeProps {
	const result = updateData(action, recipe, packVersion);
	expect(result).toBeDefined();
	return result as RecipeProps;
}

describe("Recipe E2E Actions Tests", () => {
	describe("Complete workflow: Parse → Actions → Compile", () => {
		let parsedDatapack: Awaited<ReturnType<typeof parseDatapack>>;
		let shapelessRecipe: RecipeProps;
		let shapedRecipe: RecipeProps;
		let shaped2Recipe: RecipeProps;
		let blastingRecipe: RecipeProps;
		let stonecuttingRecipe: RecipeProps;

		beforeEach(async () => {
			parsedDatapack = await parseDatapack(await createZipFile(recipeFile));

			const recipes = Array.from(parsedDatapack.elements.values()).filter(
				(element): element is RecipeProps => element.identifier.registry === "recipe"
			);

			expect(recipes).toBeDefined();
			expect(recipes).toHaveLength(11);

			const foundShapeless = recipes.find((r) => r.identifier.resource === "shapeless");
			const foundShaped = recipes.find((r) => r.identifier.resource === "shaped");
			const foundShaped2 = recipes.find((r) => r.identifier.resource === "shaped2");
			const foundBlasting = recipes.find((r) => r.identifier.resource === "blasting");
			const foundStonecutting = recipes.find((r) => r.identifier.resource === "stonecutting");

			expect(foundShapeless).toBeDefined();
			expect(foundShaped).toBeDefined();
			expect(foundShaped2).toBeDefined();
			expect(foundBlasting).toBeDefined();
			expect(foundStonecutting).toBeDefined();

			shapelessRecipe = foundShapeless as RecipeProps;
			shapedRecipe = foundShaped as RecipeProps;
			shaped2Recipe = foundShaped2 as RecipeProps;
			blastingRecipe = foundBlasting as RecipeProps;
			stonecuttingRecipe = foundStonecutting as RecipeProps;
		});

		describe("Recipe ingredient management actions", () => {
			it("should add ingredients to shapeless recipe", () => {
				// Add diamond to shapeless recipe
				const addDiamondAction = RecipeAction.addShapelessIngredient(["minecraft:diamond"]);

				const result = updateRecipe(addDiamondAction, shapelessRecipe);
				expect(result.slots["1"]).toEqual(["minecraft:diamond"]);
				expect(result.slots["0"]).toBe("#minecraft:acacia_logs"); // Original ingredient preserved

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.ingredients).toHaveLength(2);
				expect(compiled.element.data.ingredients?.[0]).toEqual("#minecraft:acacia_logs");
				expect(compiled.element.data.ingredients?.[1]).toEqual("minecraft:diamond");
			});

			it("should replace ingredients in shapeless recipe", () => {
				// Replace existing ingredient
				const replaceAction = RecipeAction.addShapelessIngredient(["minecraft:diamond", "minecraft:emerald"]);

				const result = updateRecipe(replaceAction, shapelessRecipe);
				expect(result.slots["1"]).toEqual(["minecraft:diamond", "minecraft:emerald"]);

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.ingredients).toHaveLength(2);
				expect(compiled.element.data.ingredients?.[0]).toEqual("#minecraft:acacia_logs");
				expect(compiled.element.data.ingredients?.[1]).toEqual(["minecraft:diamond", "minecraft:emerald"]);
			});

			it("should remove specific ingredients from recipe", () => {
				// First add multiple ingredients
				const addAction = RecipeAction.addShapelessIngredient(["minecraft:diamond", "minecraft:emerald", "minecraft:gold_ingot"]);

				let result = updateRecipe(addAction, shapelessRecipe);
				expect(result.slots["1"]).toEqual(["minecraft:diamond", "minecraft:emerald", "minecraft:gold_ingot"]);

				// Remove specific items
				const removeAction = RecipeAction.removeIngredient("1", ["minecraft:emerald"]);

				result = updateRecipe(removeAction, result);
				expect(result.slots["1"]).toEqual(["minecraft:diamond", "minecraft:gold_ingot"]);

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.ingredients).toHaveLength(2);
			});

			it("should clear entire slot", () => {
				// Add ingredient first
				const addAction = RecipeAction.addShapelessIngredient(["minecraft:diamond"]);

				let result = updateRecipe(addAction, shapelessRecipe);
				expect(result.slots["1"]).toEqual(["minecraft:diamond"]);

				// Clear the slot
				const clearAction = RecipeAction.clearSlot("1");

				result = updateRecipe(clearAction, result);
				expect(result.slots["1"]).toBeUndefined();

				// Original slot should still exist
				expect(result.slots["0"]).toBe("#minecraft:acacia_logs");
			});

			it("should swap ingredients between slots", () => {
				// Add ingredient to slot 1
				const addAction = RecipeAction.addShapelessIngredient(["minecraft:diamond"]);

				const result = updateRecipe(addAction, shapelessRecipe);
				expect(result.slots["0"]).toEqual("#minecraft:acacia_logs");
				expect(result.slots["1"]).toEqual(["minecraft:diamond"]);

				// Compile and verify order
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.ingredients?.[0]).toBe("#minecraft:acacia_logs");
				expect(compiled.element.data.ingredients?.[1]).toBe("minecraft:diamond");
			});
		});

		describe("Recipe type conversion actions", () => {
			it("should convert shapeless to shaped recipe", () => {
				const convertAction = RecipeAction.convertRecipeType("minecraft:crafting_shaped", true);

				const result = updateRecipe(convertAction, shapelessRecipe);
				expect(result.type).toBe("minecraft:crafting_shaped");
				expect(result.gridSize).toEqual({ width: 3, height: 3 });
				expect(result.slots["0"]).toBe("#minecraft:acacia_logs"); // Original ingredient preserved

				// Compile and verify pattern generation
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.type).toBe("minecraft:crafting_shaped");
				expect(compiled.element.data.pattern).toBeDefined();
				expect(compiled.element.data.key).toBeDefined();
			});

			it("should convert shaped to smelting recipe", () => {
				const convertAction = RecipeAction.convertRecipeType("minecraft:smelting", true);

				const result = updateRecipe(convertAction, shapedRecipe);
				expect(result.type).toBe("minecraft:smelting");
				expect(result.gridSize).toBeUndefined();
				expect(result.slots["0"]).toEqual(["minecraft:acacia_planks"]); // First ingredient preserved

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.type).toBe("minecraft:smelting");
				expect(compiled.element.data.ingredient).toBe("minecraft:acacia_planks");
				expect(compiled.element.data.pattern).toBeUndefined();
				expect(compiled.element.data.key).toBeUndefined();
			});

			it("should convert smelting to stonecutting recipe", () => {
				const convertAction = RecipeAction.convertRecipeType("minecraft:stonecutting", true);

				const result = updateRecipe(convertAction, blastingRecipe);
				expect(result.type).toBe("minecraft:stonecutting");
				expect(result.typeSpecific).toBeUndefined(); // Smelting data removed
				expect(result.slots["0"]).toEqual(["minecraft:iron_ore"]); // Ingredient preserved

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.type).toBe("minecraft:stonecutting");
				expect(compiled.element.data.ingredient).toBe("minecraft:iron_ore");
				expect(compiled.element.data.experience).toBeUndefined();
				expect(compiled.element.data.cookingtime).toBeUndefined();
			});

			it("should convert without preserving ingredients", () => {
				const convertAction = RecipeAction.convertRecipeType("minecraft:crafting_shapeless", false);

				const result = updateRecipe(convertAction, shapedRecipe);
				expect(result.type).toBe("minecraft:crafting_shapeless");
				expect(result.gridSize).toEqual({ width: 3, height: 1 });
				// Original slots should be preserved even if preserveIngredients is false
				expect(Object.keys(result.slots).length).toBeGreaterThan(0);
			});
		});

		describe("Core actions on recipes", () => {
			it("should set recipe values using core.set_value", () => {
				const setGroupAction = CoreAction.setValue("group", "custom_planks");

				const result = updateRecipe(setGroupAction, shapelessRecipe);
				expect(result.group).toBe("custom_planks");

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.group).toBe("custom_planks");
			});

			it("should toggle recipe values using core.toggle_value", () => {
				const toggleNotificationAction = CoreAction.toggleValue("showNotification", false);

				let result = updateRecipe(toggleNotificationAction, shapelessRecipe);
				expect(result.showNotification).toBe(false);

				// Toggle again to remove
				result = updateRecipe(toggleNotificationAction, result);
				expect(result.showNotification).toBeUndefined();

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.show_notification).toBeUndefined();
			});

			it("should set result properties using core.set_value", () => {
				const setCountAction = CoreAction.setValue("result.count", 8);

				const result = updateRecipe(setCountAction, shapelessRecipe);
				expect(result.result.count).toBe(8);

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.result).toEqual({
					count: 8,
					id: "minecraft:acacia_planks"
				});
			});

			it("should modify smelting data using core.set_value", () => {
				const setExperienceAction = CoreAction.setValue("typeSpecific.experience", 1.5);

				const result = updateRecipe(setExperienceAction, blastingRecipe);
				// @ts-expect-error
				expect(result.typeSpecific?.experience).toBe(1.5);

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.experience).toBe(1.5);
			});

			it("should use core.set_undefined to remove properties", () => {
				const removeGroupAction = CoreAction.setUndefined("group");

				const result = updateRecipe(removeGroupAction, shapelessRecipe);
				expect(result.group).toBeUndefined();

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.group).toBeUndefined();
			});
		});

		describe("Complex workflow scenarios", () => {
			it("should handle full recipe transformation workflow", () => {
				let result = shapedRecipe;

				// Step 1: Convert to shapeless
				const convertAction = RecipeAction.convertRecipeType("minecraft:crafting_shapeless", true);
				result = updateRecipe(convertAction, result);

				// Step 2: Add more ingredients
				const addAction = RecipeAction.addShapelessIngredient(["minecraft:stick"]);
				result = updateRecipe(addAction, result);

				// Step 3: Modify result count
				const setCountAction = CoreAction.setValue("result.count", 12);
				result = updateRecipe(setCountAction, result);

				// Step 4: Set group
				const setGroupAction = CoreAction.setValue("group", "enhanced_slabs");
				result = updateRecipe(setGroupAction, result);

				// Verify final state
				expect(result.type).toBe("minecraft:crafting_shapeless");
				expect(result.gridSize).toBeUndefined();
				expect(result.slots["3"]).toEqual(["minecraft:stick"]);
				expect(result.result.count).toBe(12);
				expect(result.group).toBe("enhanced_slabs");

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.type).toBe("minecraft:crafting_shapeless");
				expect(compiled.element.data.ingredients).toHaveLength(4); // 3 original + 1 stick
				expect(compiled.element.data.result).toEqual({
					count: 12,
					id: "minecraft:acacia_slab"
				});
				expect(compiled.element.data.group).toBe("enhanced_slabs");
			});

			it("should handle complex shaped recipe modifications", () => {
				let result = shaped2Recipe; // Complex shaped recipe with tags

				// Step 1: Clear a specific slot
				const clearCenterAction = RecipeAction.clearSlot("4");
				result = updateRecipe(clearCenterAction, result);

				// Step 2: Add new ingredient to center
				const addCenterAction = RecipeAction.addIngredient("4", ["minecraft:glowstone_dust"], false);
				result = updateRecipe(addCenterAction, result);

				expect(result.slots["4"]).toEqual(["minecraft:glowstone_dust"]);

				// Compile and verify pattern changes
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.type).toBe("minecraft:crafting_shaped");

				// Verify pattern structure (should still be 3x3 with new center ingredient)
				expect(compiled.element.data.pattern).toEqual([" A ", "ABA", " A "]);
				expect(compiled.element.data.key?.B).toBe("minecraft:glowstone_dust");
			});
		});

		describe("Round-trip integrity with actions", () => {
			it("should maintain data integrity through action workflow", () => {
				const recipes = [shapelessRecipe, shapedRecipe, blastingRecipe, stonecuttingRecipe];

				for (const originalRecipe of recipes) {
					let result = originalRecipe;
					const actions = [
						CoreAction.setValue("group", "test_group"),
						CoreAction.toggleValue("showNotification", true),
						CoreAction.toggleValue("showNotification", true)
					];

					for (const action of actions) {
						result = updateRecipe(action, result);
					}

					// Verify core properties are preserved
					expect(result.identifier).toEqual(originalRecipe.identifier);
					expect(result.type).toBe(originalRecipe.type);
					expect(result.result.item).toBe(originalRecipe.result.item);
					expect(result.group).toBe("test_group"); // Only change we made

					// Compile and verify structure
					const compiled = VoxelToRecipeDataDriven(result, "recipe");
					expect(compiled.element.data.type).toBe(originalRecipe.type);
					expect(compiled.element.data.group).toBe("test_group");
					expect(compiled.element.identifier).toEqual(originalRecipe.identifier);

					// Type-specific verification
					switch (originalRecipe.type) {
						case "minecraft:crafting_shapeless":
							expect(compiled.element.data.ingredients).toBeDefined();
							break;
						case "minecraft:crafting_shaped":
							expect(compiled.element.data.pattern).toBeDefined();
							expect(compiled.element.data.key).toBeDefined();
							break;
						case "minecraft:blasting":
							expect(compiled.element.data.ingredient).toBeDefined();
							expect(compiled.element.data.cookingtime).toBeDefined();
							break;
						case "minecraft:stonecutting":
							expect(compiled.element.data.ingredient).toBeDefined();
							break;
					}
				}
			});
		});

		describe("Error handling and edge cases", () => {
			it("should handle invalid path operations gracefully", () => {
				const invalidPathAction = CoreAction.setValue("nonexistent.deeply.nested.path", "test");
				const result = updateRecipe(invalidPathAction, shapelessRecipe);
				// @ts-expect-error
				expect(result.nonexistent?.deeply?.nested?.path).toBe("test");
			});

			it("should handle recipe type conversion edge cases", () => {
				const convertAction = RecipeAction.convertRecipeType("minecraft:crafting_shapeless", true);
				const result = updateRecipe(convertAction, shapelessRecipe);
				expect(result.type).toBe("minecraft:crafting_shapeless");
				expect(result.slots).toEqual(shapelessRecipe.slots);

				const unknownTypeAction = RecipeAction.convertRecipeType("minecraft:unknown_recipe_type", true);
				const result2 = updateRecipe(unknownTypeAction, shapelessRecipe);
				expect(result2.type).toBe("minecraft:unknown_recipe_type");
			});
		});
	});
});
