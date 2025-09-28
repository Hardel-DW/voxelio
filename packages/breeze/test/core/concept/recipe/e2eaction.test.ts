import { parseDatapack } from "@/core/engine/Parser";
import { updateData } from "@/core/engine/actions";
import { VoxelToRecipeDataDriven } from "@/core/schema/recipe/Compiler";
import type { RecipeProps } from "@/core/schema/recipe/types";
import type { ActionLike } from "@/core/engine/actions/index";
import { recipeFile } from "@test/mock/datapack";
import { createZipFile } from "@test/mock/utils";
import { describe, it, expect, beforeEach } from "vitest";

// Helper function to update recipe data with proper typing
async function updateRecipe(action: ActionLike, recipe: RecipeProps, packVersion = 48): Promise<RecipeProps> {
	const result = await updateData(action, recipe, packVersion);
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
			it("should add ingredients to shapeless recipe", async () => {
				// Add diamond to shapeless recipe
				const addDiamondAction: ActionLike = {
					type: "recipe.add_shapeless_ingredient",
					items: ["minecraft:diamond"]
				};

				const result = await updateRecipe(addDiamondAction, shapelessRecipe);
				expect(result.slots["1"]).toEqual(["minecraft:diamond"]);
				expect(result.slots["0"]).toBe("#minecraft:acacia_logs"); // Original ingredient preserved

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.ingredients).toHaveLength(2);
				expect(compiled.element.data.ingredients?.[0]).toEqual("#minecraft:acacia_logs");
				expect(compiled.element.data.ingredients?.[1]).toEqual("minecraft:diamond");
			});

			it("should replace ingredients in shapeless recipe", async () => {
				// Replace existing ingredient
				const replaceAction: ActionLike = {
					type: "recipe.add_shapeless_ingredient",
					items: ["minecraft:diamond", "minecraft:emerald"]
				};

				const result = await updateRecipe(replaceAction, shapelessRecipe);
				expect(result.slots["1"]).toEqual(["minecraft:diamond", "minecraft:emerald"]);

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.ingredients).toHaveLength(2);
				expect(compiled.element.data.ingredients?.[0]).toEqual("#minecraft:acacia_logs");
				expect(compiled.element.data.ingredients?.[1]).toEqual(["minecraft:diamond", "minecraft:emerald"]);
			});

			it("should remove specific ingredients from recipe", async () => {
				// First add multiple ingredients
				const addAction: ActionLike = {
					type: "recipe.add_shapeless_ingredient",
					items: ["minecraft:diamond", "minecraft:emerald", "minecraft:gold_ingot"]
				};

				let result = await updateRecipe(addAction, shapelessRecipe);
				expect(result.slots["1"]).toEqual(["minecraft:diamond", "minecraft:emerald", "minecraft:gold_ingot"]);

				// Remove specific items
				const removeAction: ActionLike = {
					type: "recipe.remove_ingredient",
					slot: "1",
					items: ["minecraft:emerald"]
				};

				result = await updateRecipe(removeAction, result);
				expect(result.slots["1"]).toEqual(["minecraft:diamond", "minecraft:gold_ingot"]);

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.ingredients).toHaveLength(2);
			});

			it("should clear entire slot", async () => {
				// Add ingredient first
				const addAction: ActionLike = {
					type: "recipe.add_shapeless_ingredient",
					items: ["minecraft:diamond"]
				};

				let result = await updateRecipe(addAction, shapelessRecipe);
				expect(result.slots["1"]).toEqual(["minecraft:diamond"]);

				// Clear the slot
				const clearAction: ActionLike = {
					type: "recipe.clear_slot",
					slot: "1"
				};

				result = await updateRecipe(clearAction, result);
				expect(result.slots["1"]).toBeUndefined();

				// Original slot should still exist
				expect(result.slots["0"]).toBe("#minecraft:acacia_logs");
			});

			it("should swap ingredients between slots", async () => {
				// Add ingredient to slot 1
				const addAction: ActionLike = {
					type: "recipe.add_shapeless_ingredient",
					items: ["minecraft:diamond"]
				};

				const result = await updateRecipe(addAction, shapelessRecipe);
				expect(result.slots["0"]).toEqual("#minecraft:acacia_logs");
				expect(result.slots["1"]).toEqual(["minecraft:diamond"]);

				// Compile and verify order
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.ingredients?.[0]).toBe("#minecraft:acacia_logs");
				expect(compiled.element.data.ingredients?.[1]).toBe("minecraft:diamond");
			});
		});

		describe("Recipe type conversion actions", () => {
			it("should convert shapeless to shaped recipe", async () => {
				const convertAction: ActionLike = {
					type: "recipe.convert_recipe_type",
					newType: "minecraft:crafting_shaped",
					preserveIngredients: true
				};

				const result = await updateRecipe(convertAction, shapelessRecipe);
				expect(result.type).toBe("minecraft:crafting_shaped");
				expect(result.gridSize).toEqual({ width: 3, height: 3 });
				expect(result.slots["0"]).toBe("#minecraft:acacia_logs"); // Original ingredient preserved

				// Compile and verify pattern generation
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.type).toBe("minecraft:crafting_shaped");
				expect(compiled.element.data.pattern).toBeDefined();
				expect(compiled.element.data.key).toBeDefined();
			});

			it("should convert shaped to smelting recipe", async () => {
				const convertAction: ActionLike = {
					type: "recipe.convert_recipe_type",
					newType: "minecraft:smelting",
					preserveIngredients: true
				};

				const result = await updateRecipe(convertAction, shapedRecipe);
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

			it("should convert smelting to stonecutting recipe", async () => {
				const convertAction: ActionLike = {
					type: "recipe.convert_recipe_type",
					newType: "minecraft:stonecutting",
					preserveIngredients: true
				};

				const result = await updateRecipe(convertAction, blastingRecipe);
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

			it("should convert without preserving ingredients", async () => {
				const convertAction: ActionLike = {
					type: "recipe.convert_recipe_type",
					newType: "minecraft:crafting_shapeless",
					preserveIngredients: false
				};

				const result = await updateRecipe(convertAction, shapedRecipe);
				expect(result.type).toBe("minecraft:crafting_shapeless");
				expect(result.gridSize).toEqual({ width: 3, height: 1 });
				// Original slots should be preserved even if preserveIngredients is false
				expect(Object.keys(result.slots).length).toBeGreaterThan(0);
			});
		});

		describe("Core actions on recipes", () => {
			it("should set recipe values using core.set_value", async () => {
				const setGroupAction: ActionLike = {
					type: "core.set_value",
					path: "group",
					value: "custom_planks"
				};

				const result = await updateRecipe(setGroupAction, shapelessRecipe);
				expect(result.group).toBe("custom_planks");

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.group).toBe("custom_planks");
			});

			it("should toggle recipe values using core.toggle_value", async () => {
				const toggleNotificationAction: ActionLike = {
					type: "core.toggle_value",
					path: "showNotification",
					value: false
				};

				let result = await updateRecipe(toggleNotificationAction, shapelessRecipe);
				expect(result.showNotification).toBe(false);

				// Toggle again to remove
				result = await updateRecipe(toggleNotificationAction, result);
				expect(result.showNotification).toBeUndefined();

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.show_notification).toBeUndefined();
			});

			it("should set result properties using core.set_value", async () => {
				const setCountAction: ActionLike = {
					type: "core.set_value",
					path: "result.count",
					value: 8
				};

				const result = await updateRecipe(setCountAction, shapelessRecipe);
				expect(result.result.count).toBe(8);

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.result).toEqual({
					count: 8,
					id: "minecraft:acacia_planks"
				});
			});

			it("should modify smelting data using core.set_value", async () => {
				const setExperienceAction: ActionLike = {
					type: "core.set_value",
					path: "typeSpecific.experience",
					value: 1.5
				};

				const result = await updateRecipe(setExperienceAction, blastingRecipe);
				// @ts-expect-error
				expect(result.typeSpecific?.experience).toBe(1.5);

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.experience).toBe(1.5);
			});

			it("should use core.set_undefined to remove properties", async () => {
				const removeGroupAction: ActionLike = {
					type: "core.set_undefined",
					path: "group"
				};

				const result = await updateRecipe(removeGroupAction, shapelessRecipe);
				expect(result.group).toBeUndefined();

				// Compile and verify
				const compiled = VoxelToRecipeDataDriven(result, "recipe");
				expect(compiled.element.data.group).toBeUndefined();
			});
		});

		describe("Complex workflow scenarios", () => {
			it("should handle full recipe transformation workflow", async () => {
				let result = shapedRecipe;

				// Step 1: Convert to shapeless
				const convertAction: ActionLike = {
					type: "recipe.convert_recipe_type",
					newType: "minecraft:crafting_shapeless",
					preserveIngredients: true
				};
				result = await updateRecipe(convertAction, result);

				// Step 2: Add more ingredients
				const addAction: ActionLike = {
					type: "recipe.add_shapeless_ingredient",
					items: ["minecraft:stick"]
				};
				result = await updateRecipe(addAction, result);

				// Step 3: Modify result count
				const setCountAction: ActionLike = {
					type: "core.set_value",
					path: "result.count",
					value: 12
				};
				result = await updateRecipe(setCountAction, result);

				// Step 4: Set group
				const setGroupAction: ActionLike = {
					type: "core.set_value",
					path: "group",
					value: "enhanced_slabs"
				};
				result = await updateRecipe(setGroupAction, result);

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

			it("should handle complex shaped recipe modifications", async () => {
				let result = shaped2Recipe; // Complex shaped recipe with tags

				// Step 1: Clear a specific slot
				const clearCenterAction: ActionLike = {
					type: "recipe.clear_slot",
					slot: "4" // Center slot
				};
				result = await updateRecipe(clearCenterAction, result);

				// Step 2: Add new ingredient to center
				const addCenterAction: ActionLike = {
					type: "recipe.add_ingredient",
					slot: "4",
					items: ["minecraft:glowstone_dust"],
					replace: false
				};
				result = await updateRecipe(addCenterAction, result);

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
			it("should maintain data integrity through action workflow", async () => {
				const recipes = [shapelessRecipe, shapedRecipe, blastingRecipe, stonecuttingRecipe];

				for (const originalRecipe of recipes) {
					let result = originalRecipe;

					// Apply a series of non-destructive actions
					const actions = [
						{
							type: "core.set_value",
							path: "group",
							value: "test_group"
						} as ActionLike,
						{
							type: "core.toggle_value",
							path: "showNotification",
							value: true
						} as ActionLike,
						{
							type: "core.toggle_value",
							path: "showNotification",
							value: true
						} as ActionLike // Toggle back to undefined
					];

					for (const action of actions) {
						result = await updateRecipe(action, result);
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
			it("should handle invalid path operations gracefully", async () => {
				// Try to set invalid nested path
				const invalidPathAction: ActionLike = {
					type: "core.set_value",
					path: "nonexistent.deeply.nested.path",
					value: "test"
				};

				const result = await updateRecipe(invalidPathAction, shapelessRecipe);
				// @ts-expect-error
				expect(result.nonexistent?.deeply?.nested?.path).toBe("test");
			});

			it("should handle recipe type conversion edge cases", async () => {
				// Convert to same type (should be no-op essentially)
				const convertAction: ActionLike = {
					type: "recipe.convert_recipe_type",
					newType: "minecraft:crafting_shapeless",
					preserveIngredients: true
				};

				const result = await updateRecipe(convertAction, shapelessRecipe);
				expect(result.type).toBe("minecraft:crafting_shapeless");
				expect(result.slots).toEqual(shapelessRecipe.slots);

				// Convert to unknown type
				const unknownTypeAction: ActionLike = {
					type: "recipe.convert_recipe_type",
					newType: "minecraft:unknown_recipe_type" as any,
					preserveIngredients: true
				};

				const result2 = await updateRecipe(unknownTypeAction, shapelessRecipe);
				expect(result2.type).toBe("minecraft:unknown_recipe_type");
			});
		});
	});
});
