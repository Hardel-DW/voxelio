import { parseDatapack } from "@/core/engine/Parser";
import { VoxelToRecipeDataDriven } from "@/core/schema/recipe/Compiler";
import type { RecipeProps } from "@/core/schema/recipe/types";
import { recipeDataDriven } from "@test/mock/recipe/DataDriven";
import { shapeless, shaped, shaped2, blasting, stonecutting, shapedtwobytwo } from "@test/mock/recipe/DataDriven";
import { createFilesFromElements, createZipFile } from "@test/mock/utils";
import { describe, it, expect, beforeEach } from "vitest";

describe("Recipe E2E Tests", () => {
	describe("Complete workflow: Parse → Compile", () => {
		let parsedDatapack: Awaited<ReturnType<typeof parseDatapack>>;
		let shapelessRecipe: RecipeProps;
		let shapedRecipe: RecipeProps;
		let shaped2Recipe: RecipeProps;
		let blastingRecipe: RecipeProps;
		let stonecuttingRecipe: RecipeProps;
		let shapedtwobytwoRecipe: RecipeProps;

		beforeEach(async () => {
			parsedDatapack = await parseDatapack(await createZipFile(createFilesFromElements(recipeDataDriven)));
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
			const foundShapedtwobytwo = recipes.find((r) => r.identifier.resource === "shapedtwobytwo");

			expect(foundShapeless).toBeDefined();
			expect(foundShaped).toBeDefined();
			expect(foundShaped2).toBeDefined();
			expect(foundBlasting).toBeDefined();
			expect(foundStonecutting).toBeDefined();
			expect(foundShapedtwobytwo).toBeDefined();

			shapelessRecipe = foundShapeless as RecipeProps;
			shapedRecipe = foundShaped as RecipeProps;
			shaped2Recipe = foundShaped2 as RecipeProps;
			blastingRecipe = foundBlasting as RecipeProps;
			stonecuttingRecipe = foundStonecutting as RecipeProps;
			shapedtwobytwoRecipe = foundShapedtwobytwo as RecipeProps;
		});

		describe("Round-trip purity (Parse → Compile without actions)", () => {
			it("should preserve shapeless recipe data perfectly", () => {
				const compiled = VoxelToRecipeDataDriven(shapelessRecipe, "recipe", shapeless.data);
				expect(compiled.element.data.type).toBe("minecraft:crafting_shapeless");
				expect(compiled.element.data.category).toBe("building");
				expect(compiled.element.data.group).toBe("planks");
				expect(compiled.element.data.ingredients).toHaveLength(1);
				expect(compiled.element.data.ingredients?.[0]).toBe("#minecraft:acacia_logs");
				expect(compiled.element.data.result).toEqual({
					count: 4,
					id: "minecraft:acacia_planks"
				});

				expect(compiled.element.data.result).toEqual(shapeless.data.result);
				expect(compiled.element.identifier).toEqual(shapelessRecipe.identifier);
			});

			it("should preserve shaped recipe data perfectly", () => {
				const compiled = VoxelToRecipeDataDriven(shapedRecipe, "recipe", shaped.data);

				expect(compiled.element.data.type).toBe("minecraft:crafting_shaped");
				expect(compiled.element.data.category).toBe("building");
				expect(compiled.element.data.group).toBe("wooden_slab");
				expect(compiled.element.data.pattern).toEqual(["###"]);
				expect(compiled.element.data.key).toEqual({
					"#": "minecraft:acacia_planks"
				});

				expect(compiled.element.data.result).toEqual({
					count: 6,
					id: "minecraft:acacia_slab"
				});

				expect(compiled.element.identifier).toEqual(shapedRecipe.identifier);
			});

			it("should preserve 2x2 shaped recipe data perfectly", () => {
				const compiled = VoxelToRecipeDataDriven(shapedtwobytwoRecipe, "recipe", shapedtwobytwo.data);

				expect(compiled.element.data.type).toBe("minecraft:crafting_shaped");
				expect(compiled.element.data.category).toBe("building");
				expect(compiled.element.data.group).toBe("wooden_stairs");
				expect(compiled.element.data.pattern).toEqual(["# ", "##"]);

				expect(compiled.element.data.result).toEqual({
					count: 4,
					id: "acacia_stairs"
				});

				expect(compiled.element.data.pattern).toEqual(shapedtwobytwo.data.pattern);
				expect(compiled.element.identifier).toEqual(shapedtwobytwoRecipe.identifier);
			});

			it("should preserve complex shaped recipe with tags perfectly", () => {
				const compiled = VoxelToRecipeDataDriven(shaped2Recipe, "recipe", shaped2.data);

				expect(compiled.element.data.type).toBe("minecraft:crafting_shaped");
				expect(compiled.element.data.category).toBe("equipment");
				expect(compiled.element.data.pattern).toEqual([" # ", "#X#", " # "]);

				expect(compiled.element.data.key).toEqual({
					"#": "#minecraft:iron_ingot",
					X: "minecraft:redstone"
				});

				expect(compiled.element.data.result).toEqual({
					count: 1,
					id: "minecraft:compass"
				});

				expect(compiled.element.identifier).toEqual(shaped2Recipe.identifier);
			});

			it("should preserve blasting recipe data perfectly", () => {
				const compiled = VoxelToRecipeDataDriven(blastingRecipe, "recipe", blasting.data);

				expect(compiled.element.data.type).toBe("minecraft:blasting");
				expect(compiled.element.data.category).toBe("misc");
				expect(compiled.element.data.group).toBe("iron_ingot");
				expect(compiled.element.data.ingredient).toBe("minecraft:iron_ore");
				expect(compiled.element.data.cookingtime).toBe(100);
				expect(compiled.element.data.experience).toBe(0.7);

				expect(compiled.element.data.result).toEqual({
					id: "minecraft:iron_ingot"
				});

				expect(compiled.element.identifier).toEqual(blastingRecipe.identifier);
			});

			it("should preserve stonecutting recipe data perfectly", () => {
				const compiled = VoxelToRecipeDataDriven(stonecuttingRecipe, "recipe", stonecutting.data);

				expect(compiled.element.data.type).toBe("minecraft:stonecutting");
				expect(compiled.element.data.ingredient).toBe("minecraft:andesite");

				expect(compiled.element.data.result).toBe(stonecutting.data.result);

				expect(compiled.element.identifier).toEqual(stonecuttingRecipe.identifier);
			});
		});

		describe("Data integrity verification", () => {
			it("should identify data preservation in shapeless recipe", () => {
				const originalJson = shapeless.data;

				const compiled = VoxelToRecipeDataDriven(shapelessRecipe, "recipe", shapeless.data);
				const compiledData = compiled.element.data;

				expect(compiledData.type).toBe(originalJson.type);
				expect(compiledData.category).toBe(originalJson.category);
				expect(compiledData.group).toBe(originalJson.group);
				expect(compiledData.ingredients).toHaveLength(originalJson.ingredients?.length ?? 0);
				expect(compiledData.result).toEqual(originalJson.result);

				expect(compiledData.ingredients?.[0]).toBe("#minecraft:acacia_logs");
				expect(originalJson.ingredients?.[0]).toBe("#minecraft:acacia_logs");
			});

			it("should identify data preservation in shaped recipe", () => {
				const originalJson = shaped.data;

				const compiled = VoxelToRecipeDataDriven(shapedRecipe, "recipe", shaped.data);
				const compiledData = compiled.element.data;

				expect(compiledData.type).toBe(originalJson.type);
				expect(compiledData.category).toBe(originalJson.category);
				expect(compiledData.group).toBe(originalJson.group);
				expect(compiledData.pattern).toEqual(["###"]);
				expect(compiledData.result).toEqual(originalJson.result);

				expect(compiledData.key).toEqual({
					"#": "minecraft:acacia_planks"
				});
				expect(originalJson.key).toEqual({
					"#": "minecraft:acacia_planks"
				});
			});

			it("should identify data preservation in complex shaped recipe", () => {
				const originalJson = shaped2.data;

				const compiled = VoxelToRecipeDataDriven(shaped2Recipe, "recipe", shaped2.data);
				const compiledData = compiled.element.data;

				expect(compiledData.type).toBe("minecraft:crafting_shaped"); // Normalized
				expect(compiledData.category).toBe(originalJson.category);
				expect(compiledData.pattern?.[0]).toBe(" # ");
				expect(compiledData.pattern?.[1]).toBe("#X#");
				expect(compiledData.pattern?.[2]).toBe(" # ");
				expect(compiledData.result).toEqual(originalJson.result);
			});

			it("should identify data preservation in smelting recipe", () => {
				const originalJson = blasting.data;

				const compiled = VoxelToRecipeDataDriven(blastingRecipe, "recipe", blasting.data);
				const compiledData = compiled.element.data;

				expect(compiledData.type).toBe(originalJson.type);
				expect(compiledData.category).toBe(originalJson.category);
				expect(compiledData.group).toBe(originalJson.group);
				expect(compiledData.cookingtime).toBe(originalJson.cookingtime);
				expect(compiledData.experience).toBe(originalJson.experience);
				expect(compiledData.result).toEqual(originalJson.result);

				expect(compiledData.ingredient).toBe("minecraft:iron_ore");
				expect(originalJson.ingredient).toBe("minecraft:iron_ore");
			});

			it("should identify data preservation in stonecutting recipe", () => {
				const originalJson = stonecutting.data;

				const compiled = VoxelToRecipeDataDriven(stonecuttingRecipe, "recipe", stonecutting.data);
				const compiledData = compiled.element.data;

				expect(compiledData.type).toBe(originalJson.type);
				expect(compiledData.ingredient).toBe("minecraft:andesite");

				expect(compiledData.result).toEqual({
					count: 2,
					id: "minecraft:andesite_slab"
				});

				expect(originalJson.result).toEqual({
					count: 2,
					id: "minecraft:andesite_slab"
				});
			});
		});

		describe("Slot system verification", () => {
			it("should correctly map shapeless ingredients to slots", () => {
				expect(shapelessRecipe.slots["0"]).toBe("#minecraft:acacia_logs");
				expect(Object.keys(shapelessRecipe.slots)).toHaveLength(1);
			});

			it("should correctly map shaped pattern to slots", () => {
				expect(shapedRecipe.slots["0"]).toEqual(["minecraft:acacia_planks"]);
				expect(shapedRecipe.slots["1"]).toEqual(["minecraft:acacia_planks"]);
				expect(shapedRecipe.slots["2"]).toEqual(["minecraft:acacia_planks"]);
				expect(shapedRecipe.gridSize).toEqual({ width: 3, height: 1 });
			});

			it("should correctly map complex shaped pattern to slots", () => {
				expect(shaped2Recipe.slots["1"]).toBe("#minecraft:iron_ingot"); // top center
				expect(shaped2Recipe.slots["3"]).toBe("#minecraft:iron_ingot"); // middle left
				expect(shaped2Recipe.slots["4"]).toEqual(["minecraft:redstone"]); // middle center
				expect(shaped2Recipe.slots["5"]).toBe("#minecraft:iron_ingot"); // middle right
				expect(shaped2Recipe.slots["7"]).toBe("#minecraft:iron_ingot"); // bottom center
				expect(shaped2Recipe.gridSize).toEqual({ width: 3, height: 3 });
			});

			it("should correctly map shaped 2x2 with empty slot pattern to slots", () => {
				expect(shapedtwobytwoRecipe.gridSize).toEqual({ width: 2, height: 2 });
				expect(shapedtwobytwoRecipe.slots["0"]).toEqual(["minecraft:acacia_planks"]);
				expect(shapedtwobytwoRecipe.slots["3"]).toEqual(["minecraft:acacia_planks"]);
				expect(shapedtwobytwoRecipe.slots["4"]).toEqual(["minecraft:acacia_planks"]);
			});

			it("should correctly map smelting ingredient to slot", () => {
				expect(blastingRecipe.slots["0"]).toEqual(["minecraft:iron_ore"]);
				expect(Object.keys(blastingRecipe.slots)).toHaveLength(1);
			});

			it("should correctly map stonecutting ingredient to slot", () => {
				expect(stonecuttingRecipe.slots["0"]).toEqual(["minecraft:andesite"]);
				expect(Object.keys(stonecuttingRecipe.slots)).toHaveLength(1);
			});
		});

		describe("Type-specific data verification", () => {
			it("should preserve smelting type-specific data", () => {
				expect(blastingRecipe.typeSpecific).toEqual({
					experience: 0.7,
					cookingTime: 100
				});
			});

			it("should have no type-specific data for simple recipes", () => {
				expect(shapelessRecipe.typeSpecific).toBeUndefined();
				expect(shapedRecipe.typeSpecific).toBeUndefined();
				expect(stonecuttingRecipe.typeSpecific).toBeUndefined();
			});
		});

		describe("Result data verification", () => {
			it("should preserve result data correctly", () => {
				expect(shapelessRecipe.result).toEqual({
					item: "minecraft:acacia_planks",
					count: 4
				});

				expect(shapedRecipe.result).toEqual({
					item: "minecraft:acacia_slab",
					count: 6
				});

				expect(blastingRecipe.result).toEqual({
					item: "minecraft:iron_ingot",
					count: 1
				});

				expect(stonecuttingRecipe.result).toEqual({
					item: "minecraft:andesite_slab",
					count: 2
				});
			});
		});

		describe("Round-trip integrity for all recipe types", () => {
			it("should maintain data integrity through full round-trip for all recipes", () => {
				const recipes = Array.from(parsedDatapack.elements.values()).filter(
					(element): element is RecipeProps => element.identifier.registry === "recipe"
				);

				for (const recipe of recipes) {
					const compiled = VoxelToRecipeDataDriven(recipe, "recipe");

					expect(compiled.element.data).toBeDefined();
					expect(compiled.element.data.type).toBeDefined();
					expect(compiled.element.identifier).toEqual(recipe.identifier);

					expect(compiled.element.data.type).toBe(recipe.type);

					switch (recipe.type) {
						case "minecraft:crafting_shapeless":
							expect(compiled.element.data.ingredients).toBeDefined();
							break;
						case "minecraft:crafting_shaped":
							expect(compiled.element.data.pattern).toBeDefined();
							expect(compiled.element.data.key).toBeDefined();
							break;
						case "minecraft:smelting":
						case "minecraft:blasting":
						case "minecraft:smoking":
						case "minecraft:campfire_cooking":
							expect(compiled.element.data.ingredient).toBeDefined();
							break;
						case "minecraft:stonecutting":
							expect(compiled.element.data.ingredient).toBeDefined();
							break;
					}

					if (recipe.type !== "minecraft:smithing_trim") {
						expect(compiled.element.data.result).toBeDefined();
					}
				}
			});
		});
	});
});
