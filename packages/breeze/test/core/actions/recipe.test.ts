import { updateData } from "@/core/engine/actions";
import type { RecipeAction } from "@/core/engine/actions/domains/RecipeAction";
import type { RecipeProps } from "@/core/schema/recipe/types";
import { parseDatapack } from "@/core/engine/Parser";
import { recipeFile } from "@test/mock/datapack";
import { createZipFile } from "@test/mock/utils";
import { describe, it, expect, beforeEach } from "vitest";

// Helper function to update data with proper typing
async function updateRecipe(action: any, recipe: RecipeProps, packVersion = 48): Promise<RecipeProps> {
	const result = await updateData(action, recipe, packVersion);
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
			it("should add ingredient to empty slot", async () => {
				expect(shapedRecipe.slots["2"]).toBeDefined();
				const action: RecipeAction = {
					type: "recipe.add_ingredient",
					slot: "3",
					items: ["minecraft:emerald"]
				};

				const result = await updateRecipe(action, shapedRecipe);
				expect(result.slots["3"]).toEqual(["minecraft:emerald"]);
				expect(result).not.toBe(shapedRecipe);
			});

			it("should merge ingredients with existing slot", async () => {
				// Vérifie l'état initial
				const originalSlotZero = shapedRecipe.slots["0"];
				expect(originalSlotZero).toBeDefined();

				const action: RecipeAction = {
					type: "recipe.add_ingredient",
					slot: "0",
					items: ["minecraft:emerald"]
				};

				const result = await updateRecipe(action, shapedRecipe);
				expect(result.slots["0"]).toEqual(["minecraft:acacia_planks", "minecraft:emerald"]);

				// Vérifie que l'objet original n'a pas changé
				expect(shapedRecipe.slots["0"]).toEqual(originalSlotZero);
				expect(result).not.toBe(shapedRecipe);
			});

			it("should replace ingredients when replace=true", async () => {
				const originalSlotZero = shapedRecipe.slots["0"];
				expect(originalSlotZero).toBeDefined();

				const action: RecipeAction = {
					type: "recipe.add_ingredient",
					slot: "0",
					items: ["minecraft:emerald"],
					replace: true
				};

				const result = await updateRecipe(action, shapedRecipe);
				expect(result.slots["0"]).toEqual(["minecraft:emerald"]);

				expect(shapedRecipe.slots["0"]).toEqual(originalSlotZero);
				expect(result).not.toBe(shapedRecipe);
			});

			it("should avoid duplicate items when merging", async () => {
				const recipeWithDuplicates = { ...shapedRecipe, slots: { "0": ["minecraft:diamond", "minecraft:stick"] } };

				const action: RecipeAction = {
					type: "recipe.add_ingredient",
					slot: "0",
					items: ["minecraft:diamond", "minecraft:emerald"] // diamond déjà présent
				};

				const result = await updateRecipe(action, recipeWithDuplicates);
				expect(result.slots["0"]).toEqual(["minecraft:diamond", "minecraft:stick", "minecraft:emerald"]);
			});
		});

		describe("remove_ingredient", () => {
			it("should remove entire slot when no items specified", async () => {
				expect(shapedRecipe.slots["0"]).toBeDefined();
				expect(shapedRecipe.slots["1"]).toBeDefined();
				const action: RecipeAction = {
					type: "recipe.remove_ingredient",
					slot: "0"
				};

				const result = await updateRecipe(action, shapedRecipe);
				expect(result.slots["0"]).toBeUndefined();
				expect(result.slots["1"]).toEqual(shapedRecipe.slots["1"]);

				expect(shapedRecipe.slots["0"]).toEqual(["minecraft:acacia_planks"]);
				expect(shapedRecipe.slots["1"]).toEqual(["minecraft:acacia_planks"]);
				expect(result).not.toBe(shapedRecipe);
			});

			it("should remove specific items from slot", async () => {
				const recipeWithMultipleItems = {
					...shapedRecipe,
					slots: { "0": ["minecraft:diamond", "minecraft:emerald", "minecraft:gold_ingot"] }
				};
				const action: RecipeAction = {
					type: "recipe.remove_ingredient",
					slot: "0",
					items: ["minecraft:emerald"]
				};

				const result = await updateRecipe(action, recipeWithMultipleItems);
				expect(result.slots["0"]).toEqual(["minecraft:diamond", "minecraft:gold_ingot"]);

				expect(recipeWithMultipleItems.slots["0"]).toEqual(["minecraft:diamond", "minecraft:emerald", "minecraft:gold_ingot"]);
				expect(result).not.toBe(recipeWithMultipleItems);
			});

			it("should remove slot when it becomes empty", async () => {
				const recipeWithSingleItem = { ...shapedRecipe, slots: { "0": ["minecraft:diamond"] } };

				const action: RecipeAction = {
					type: "recipe.remove_ingredient",
					slot: "0",
					items: ["minecraft:diamond"]
				};

				const result = await updateRecipe(action, recipeWithSingleItem);
				expect(result.slots["0"]).toBeUndefined();
			});

			it("should handle removing from non-existent slot gracefully", async () => {
				const action: RecipeAction = {
					type: "recipe.remove_ingredient",
					slot: "99"
				};

				const result = await updateRecipe(action, shapedRecipe);
				expect(result.slots).toEqual(shapedRecipe.slots);
			});
		});

		describe("convert_recipe_type", () => {
			it("should convert shaped to shapeless", async () => {
				expect(shapedRecipe.type).toBe("minecraft:crafting_shaped");
				expect(shapedRecipe.gridSize).toEqual({ width: 3, height: 1 });

				const action: RecipeAction = {
					type: "recipe.convert_recipe_type",
					newType: "minecraft:crafting_shapeless"
				};

				const result = await updateRecipe(action, shapedRecipe);
				expect(result.type).toBe("minecraft:crafting_shapeless");
				expect(result.gridSize).toBeUndefined();
				expect(result.slots).toEqual(shapedRecipe.slots);

				expect(shapedRecipe.type).toBe("minecraft:crafting_shaped");
				expect(shapedRecipe.gridSize).toEqual({ width: 3, height: 1 });
				expect(result).not.toBe(shapedRecipe);
			});

			it("should convert shapeless to shaped with default grid", async () => {
				expect(shapelessRecipe.type).toBe("minecraft:crafting_shapeless");
				expect(shapelessRecipe.gridSize).toBeUndefined();

				const action: RecipeAction = {
					type: "recipe.convert_recipe_type",
					newType: "minecraft:crafting_shaped"
				};

				const result = await updateRecipe(action, shapelessRecipe);
				expect(result.type).toBe("minecraft:crafting_shaped");
				expect(result.gridSize).toEqual({ width: 3, height: 3 });

				expect(shapelessRecipe.type).toBe("minecraft:crafting_shapeless");
				expect(shapelessRecipe.gridSize).toBeUndefined();
				expect(result).not.toBe(shapelessRecipe);
			});

			it("should convert to smelting with single ingredient", async () => {
				const originalSlots = shapedRecipe.slots;
				const firstSlotValue = Object.values(originalSlots)[0];

				const action: RecipeAction = {
					type: "recipe.convert_recipe_type",
					newType: "minecraft:smelting"
				};

				const result = await updateRecipe(action, shapedRecipe);
				expect(result.type).toBe("minecraft:smelting");
				expect(result.gridSize).toBeUndefined();
				expect(result.slots).toEqual({ "0": firstSlotValue });

				expect(shapedRecipe.slots).toEqual(originalSlots);
				expect(result).not.toBe(shapedRecipe);
			});

			it("should convert to stonecutting and remove type-specific data", async () => {
				const action: RecipeAction = {
					type: "recipe.convert_recipe_type",
					newType: "minecraft:stonecutting"
				};

				const originalSlots = smeltingRecipe.slots;
				const firstSlotValue = Object.values(originalSlots)[0];

				const result = await updateRecipe(action, smeltingRecipe);
				expect(result.type).toBe("minecraft:stonecutting");
				expect(result.gridSize).toBeUndefined();
				expect(result.typeSpecific).toBeUndefined();
				expect(result.slots).toEqual({ "0": firstSlotValue });

				expect(smeltingRecipe.typeSpecific).toBeDefined();
				expect(result).not.toBe(smeltingRecipe);
			});
		});

		describe("clear_slot", () => {
			it("should clear a specific slot", async () => {
				expect(shapedRecipe.slots["0"]).toEqual(["minecraft:acacia_planks"]);
				expect(shapedRecipe.slots["1"]).toEqual(["minecraft:acacia_planks"]);
				expect(shapedRecipe.slots["2"]).toEqual(["minecraft:acacia_planks"]);

				const action: RecipeAction = {
					type: "recipe.clear_slot",
					slot: "0"
				};

				const result = await updateRecipe(action, shapedRecipe);
				expect(result.slots["0"]).toBeUndefined();
				expect(result.slots["1"]).toEqual(["minecraft:acacia_planks"]);
				expect(result.slots["2"]).toEqual(["minecraft:acacia_planks"]);

				expect(shapedRecipe.slots["0"]).toEqual(["minecraft:acacia_planks"]);
				expect(shapedRecipe.slots["1"]).toEqual(["minecraft:acacia_planks"]);
				expect(shapedRecipe.slots["2"]).toEqual(["minecraft:acacia_planks"]);
				expect(result).not.toBe(shapedRecipe);
			});

			it("should handle clearing non-existent slot gracefully", async () => {
				const action: RecipeAction = {
					type: "recipe.clear_slot",
					slot: "99"
				};

				const result = await updateRecipe(action, shapedRecipe);
				expect(result.slots).toEqual(shapedRecipe.slots);
			});
		});

		describe("add_shapeless_ingredient", () => {
			it("should add ingredient to shapeless recipe", async () => {
				const originalSlots = shapelessRecipe.slots;
				const slotsCount = Object.keys(originalSlots).length;

				const action: RecipeAction = {
					type: "recipe.add_shapeless_ingredient",
					items: ["minecraft:emerald"]
				};

				const result = await updateRecipe(action, shapelessRecipe);
				expect(Object.keys(result.slots)).toHaveLength(slotsCount + 1);
				expect(result.slots[slotsCount.toString()]).toEqual(["minecraft:emerald"]);

				expect(shapelessRecipe.slots).toEqual(originalSlots);
				expect(result).not.toBe(shapelessRecipe);
			});

			it("should add tag to shapeless recipe", async () => {
				const originalSlots = shapelessRecipe.slots;
				const slotsCount = Object.keys(originalSlots).length;

				const action: RecipeAction = {
					type: "recipe.add_shapeless_ingredient",
					items: "#minecraft:logs"
				};

				const result = await updateRecipe(action, shapelessRecipe);
				expect(Object.keys(result.slots)).toHaveLength(slotsCount + 1);
				expect(result.slots[slotsCount.toString()]).toBe("#minecraft:logs");

				expect(shapelessRecipe.slots).toEqual(originalSlots);
				expect(result).not.toBe(shapelessRecipe);
			});

			it("should add multiple items to shapeless recipe", async () => {
				const originalSlots = shapelessRecipe.slots;
				const slotsCount = Object.keys(originalSlots).length;

				const action: RecipeAction = {
					type: "recipe.add_shapeless_ingredient",
					items: ["minecraft:emerald", "minecraft:diamond"]
				};

				const result = await updateRecipe(action, shapelessRecipe);
				expect(Object.keys(result.slots)).toHaveLength(slotsCount + 1);
				expect(result.slots[slotsCount.toString()]).toEqual(["minecraft:emerald", "minecraft:diamond"]);

				expect(shapelessRecipe.slots).toEqual(originalSlots);
				expect(result).not.toBe(shapelessRecipe);
			});

			it("should ignore non-shapeless recipes", async () => {
				const action: RecipeAction = {
					type: "recipe.add_shapeless_ingredient",
					items: ["minecraft:emerald"]
				};

				const result = await updateRecipe(action, shapedRecipe);
				expect(result.slots).toEqual(shapedRecipe.slots);
				expect(result).not.toBe(shapedRecipe);
			});
		});

		describe("remove_item_everywhere", () => {
			it("should remove items from all slots", async () => {
				const testRecipe = {
					...shapedRecipe,
					slots: {
						"0": ["minecraft:acacia_planks", "minecraft:oak_planks"],
						"1": ["minecraft:stone"],
						"2": "#minecraft:logs",
						"3": ["minecraft:acacia_planks"]
					}
				};

				const action: RecipeAction = {
					type: "recipe.remove_item_everywhere",
					items: ["minecraft:acacia_planks"]
				};

				const result = await updateRecipe(action, testRecipe);
				expect(result.slots["0"]).toEqual(["minecraft:oak_planks"]);
				expect(result.slots["1"]).toEqual(["minecraft:stone"]);
				expect(result.slots["2"]).toBe("#minecraft:logs");
				expect(result.slots["3"]).toBeUndefined(); // Slot supprimé car vide

				expect(testRecipe.slots["0"]).toEqual(["minecraft:acacia_planks", "minecraft:oak_planks"]);
				expect(result).not.toBe(testRecipe);
			});

			it("should remove tags from slots", async () => {
				const testRecipe = {
					...shapedRecipe,
					slots: {
						"0": ["minecraft:oak_planks"],
						"1": "#minecraft:logs",
						"2": ["minecraft:stone"]
					}
				};

				const action: RecipeAction = {
					type: "recipe.remove_item_everywhere",
					items: ["#minecraft:logs"]
				};

				const result = await updateRecipe(action, testRecipe);
				expect(result.slots["0"]).toEqual(["minecraft:oak_planks"]);
				expect(result.slots["1"]).toBeUndefined(); // Slot supprimé
				expect(result.slots["2"]).toEqual(["minecraft:stone"]);

				expect(testRecipe.slots["1"]).toBe("#minecraft:logs");
				expect(result).not.toBe(testRecipe);
			});

			it("should remove multiple items at once", async () => {
				const testRecipe = {
					...shapedRecipe,
					slots: {
						"0": ["minecraft:oak_planks", "minecraft:birch_planks", "minecraft:stone"],
						"1": ["minecraft:oak_planks"],
						"2": ["minecraft:diamond"]
					}
				};

				const action: RecipeAction = {
					type: "recipe.remove_item_everywhere",
					items: ["minecraft:oak_planks", "minecraft:birch_planks"]
				};

				const result = await updateRecipe(action, testRecipe);
				expect(result.slots["0"]).toEqual(["minecraft:stone"]);
				expect(result.slots["1"]).toBeUndefined(); // Slot supprimé car vide
				expect(result.slots["2"]).toEqual(["minecraft:diamond"]);

				expect(testRecipe.slots["0"]).toEqual(["minecraft:oak_planks", "minecraft:birch_planks", "minecraft:stone"]);
				expect(result).not.toBe(testRecipe);
			});
		});

		describe("replace_item_everywhere", () => {
			it("should replace items in array slots", async () => {
				const testRecipe = {
					...shapedRecipe,
					slots: {
						"0": ["minecraft:oak_planks", "minecraft:stone"],
						"1": ["minecraft:oak_planks"],
						"2": ["minecraft:diamond"]
					}
				};

				const action: RecipeAction = {
					type: "recipe.replace_item_everywhere",
					from: "minecraft:oak_planks",
					to: "minecraft:birch_planks"
				};

				const result = await updateRecipe(action, testRecipe);
				expect(result.slots["0"]).toEqual(["minecraft:birch_planks", "minecraft:stone"]);
				expect(result.slots["1"]).toEqual(["minecraft:birch_planks"]);
				expect(result.slots["2"]).toEqual(["minecraft:diamond"]);

				expect(testRecipe.slots["0"]).toEqual(["minecraft:oak_planks", "minecraft:stone"]);
				expect(result).not.toBe(testRecipe);
			});

			it("should replace tags with items and transform to array", async () => {
				const testRecipe = {
					...shapedRecipe,
					slots: {
						"0": "#minecraft:logs",
						"1": ["minecraft:stone"],
						"2": "#minecraft:logs"
					}
				};

				const action: RecipeAction = {
					type: "recipe.replace_item_everywhere",
					from: "#minecraft:logs",
					to: "minecraft:oak_log"
				};

				const result = await updateRecipe(action, testRecipe);
				expect(result.slots["0"]).toEqual(["minecraft:oak_log"]); // Tag → Item = array
				expect(result.slots["1"]).toEqual(["minecraft:stone"]);
				expect(result.slots["2"]).toEqual(["minecraft:oak_log"]); // Tag → Item = array

				expect(testRecipe.slots["0"]).toBe("#minecraft:logs");
				expect(result).not.toBe(testRecipe);
			});

			it("should remove duplicates after replacement", async () => {
				const testRecipe = {
					...shapedRecipe,
					slots: {
						"0": ["minecraft:oak_planks", "minecraft:birch_planks", "minecraft:oak_planks"],
						"1": ["minecraft:stone"]
					}
				};

				const action: RecipeAction = {
					type: "recipe.replace_item_everywhere",
					from: "minecraft:birch_planks",
					to: "minecraft:oak_planks"
				};

				const result = await updateRecipe(action, testRecipe);
				expect(result.slots["0"]).toEqual(["minecraft:oak_planks"]); // Duplicatas supprimés
				expect(result.slots["1"]).toEqual(["minecraft:stone"]);

				expect(testRecipe.slots["0"]).toEqual(["minecraft:oak_planks", "minecraft:birch_planks", "minecraft:oak_planks"]);
				expect(result).not.toBe(testRecipe);
			});

			it("should replace items with tags and transform to string", async () => {
				const testRecipe = {
					...shapedRecipe,
					slots: {
						"0": ["minecraft:oak_log"], // Seul item dans le slot
						"1": ["minecraft:oak_log", "minecraft:stone"], // Plusieurs items
						"2": ["minecraft:birch_log"]
					}
				};

				const action: RecipeAction = {
					type: "recipe.replace_item_everywhere",
					from: "minecraft:oak_log",
					to: "#minecraft:logs"
				};

				const result = await updateRecipe(action, testRecipe);
				expect(result.slots["0"]).toBe("#minecraft:logs"); // Item seul → Tag = string
				expect(result.slots["1"]).toEqual("#minecraft:logs"); // The first tags will be taken. The slots cannot mixed tags and items in array.
				expect(result.slots["2"]).toEqual(["minecraft:birch_log"]); // Non affecté

				expect(testRecipe.slots["0"]).toEqual(["minecraft:oak_log"]);
				expect(result).not.toBe(testRecipe);
			});
		});
	});

	describe("Complex Recipe Operations", () => {
		it("should handle sequential recipe modifications", async () => {
			const sequentialAction = {
				type: "core.sequential",
				actions: [
					{
						type: "recipe.add_ingredient",
						slot: "3",
						items: ["minecraft:emerald"]
					},
					{
						type: "recipe.remove_ingredient",
						slot: "1"
					}
				]
			};

			const result = await updateRecipe(sequentialAction, shapedRecipe);
			expect(result.slots["3"]).toEqual(["minecraft:emerald"]);
			expect(result.slots["1"]).toBeUndefined();

			expect(shapedRecipe.slots["0"]).toEqual(["minecraft:acacia_planks"]);
			expect(shapedRecipe.slots["1"]).toEqual(["minecraft:acacia_planks"]);
			expect(shapedRecipe.slots["2"]).toEqual(["minecraft:acacia_planks"]);
			expect(result).not.toBe(shapedRecipe);
		});

		it("should preserve identifier through recipe actions", async () => {
			const action: RecipeAction = {
				type: "recipe.add_ingredient",
				slot: "5",
				items: ["minecraft:coal"]
			};

			const result = await updateRecipe(action, shapedRecipe);
			expect(result.identifier).toBeDefined();
			expect(shapedRecipe.identifier).toEqual(result.identifier);
		});

		it("should handle complex type conversion", async () => {
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

			const action: RecipeAction = {
				type: "recipe.convert_recipe_type",
				newType: "minecraft:campfire_cooking"
			};

			const result = await updateRecipe(action, complexRecipe);
			expect(result.type).toBe("minecraft:campfire_cooking");
			expect(result.slots).toEqual({ "0": ["minecraft:coal"] });
			expect(result.gridSize).toBeUndefined();
		});
	});
});
