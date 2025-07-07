import { describe, it, expect, beforeEach } from "vitest";
import { parseDatapack } from "@/core/engine/Parser";
import { recipeFile } from "@test/template/datapack";
import type { RecipeProps } from "@/core/schema/recipe/types";
import { createZipFile } from "@test/template/utils";

describe("Recipe Schema", () => {
	let parsedDatapack: Awaited<ReturnType<typeof parseDatapack>>;
	let recipes: RecipeProps[];

	beforeEach(async () => {
		// 1. Parse the datapack from zip file
		parsedDatapack = await parseDatapack(await createZipFile(recipeFile));

		// Extract the parsed recipes from elements Map
		recipes = Array.from(parsedDatapack.elements.values()).filter(
			(element): element is RecipeProps => element.identifier.registry === "recipe"
		);

		expect(recipes).toBeDefined();
		expect(recipes).toHaveLength(11);
	});

	describe("Shaped Crafting Recipes", () => {
		it("should parse simple shaped recipe (###)", () => {
			const shapedRecipe = recipes.find((r) => r.identifier.resource === "shaped");
			expect(shapedRecipe).toBeDefined();
			if (!shapedRecipe) return;

			expect(shapedRecipe.type).toBe("minecraft:crafting_shaped");
			expect(shapedRecipe.gridSize).toEqual({ width: 3, height: 1 });

			// Should have slots 0, 1, 2 filled with acacia_planks
			expect(shapedRecipe.slots["0"]).toEqual(["minecraft:acacia_planks"]);
			expect(shapedRecipe.slots["1"]).toEqual(["minecraft:acacia_planks"]);
			expect(shapedRecipe.slots["2"]).toEqual(["minecraft:acacia_planks"]);

			// Other slots should be empty
			expect(shapedRecipe.slots["3"]).toBeUndefined();

			expect(shapedRecipe.result.item).toBe("minecraft:acacia_slab");
			expect(shapedRecipe.result.count).toBe(6);
		});

		it("should parse complex shaped recipe (compass pattern)", () => {
			const shaped2Recipe = recipes.find((r) => r.identifier.resource === "shaped2");
			expect(shaped2Recipe).toBeDefined();
			if (!shaped2Recipe) return;

			expect(shaped2Recipe.type).toBe("minecraft:crafting_shaped");
			expect(shaped2Recipe.gridSize).toEqual({ width: 3, height: 3 });

			// Pattern should be: " # ", "#X#", " # "
			// Slots: 1=iron, 3=iron, 4=redstone, 5=iron, 7=iron
			expect(shaped2Recipe.slots["1"]).toBe("#minecraft:iron_ingot"); // top center
			expect(shaped2Recipe.slots["3"]).toBe("#minecraft:iron_ingot"); // middle left
			expect(shaped2Recipe.slots["4"]).toEqual(["minecraft:redstone"]); // middle center
			expect(shaped2Recipe.slots["5"]).toBe("#minecraft:iron_ingot"); // middle right
			expect(shaped2Recipe.slots["7"]).toBe("#minecraft:iron_ingot"); // bottom center

			// Empty slots should be undefined
			expect(shaped2Recipe.slots["0"]).toBeUndefined(); // top left
			expect(shaped2Recipe.slots["2"]).toBeUndefined(); // top right
			expect(shaped2Recipe.slots["6"]).toBeUndefined(); // bottom left
			expect(shaped2Recipe.slots["8"]).toBeUndefined(); // bottom right

			expect(shaped2Recipe.result.item).toBe("minecraft:compass");
			expect(shaped2Recipe.result.count).toBe(1);
		});

		it("should parse 2x2 shaped recipe", () => {
			const twoByTwoRecipe = recipes.find((r) => r.identifier.resource === "shaped_two_by_two");
			expect(twoByTwoRecipe).toBeDefined();
			if (!twoByTwoRecipe) return;

			expect(twoByTwoRecipe.type).toBe("minecraft:crafting_shaped");
			expect(twoByTwoRecipe.gridSize).toEqual({ width: 2, height: 2 });

			// All 4 slots should be filled with chicken
			expect(twoByTwoRecipe.slots["0"]).toEqual(["minecraft:chicken"]);
			expect(twoByTwoRecipe.slots["1"]).toEqual(["minecraft:chicken"]);
			expect(twoByTwoRecipe.slots["3"]).toEqual(["minecraft:chicken"]);
			expect(twoByTwoRecipe.slots["4"]).toEqual(["minecraft:chicken"]);

			expect(twoByTwoRecipe.result.item).toBe("minecraft:acacia_button");
			expect(twoByTwoRecipe.result.count).toBe(1);
		});

		it("should parse shaped recipe with empty lines", () => {
			const emptyLineRecipe = recipes.find((r) => r.identifier.resource === "shaped_empty_line");
			expect(emptyLineRecipe).toBeDefined();
			if (!emptyLineRecipe) return;

			expect(emptyLineRecipe.type).toBe("minecraft:crafting_shaped");
			expect(emptyLineRecipe.gridSize).toEqual({ width: 3, height: 3 });

			// Pattern: "XXX", "   ", "XXX" - should have filled slots 0,1,2,6,7,8
			expect(emptyLineRecipe.slots["0"]).toEqual(["minecraft:chicken"]);
			expect(emptyLineRecipe.slots["1"]).toEqual(["minecraft:chicken"]);
			expect(emptyLineRecipe.slots["2"]).toEqual(["minecraft:chicken"]);
			expect(emptyLineRecipe.slots["6"]).toEqual(["minecraft:chicken"]);
			expect(emptyLineRecipe.slots["7"]).toEqual(["minecraft:chicken"]);
			expect(emptyLineRecipe.slots["8"]).toEqual(["minecraft:chicken"]);

			// Middle row should be empty
			expect(emptyLineRecipe.slots["3"]).toBeUndefined();
			expect(emptyLineRecipe.slots["4"]).toBeUndefined();
			expect(emptyLineRecipe.slots["5"]).toBeUndefined();
		});

		it("should normalize recipe types and ingredients without namespace", () => {
			const noNamespaceRecipe = recipes.find((r) => r.identifier.resource === "shaped_no_namespace");
			expect(noNamespaceRecipe).toBeDefined();
			if (!noNamespaceRecipe) return;

			// Type should be normalized
			expect(noNamespaceRecipe.type).toBe("minecraft:crafting_shaped");

			// Ingredients should be normalized
			expect(noNamespaceRecipe.slots["1"]).toEqual(["minecraft:iron_ingot"]);
			expect(noNamespaceRecipe.slots["3"]).toEqual(["minecraft:iron_ingot"]);
			expect(noNamespaceRecipe.slots["4"]).toEqual(["minecraft:redstone"]);
			expect(noNamespaceRecipe.slots["5"]).toEqual(["minecraft:iron_ingot"]);
			expect(noNamespaceRecipe.slots["7"]).toEqual(["minecraft:iron_ingot"]);

			// Result should be normalized
			expect(noNamespaceRecipe.result.item).toBe("minecraft:compass");
		});
	});

	describe("Shapeless Crafting Recipes", () => {
		it("should parse shapeless recipe", () => {
			const shapelessRecipe = recipes.find((r) => r.identifier.resource === "shapeless");
			expect(shapelessRecipe).toBeDefined();
			if (!shapelessRecipe) return;

			expect(shapelessRecipe.type).toBe("minecraft:crafting_shapeless");

			// Should have first slot filled with acacia logs tag
			expect(shapelessRecipe.slots["0"]).toBe("#minecraft:acacia_logs");

			expect(shapelessRecipe.result.item).toBe("minecraft:acacia_planks");
			expect(shapelessRecipe.result.count).toBe(4);
		});
	});

	describe("Smelting Recipes", () => {
		it("should parse blasting recipe", () => {
			const blastingRecipe = recipes.find((r) => r.identifier.resource === "blasting");
			expect(blastingRecipe).toBeDefined();
			if (!blastingRecipe) return;

			expect(blastingRecipe.type).toBe("minecraft:blasting");

			expect(blastingRecipe.slots["0"]).toEqual(["minecraft:iron_ore"]);
			expect(blastingRecipe.typeSpecific).toMatchObject({
				experience: 0.7,
				cookingTime: 100
			});

			expect(blastingRecipe.result.item).toBe("minecraft:iron_ingot");
		});

		it("should parse campfire cooking recipe", () => {
			const campfireRecipe = recipes.find((r) => r.identifier.resource === "campfire_cooking");
			expect(campfireRecipe).toBeDefined();
			if (!campfireRecipe) return;

			expect(campfireRecipe.type).toBe("minecraft:campfire_cooking");

			expect(campfireRecipe.slots["0"]).toEqual(["minecraft:potato"]);
			expect(campfireRecipe.typeSpecific).toMatchObject({
				experience: 0.35,
				cookingTime: 600
			});

			expect(campfireRecipe.result.item).toBe("minecraft:baked_potato");
		});
	});

	describe("Stonecutting Recipes", () => {
		it("should parse stonecutting recipe", () => {
			const stonecuttingRecipe = recipes.find((r) => r.identifier.resource === "stonecutting");
			expect(stonecuttingRecipe).toBeDefined();
			if (!stonecuttingRecipe) return;

			expect(stonecuttingRecipe.type).toBe("minecraft:stonecutting");

			expect(stonecuttingRecipe.slots["0"]).toEqual(["minecraft:andesite"]);
			expect(stonecuttingRecipe.result.item).toBe("minecraft:andesite_slab");
			expect(stonecuttingRecipe.result.count).toBe(2);
		});
	});
});
