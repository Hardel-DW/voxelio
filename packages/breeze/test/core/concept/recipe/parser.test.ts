import { describe, it, expect } from "vitest";
import { originalRecipes } from "@test/mock/concept/recipe";
import { VoxelToRecipeDataDriven } from "@/core/schema/recipe/Compiler";
import { RecipeDataDrivenToVoxelFormat } from "@/core/schema/recipe/Parser";

describe("Recipe Schema", () => {
	describe("Shaped Crafting Recipes", () => {
		it("should parse simple shaped recipe (###)", () => {
			const parsed = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped });
			expect(parsed.type).toBe("minecraft:crafting_shaped");
			expect(parsed.gridSize).toEqual({ width: 3, height: 1 });
			expect(parsed.slots["0"]).toEqual(["minecraft:acacia_planks"]);
			expect(parsed.slots["1"]).toEqual(["minecraft:acacia_planks"]);
			expect(parsed.slots["2"]).toEqual(["minecraft:acacia_planks"]);
			expect(parsed.slots["3"]).toBeUndefined();
			expect(parsed.group).toBe("wooden_slab");
			expect(parsed.category).toBe("building");
			expect(parsed.result.id).toBe("minecraft:acacia_slab");
			expect(parsed.result.count).toBe(6);
		});

		it("should parse complex shaped recipe (compass pattern)", () => {
			const shaped2Recipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped2 });
			expect(shaped2Recipe.type).toBe("minecraft:crafting_shaped");
			expect(shaped2Recipe.gridSize).toEqual({ width: 3, height: 3 });
			expect(shaped2Recipe.slots["1"]).toBe("#minecraft:iron_ingot"); // top center
			expect(shaped2Recipe.slots["3"]).toBe("#minecraft:iron_ingot"); // middle left
			expect(shaped2Recipe.slots["4"]).toEqual(["minecraft:redstone"]); // middle center
			expect(shaped2Recipe.slots["5"]).toBe("#minecraft:iron_ingot"); // middle right
			expect(shaped2Recipe.slots["7"]).toBe("#minecraft:iron_ingot"); // bottom center
			expect(shaped2Recipe.slots["0"]).toBeUndefined(); // top left
			expect(shaped2Recipe.slots["2"]).toBeUndefined(); // top right
			expect(shaped2Recipe.slots["6"]).toBeUndefined(); // bottom left
			expect(shaped2Recipe.slots["8"]).toBeUndefined(); // bottom right

			expect(shaped2Recipe.result.id).toBe("minecraft:compass");
			expect(shaped2Recipe.result.count).toBe(1);
		});

		it("should parse 2x2 shaped recipe", () => {
			const twoByTwoRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped_two_by_two });
			expect(twoByTwoRecipe.type).toBe("minecraft:crafting_shaped");
			expect(twoByTwoRecipe.gridSize).toEqual({ width: 2, height: 2 });
			expect(twoByTwoRecipe.slots["0"]).toEqual(["minecraft:chicken"]);
			expect(twoByTwoRecipe.slots["1"]).toEqual(["minecraft:chicken"]);
			expect(twoByTwoRecipe.slots["3"]).toEqual(["minecraft:chicken"]);
			expect(twoByTwoRecipe.slots["4"]).toEqual(["minecraft:chicken"]);
			expect(twoByTwoRecipe.result.id).toBe("minecraft:acacia_button");
			expect(twoByTwoRecipe.result.count).toBe(1);
		});

		it("should parse shaped recipe with empty lines", () => {
			const emptyLineRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped_empty_line });
			expect(emptyLineRecipe.type).toBe("minecraft:crafting_shaped");
			expect(emptyLineRecipe.showNotification).toBe(true);
			expect(emptyLineRecipe.gridSize).toEqual({ width: 3, height: 3 });
			expect(emptyLineRecipe.slots["0"]).toEqual(["minecraft:chicken"]);
			expect(emptyLineRecipe.slots["1"]).toEqual(["minecraft:chicken"]);
			expect(emptyLineRecipe.slots["2"]).toEqual(["minecraft:chicken"]);
			expect(emptyLineRecipe.slots["6"]).toEqual(["minecraft:chicken"]);
			expect(emptyLineRecipe.slots["7"]).toEqual(["minecraft:chicken"]);
			expect(emptyLineRecipe.slots["8"]).toEqual(["minecraft:chicken"]);
			expect(emptyLineRecipe.slots["3"]).toBeUndefined();
			expect(emptyLineRecipe.slots["4"]).toBeUndefined();
			expect(emptyLineRecipe.slots["5"]).toBeUndefined();
			expect(emptyLineRecipe.result.id).toBe("minecraft:acacia_button");
			expect(emptyLineRecipe.result.count).toBe(1);
			expect(emptyLineRecipe.result.components).toEqual({
				"minecraft:damage": 10,
				"!minecraft:block_entity_data": {}
			});
		});

		it("should normalize recipe types and ingredients without namespace", () => {
			const noNamespaceRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped_no_namespace });
			expect(noNamespaceRecipe.type).toBe("minecraft:crafting_shaped");
			expect(noNamespaceRecipe.slots["1"]).toEqual(["minecraft:iron_ingot"]);
			expect(noNamespaceRecipe.slots["3"]).toEqual(["minecraft:iron_ingot"]);
			expect(noNamespaceRecipe.slots["4"]).toEqual(["minecraft:redstone"]);
			expect(noNamespaceRecipe.slots["5"]).toEqual(["minecraft:iron_ingot"]);
			expect(noNamespaceRecipe.slots["7"]).toEqual(["minecraft:iron_ingot"]);
			expect(noNamespaceRecipe.result.id).toBe("minecraft:compass");
		});
	});

	describe("Shapeless Crafting Recipes", () => {
		it("should parse shapeless recipe", () => {
			const shapelessRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless });
			expect(shapelessRecipe.type).toBe("minecraft:crafting_shapeless");
			expect(shapelessRecipe.group).toBe("planks");
			expect(shapelessRecipe.category).toBe("building");
			expect(shapelessRecipe.slots).toBeDefined();
			expect(shapelessRecipe.slots["0"]).toBe("#minecraft:acacia_logs");
			expect(Object.keys(shapelessRecipe.slots)).toHaveLength(1);
			expect(shapelessRecipe.result.id).toBe("minecraft:acacia_planks");
			expect(shapelessRecipe.result.count).toBe(4);
			expect(shapelessRecipe.typeSpecific).toBeUndefined();
		});
	});

	describe("Smelting Recipes", () => {
		it("should parse blasting recipe", () => {
			const blastingRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.blasting });
			expect(blastingRecipe.type).toBe("minecraft:blasting");
			expect(blastingRecipe.group).toBe("iron_ingot");
			expect(blastingRecipe.category).toBe("misc");
			expect(blastingRecipe.slots["0"]).toEqual(["minecraft:iron_ore"]);
			expect(blastingRecipe.typeSpecific).toMatchObject({ experience: 0.7, cookingTime: 100 });
			expect(blastingRecipe.result.id).toBe("minecraft:iron_ingot");
		});

		it("should parse smelting recipe", () => {
			const parsed = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.smelting });
			expect(parsed.type).toBe("minecraft:smelting");

			const smeltingData = parsed.typeSpecific as any;
			expect(smeltingData.experience).toBe(0.7);
			expect(smeltingData.cookingTime).toBe(200);
		});

		it("should parse smoking recipe", () => {
			const parsed = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.smoking });
			expect(parsed.type).toBe("minecraft:smoking");
			expect(parsed.category).toBe("food");

			const smeltingData = parsed.typeSpecific as any;
			expect(smeltingData.experience).toBe(0.35);
			expect(smeltingData.cookingTime).toBe(100);
		});

		it("should parse campfire cooking recipe", () => {
			const campfireRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.campfire_cooking });
			expect(campfireRecipe.type).toBe("minecraft:campfire_cooking");
			expect(campfireRecipe.slots["0"]).toEqual(["minecraft:potato"]);
			expect(campfireRecipe.typeSpecific).toMatchObject({
				experience: 0.35,
				cookingTime: 600
			});
			expect(campfireRecipe.result.id).toBe("minecraft:baked_potato");
		});
	});

	describe("Stonecutting Recipes", () => {
		it("should parse stonecutting recipe", () => {
			const parsed = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.stonecutting });
			expect(parsed.type).toBe("minecraft:stonecutting");
			expect(parsed.slots["0"]).toEqual(["minecraft:andesite"]);
			expect(parsed.result.id).toBe("minecraft:andesite_slab");
			expect(parsed.result.count).toBe(2);
		});
	});

	describe("Smithing Recipes", () => {
		it("should parse smithing transform recipe", () => {
			const parsed = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.transform });
			expect(parsed.type).toBe("minecraft:smithing_transform");
			expect(parsed.slots["0"]).toEqual(["minecraft:wayfinder_armor_trim_smithing_template"]);
			expect(parsed.slots["1"]).toBe("#minecraft:trimmable_armor");
			expect(parsed.slots["2"]).toBe("#minecraft:trim_materials");

			const smithingData = parsed.typeSpecific as any;
			expect(smithingData.templateSlot).toBe("0");
			expect(smithingData.baseSlot).toBe("1");
			expect(smithingData.additionSlot).toBe("2");
		});
	});

	describe("Transmute Crafting", () => {
		it("should parse transmute recipe", () => {
			const parsed = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.transmute });
			expect(parsed.type).toBe("minecraft:crafting_transmute");
			expect(parsed.category).toBe("misc");
			expect(parsed.slots["0"]).toBe("#minecraft:acacia_logs");
			expect(parsed.slots["1"]).toEqual(["minecraft:acacia_door", "minecraft:acacia_fence_gate"]);

			const transmuteData = parsed.typeSpecific as any;
			expect(transmuteData.inputSlot).toBe("0");
			expect(transmuteData.materialSlot).toBe("1");
		});

		it("should handle array ingredients in slots", () => {
			const parsed = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.transmute });
			expect(parsed.slots["1"]).toEqual(["minecraft:acacia_door", "minecraft:acacia_fence_gate"]);
		});
	});

	describe("Slot System Verification", () => {
		it("should correctly map shapeless ingredients to slots", () => {
			const shapelessRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless });
			expect(shapelessRecipe.slots["0"]).toBe("#minecraft:acacia_logs");
			expect(Object.keys(shapelessRecipe.slots)).toHaveLength(1);
		});

		it("should correctly map shaped pattern to slots", () => {
			const shapedRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped });
			expect(shapedRecipe.slots["0"]).toEqual(["minecraft:acacia_planks"]);
			expect(shapedRecipe.slots["1"]).toEqual(["minecraft:acacia_planks"]);
			expect(shapedRecipe.slots["2"]).toEqual(["minecraft:acacia_planks"]);
			expect(shapedRecipe.gridSize).toEqual({ width: 3, height: 1 });
		});

		it("should correctly map complex shaped pattern to slots", () => {
			const shaped2Recipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped2 });
			expect(shaped2Recipe.slots["1"]).toBe("#minecraft:iron_ingot");
			expect(shaped2Recipe.slots["3"]).toBe("#minecraft:iron_ingot");
			expect(shaped2Recipe.slots["4"]).toEqual(["minecraft:redstone"]);
			expect(shaped2Recipe.slots["5"]).toBe("#minecraft:iron_ingot");
			expect(shaped2Recipe.slots["7"]).toBe("#minecraft:iron_ingot");
			expect(shaped2Recipe.gridSize).toEqual({ width: 3, height: 3 });
		});

		it("should correctly map shaped 2x2 pattern to slots", () => {
			const twoByTwoRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped_two_by_two });
			expect(twoByTwoRecipe.gridSize).toEqual({ width: 2, height: 2 });
			expect(twoByTwoRecipe.slots["0"]).toEqual(["minecraft:chicken"]);
			expect(twoByTwoRecipe.slots["1"]).toEqual(["minecraft:chicken"]);
			expect(twoByTwoRecipe.slots["3"]).toEqual(["minecraft:chicken"]);
			expect(twoByTwoRecipe.slots["4"]).toEqual(["minecraft:chicken"]);
		});

		it("should correctly map smelting ingredient to slot", () => {
			const blastingRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.blasting });
			expect(blastingRecipe.slots["0"]).toEqual(["minecraft:iron_ore"]);
			expect(Object.keys(blastingRecipe.slots)).toHaveLength(1);
		});

		it("should correctly map stonecutting ingredient to slot", () => {
			const stonecuttingRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.stonecutting });
			expect(stonecuttingRecipe.slots["0"]).toEqual(["minecraft:andesite"]);
			expect(Object.keys(stonecuttingRecipe.slots)).toHaveLength(1);
		});
	});

	describe("Type-Specific Data Verification", () => {
		it("should preserve smelting type-specific data", () => {
			const blastingRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.blasting });
			expect(blastingRecipe.typeSpecific).toEqual({ experience: 0.7, cookingTime: 100 });
		});

		it("should have no type-specific data for simple recipes", () => {
			const shapelessRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless });
			const shapedRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped });
			const stonecuttingRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.stonecutting });
			expect(shapelessRecipe.typeSpecific).toBeUndefined();
			expect(shapedRecipe.typeSpecific).toBeUndefined();
			expect(stonecuttingRecipe.typeSpecific).toBeUndefined();
		});
	});

	describe("Result Data Verification", () => {
		it("should parse result data correctly", () => {
			const shapelessRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shapeless });
			const shapedRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.shaped });
			const blastingRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.blasting });
			const stonecuttingRecipe = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.stonecutting });
			expect(shapelessRecipe.result).toEqual({ id: "minecraft:acacia_planks", count: 4 });
			expect(shapedRecipe.result).toEqual({ id: "minecraft:acacia_slab", count: 6 });
			expect(blastingRecipe.result).toEqual({ id: "minecraft:iron_ingot", count: 1 });
			expect(stonecuttingRecipe.result).toEqual({ id: "minecraft:andesite_slab", count: 2 });
		});
	});

	describe("Edge cases and error handling", () => {
		it("should handle missing optional fields", () => {
			const parsed = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.minimal });
			expect(parsed.group).toBeUndefined();
			expect(parsed.category).toBeUndefined();
		});

		it("should handle unknown recipe types", () => {
			const parsed = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.unknown });
			expect(parsed).toBeDefined();
			expect(parsed.type).toBe("modname:custom_recipe");
		});

		it("should preserve unknown fields in round-trip", () => {
			const parsed = RecipeDataDrivenToVoxelFormat({ element: originalRecipes.mod_recipe });
			const compiled = VoxelToRecipeDataDriven(parsed, "recipe", originalRecipes.mod_recipe.data);
			expect(compiled.element.data.mod_field).toBe("preserved");
			expect(compiled.element.data.mod_complex).toEqual({ nested: true, value: 42 });
		});
	});
});