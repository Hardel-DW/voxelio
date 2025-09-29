import { updateData } from "@/core/engine/actions";
import { RecipeAction } from "@/core/engine/actions/domains/RecipeAction";
import type { RecipeProps } from "@/core/schema/recipe/types";
import { parseDatapack } from "@/core/engine/Parser";
import { recipeFile } from "@test/mock/datapack";
import { createZipFile } from "@test/mock/utils";
import { describe, it, expect, beforeEach } from "vitest";

// Helper function to update data with proper typing
function updateRecipe(action: any, recipe: RecipeProps, packVersion = 48): RecipeProps {
	const result = updateData(action, recipe, packVersion);
	expect(result).toBeDefined();
	return result as RecipeProps;
}

describe("Recipe Actions", () => {
	let shapedRecipe: RecipeProps;
	let shapelessRecipe: RecipeProps;
	let smeltingRecipe: RecipeProps;

	beforeEach(async () => {
		const parsedDatapack = await parseDatapack(await createZipFile(recipeFile));

		const recipes = Array.from(parsedDatapack.elements.values()).filter(
			(element): element is RecipeProps => element.identifier.registry === "recipe"
		);

		expect(recipes).toBeDefined();
		expect(recipes.length).toBeGreaterThan(0);

		// Trouve les recettes spécifiques
		const foundShaped = recipes.find((r) => r.identifier.resource === "shaped");
		const foundShapeless = recipes.find((r) => r.identifier.resource === "shapeless");
		const foundBlasting = recipes.find((r) => r.identifier.resource === "blasting");

		expect(foundShaped).toBeDefined();
		expect(foundShapeless).toBeDefined();
		expect(foundBlasting).toBeDefined();

		shapedRecipe = foundShaped as RecipeProps;
		shapelessRecipe = foundShapeless as RecipeProps;
		smeltingRecipe = foundBlasting as RecipeProps;
	});

	describe("Recipe Domain Actions", () => {
		describe("add_ingredient", () => {
			it("should add ingredient to empty slot", () => {
				expect(shapedRecipe.slots["2"]).toBeDefined();
				const action = RecipeAction.addIngredient("3", ["minecraft:emerald"]);

				const result = updateRecipe(action, shapedRecipe);
				expect(result.slots["3"]).toEqual(["minecraft:emerald"]);
				expect(result).not.toBe(shapedRecipe);
			});

			it("should merge ingredients with existing slot", () => {
				// Vérifie l'état initial
				const originalSlotZero = shapedRecipe.slots["0"];
				expect(originalSlotZero).toBeDefined();

				const action = RecipeAction.addIngredient("0", ["minecraft:emerald"]);

				const result = updateRecipe(action, shapedRecipe);
				expect(result.slots["0"]).toEqual(["minecraft:acacia_planks", "minecraft:emerald"]);

				// Vérifie que l'objet original n'a pas changé
				expect(shapedRecipe.slots["0"]).toEqual(originalSlotZero);
				expect(result).not.toBe(shapedRecipe);
			});

			it("should replace ingredients when replace=true", () => {
				const originalSlotZero = shapedRecipe.slots["0"];
				expect(originalSlotZero).toBeDefined();

				const action = RecipeAction.addIngredient("0", ["minecraft:emerald"], true);

				const result = updateRecipe(action, shapedRecipe);
				expect(result.slots["0"]).toEqual(["minecraft:emerald"]);

				expect(shapedRecipe.slots["0"]).toEqual(originalSlotZero);
				expect(result).not.toBe(shapedRecipe);
			});

			it("should avoid duplicate items when merging", () => {
				const recipeWithDuplicates = { ...shapedRecipe, slots: { "0": ["minecraft:diamond", "minecraft:stick"] } };

				const action = RecipeAction.addIngredient("0", ["minecraft:diamond", "minecraft:emerald"]);

				const result = updateRecipe(action, recipeWithDuplicates);
				expect(result.slots["0"]).toEqual(["minecraft:diamond", "minecraft:stick", "minecraft:emerald"]);
			});
		});

		describe("remove_ingredient", () => {
			it("should remove entire slot when no items specified", () => {
				expect(shapedRecipe.slots["0"]).toBeDefined();
				expect(shapedRecipe.slots["1"]).toBeDefined();
				const action = RecipeAction.removeIngredient("0");

				const result = updateRecipe(action, shapedRecipe);
				expect(result.slots["0"]).toBeUndefined();
				expect(result.slots["1"]).toEqual(shapedRecipe.slots["1"]);

				expect(shapedRecipe.slots["0"]).toEqual(["minecraft:acacia_planks"]);
				expect(shapedRecipe.slots["1"]).toEqual(["minecraft:acacia_planks"]);
				expect(result).not.toBe(shapedRecipe);
			});

			it("should remove specific items from slot", () => {
				const recipeWithMultipleItems = {
					...shapedRecipe,
					slots: { "0": ["minecraft:diamond", "minecraft:emerald", "minecraft:gold_ingot"] }
				};
				const action = RecipeAction.removeIngredient("0", ["minecraft:emerald"]);

				const result = updateRecipe(action, recipeWithMultipleItems);
				expect(result.slots["0"]).toEqual(["minecraft:diamond", "minecraft:gold_ingot"]);

				expect(recipeWithMultipleItems.slots["0"]).toEqual(["minecraft:diamond", "minecraft:emerald", "minecraft:gold_ingot"]);
				expect(result).not.toBe(recipeWithMultipleItems);
			});

			it("should remove slot when it becomes empty", () => {
				const recipeWithSingleItem = { ...shapedRecipe, slots: { "0": ["minecraft:diamond"] } };

				const action = RecipeAction.removeIngredient("0", ["minecraft:diamond"]);

				const result = updateRecipe(action, recipeWithSingleItem);
				expect(result.slots["0"]).toBeUndefined();
			});

			it("should handle removing from non-existent slot gracefully", () => {
				const action = RecipeAction.removeIngredient("99");

				const result = updateRecipe(action, shapedRecipe);
				expect(result.slots).toEqual(shapedRecipe.slots);
			});
		});

		describe("convert_recipe_type", () => {
			it("should convert shaped to shapeless", () => {
				expect(shapedRecipe.type).toBe("minecraft:crafting_shaped");
				expect(shapedRecipe.gridSize).toEqual({ width: 3, height: 1 });

				const action = RecipeAction.convertRecipeType("minecraft:crafting_shapeless");

				const result = updateRecipe(action, shapedRecipe);
				expect(result.type).toBe("minecraft:crafting_shapeless");
				expect(result.gridSize).toBeUndefined();
				expect(result.slots).toEqual(shapedRecipe.slots);

				expect(shapedRecipe.type).toBe("minecraft:crafting_shaped");
				expect(shapedRecipe.gridSize).toEqual({ width: 3, height: 1 });
				expect(result).not.toBe(shapedRecipe);
			});

			it("should convert shapeless to shaped with default grid", () => {
				expect(shapelessRecipe.type).toBe("minecraft:crafting_shapeless");
				expect(shapelessRecipe.gridSize).toBeUndefined();

				const action = RecipeAction.convertRecipeType("minecraft:crafting_shaped");

				const result = updateRecipe(action, shapelessRecipe);
				expect(result.type).toBe("minecraft:crafting_shaped");
				expect(result.gridSize).toEqual({ width: 3, height: 3 });

				expect(shapelessRecipe.type).toBe("minecraft:crafting_shapeless");
				expect(shapelessRecipe.gridSize).toBeUndefined();
				expect(result).not.toBe(shapelessRecipe);
			});

			it("should convert to smelting with single ingredient", () => {
				const originalSlots = shapedRecipe.slots;
				const firstSlotValue = Object.values(originalSlots)[0];

				const action = RecipeAction.convertRecipeType("minecraft:smelting");

				const result = updateRecipe(action, shapedRecipe);
				expect(result.type).toBe("minecraft:smelting");
				expect(result.gridSize).toBeUndefined();
				expect(result.slots).toEqual({ "0": firstSlotValue });

				expect(shapedRecipe.slots).toEqual(originalSlots);
				expect(result).not.toBe(shapedRecipe);
			});

			it("should convert to stonecutting and remove type-specific data", () => {
				const action = RecipeAction.convertRecipeType("minecraft:stonecutting");

				const originalSlots = smeltingRecipe.slots;
				const firstSlotValue = Object.values(originalSlots)[0];

				const result = updateRecipe(action, smeltingRecipe);
				expect(result.type).toBe("minecraft:stonecutting");
				expect(result.gridSize).toBeUndefined();
				expect(result.typeSpecific).toBeUndefined();
				expect(result.slots).toEqual({ "0": firstSlotValue });

				expect(smeltingRecipe.typeSpecific).toBeDefined();
				expect(result).not.toBe(smeltingRecipe);
			});
		});

		describe("clear_slot", () => {
			it("should clear a specific slot", () => {
				expect(shapedRecipe.slots["0"]).toEqual(["minecraft:acacia_planks"]);
				expect(shapedRecipe.slots["1"]).toEqual(["minecraft:acacia_planks"]);
				expect(shapedRecipe.slots["2"]).toEqual(["minecraft:acacia_planks"]);

				const action = RecipeAction.clearSlot("0");

				const result = updateRecipe(action, shapedRecipe);
				expect(result.slots["0"]).toBeUndefined();
				expect(result.slots["1"]).toEqual(["minecraft:acacia_planks"]);
				expect(result.slots["2"]).toEqual(["minecraft:acacia_planks"]);

				expect(shapedRecipe.slots["0"]).toEqual(["minecraft:acacia_planks"]);
				expect(shapedRecipe.slots["1"]).toEqual(["minecraft:acacia_planks"]);
				expect(shapedRecipe.slots["2"]).toEqual(["minecraft:acacia_planks"]);
				expect(result).not.toBe(shapedRecipe);
			});

			it("should handle clearing non-existent slot gracefully", () => {
				const action = RecipeAction.clearSlot("99");

				const result = updateRecipe(action, shapedRecipe);
				expect(result.slots).toEqual(shapedRecipe.slots);
			});
		});

		describe("add_shapeless_ingredient", () => {
			it("should add ingredient to shapeless recipe", () => {
				const originalSlots = shapelessRecipe.slots;
				const slotsCount = Object.keys(originalSlots).length;

				const action = RecipeAction.addShapelessIngredient(["minecraft:emerald"]);

				const result = updateRecipe(action, shapelessRecipe);
				expect(Object.keys(result.slots)).toHaveLength(slotsCount + 1);
				expect(result.slots[slotsCount.toString()]).toEqual(["minecraft:emerald"]);

				expect(shapelessRecipe.slots).toEqual(originalSlots);
				expect(result).not.toBe(shapelessRecipe);
			});

			it("should add tag to shapeless recipe", () => {
				const originalSlots = shapelessRecipe.slots;
				const slotsCount = Object.keys(originalSlots).length;

				const action = RecipeAction.addShapelessIngredient("#minecraft:logs");

				const result = updateRecipe(action, shapelessRecipe);
				expect(Object.keys(result.slots)).toHaveLength(slotsCount + 1);
				expect(result.slots[slotsCount.toString()]).toBe("#minecraft:logs");

				expect(shapelessRecipe.slots).toEqual(originalSlots);
				expect(result).not.toBe(shapelessRecipe);
			});

			it("should add multiple items to shapeless recipe", () => {
				const originalSlots = shapelessRecipe.slots;
				const slotsCount = Object.keys(originalSlots).length;

				const action = RecipeAction.addShapelessIngredient(["minecraft:emerald", "minecraft:diamond"]);

				const result = updateRecipe(action, shapelessRecipe);
				expect(Object.keys(result.slots)).toHaveLength(slotsCount + 1);
				expect(result.slots[slotsCount.toString()]).toEqual(["minecraft:emerald", "minecraft:diamond"]);

				expect(shapelessRecipe.slots).toEqual(originalSlots);
				expect(result).not.toBe(shapelessRecipe);
			});

			it("should ignore non-shapeless recipes", () => {
				const action = RecipeAction.addShapelessIngredient(["minecraft:emerald"]);

				const result = updateRecipe(action, shapedRecipe);
				expect(result.slots).toEqual(shapedRecipe.slots);
				expect(result).not.toBe(shapedRecipe);
			});
		});

		describe("remove_item_everywhere", () => {
			it("should remove items from all slots", () => {
				const testRecipe = {
					...shapedRecipe,
					slots: {
						"0": ["minecraft:acacia_planks", "minecraft:oak_planks"],
						"1": ["minecraft:stone"],
						"2": "#minecraft:logs",
						"3": ["minecraft:acacia_planks"]
					}
				};

				const action = RecipeAction.removeItemEverywhere(["minecraft:acacia_planks"]);

				const result = updateRecipe(action, testRecipe);
				expect(result.slots["0"]).toEqual(["minecraft:oak_planks"]);
				expect(result.slots["1"]).toEqual(["minecraft:stone"]);
				expect(result.slots["2"]).toBe("#minecraft:logs");
				expect(result.slots["3"]).toBeUndefined(); // Slot supprimé car vide

				expect(testRecipe.slots["0"]).toEqual(["minecraft:acacia_planks", "minecraft:oak_planks"]);
				expect(result).not.toBe(testRecipe);
			});

			it("should remove tags from slots", () => {
				const testRecipe = {
					...shapedRecipe,
					slots: {
						"0": ["minecraft:oak_planks"],
						"1": "#minecraft:logs",
						"2": ["minecraft:stone"]
					}
				};

				const action = RecipeAction.removeItemEverywhere(["#minecraft:logs"]);

				const result = updateRecipe(action, testRecipe);
				expect(result.slots["0"]).toEqual(["minecraft:oak_planks"]);
				expect(result.slots["1"]).toBeUndefined(); // Slot supprimé
				expect(result.slots["2"]).toEqual(["minecraft:stone"]);

				expect(testRecipe.slots["1"]).toBe("#minecraft:logs");
				expect(result).not.toBe(testRecipe);
			});

			it("should remove multiple items at once", () => {
				const testRecipe = {
					...shapedRecipe,
					slots: {
						"0": ["minecraft:oak_planks", "minecraft:birch_planks", "minecraft:stone"],
						"1": ["minecraft:oak_planks"],
						"2": ["minecraft:diamond"]
					}
				};

				const action = RecipeAction.removeItemEverywhere(["minecraft:oak_planks", "minecraft:birch_planks"]);

				const result = updateRecipe(action, testRecipe);
				expect(result.slots["0"]).toEqual(["minecraft:stone"]);
				expect(result.slots["1"]).toBeUndefined(); // Slot supprimé car vide
				expect(result.slots["2"]).toEqual(["minecraft:diamond"]);

				expect(testRecipe.slots["0"]).toEqual(["minecraft:oak_planks", "minecraft:birch_planks", "minecraft:stone"]);
				expect(result).not.toBe(testRecipe);
			});
		});

		describe("replace_item_everywhere", () => {
			it("should replace items in array slots", () => {
				const testRecipe = {
					...shapedRecipe,
					slots: {
						"0": ["minecraft:oak_planks", "minecraft:stone"],
						"1": ["minecraft:oak_planks"],
						"2": ["minecraft:diamond"]
					}
				};

				const action = RecipeAction.replaceItemEverywhere("minecraft:oak_planks", "minecraft:birch_planks");

				const result = updateRecipe(action, testRecipe);
				expect(result.slots["0"]).toEqual(["minecraft:birch_planks", "minecraft:stone"]);
				expect(result.slots["1"]).toEqual(["minecraft:birch_planks"]);
				expect(result.slots["2"]).toEqual(["minecraft:diamond"]);

				expect(testRecipe.slots["0"]).toEqual(["minecraft:oak_planks", "minecraft:stone"]);
				expect(result).not.toBe(testRecipe);
			});

			it("should replace tags with items and transform to array", () => {
				const testRecipe = {
					...shapedRecipe,
					slots: {
						"0": "#minecraft:logs",
						"1": ["minecraft:stone"],
						"2": "#minecraft:logs"
					}
				};

				const action = RecipeAction.replaceItemEverywhere("#minecraft:logs", "minecraft:oak_log");

				const result = updateRecipe(action, testRecipe);
				expect(result.slots["0"]).toEqual(["minecraft:oak_log"]); // Tag → Item = array
				expect(result.slots["1"]).toEqual(["minecraft:stone"]);
				expect(result.slots["2"]).toEqual(["minecraft:oak_log"]); // Tag → Item = array

				expect(testRecipe.slots["0"]).toBe("#minecraft:logs");
				expect(result).not.toBe(testRecipe);
			});

			it("should remove duplicates after replacement", () => {
				const testRecipe = {
					...shapedRecipe,
					slots: {
						"0": ["minecraft:oak_planks", "minecraft:birch_planks", "minecraft:oak_planks"],
						"1": ["minecraft:stone"]
					}
				};

				const action = RecipeAction.replaceItemEverywhere("minecraft:birch_planks", "minecraft:oak_planks");

				const result = updateRecipe(action, testRecipe);
				expect(result.slots["0"]).toEqual(["minecraft:oak_planks"]); // Duplicatas supprimés
				expect(result.slots["1"]).toEqual(["minecraft:stone"]);

				expect(testRecipe.slots["0"]).toEqual(["minecraft:oak_planks", "minecraft:birch_planks", "minecraft:oak_planks"]);
				expect(result).not.toBe(testRecipe);
			});

			it("should replace items with tags and transform to string", () => {
				const testRecipe = {
					...shapedRecipe,
					slots: {
						"0": ["minecraft:oak_log"], // Seul item dans le slot
						"1": ["minecraft:oak_log", "minecraft:stone"], // Plusieurs items
						"2": ["minecraft:birch_log"]
					}
				};

				const action = RecipeAction.replaceItemEverywhere("minecraft:oak_log", "#minecraft:logs");

				const result = updateRecipe(action, testRecipe);
				expect(result.slots["0"]).toBe("#minecraft:logs"); // Item seul → Tag = string
				expect(result.slots["1"]).toEqual("#minecraft:logs"); // The first tags will be taken. The slots cannot mixed tags and items in array.
				expect(result.slots["2"]).toEqual(["minecraft:birch_log"]); // Non affecté

				expect(testRecipe.slots["0"]).toEqual(["minecraft:oak_log"]);
				expect(result).not.toBe(testRecipe);
			});
		});
	});

	describe("Complex Recipe Operations", () => {
		it("should preserve identifier through recipe actions", () => {
			const action = RecipeAction.addIngredient("5", ["minecraft:coal"]);

			const result = updateRecipe(action, shapedRecipe);
			expect(result.identifier).toBeDefined();
			expect(shapedRecipe.identifier).toEqual(result.identifier);
		});

		it("should handle complex type conversion", () => {
			const complexRecipe = {
				...shapedRecipe,
				type: "minecraft:crafting_shaped" as const,
				slots: {
					"0": ["minecraft:coal", "minecraft:charcoal"],
					"1": ["minecraft:stick"],
					"3": ["minecraft:stick"],
					"4": ["minecraft:stick"],
					"5": ["minecraft:stick"]
				},
				gridSize: { width: 3, height: 2 }
			};

			const action = RecipeAction.convertRecipeType("minecraft:campfire_cooking");

			const result = updateRecipe(action, complexRecipe);
			expect(result.type).toBe("minecraft:campfire_cooking");
			expect(result.slots).toEqual({ "0": ["minecraft:coal"] });
			expect(result.gridSize).toBeUndefined();
		});
	});
});