import { VoxelToRecipeDataDriven } from "@/core/schema/recipe/Compiler";
import { originalRecipes } from "@test/mock/concept/recipe";
import { describe, it, expect } from "vitest";
import { RecipeDataDrivenToVoxelFormat } from "@/core/schema/recipe/Parser";

describe("Recipe E2E Tests", () => {
	describe("Complete workflow: Parse → Compile", () => {
		describe("Shapeless round-trip", () => {
			it("should preserve shapeless recipe data perfectly", () => {
				const original = originalRecipes.shapeless;
				const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
				const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);

				expect(compiled.element.data.type).toBe(original.data.type);
				expect(compiled.element.data.category).toBe(original.data.category);
				expect(compiled.element.data.group).toBe(original.data.group);
				expect(compiled.element.data.ingredients).toEqual(original.data.ingredients);
				expect(compiled.element.data.result).toEqual(original.data.result);
			});
		});

		describe("Shaped round-trip", () => {
			it("should preserve shaped recipe data perfectly", () => {
				const original = originalRecipes.shaped;
				const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
				const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);
				expect(compiled.element.data.type).toBe(original.data.type);
				expect(original.data.pattern).toBeDefined();
				expect(compiled.element.data.pattern).toBeDefined();

				const originalPattern = original.data.pattern as string[];
				const compiledPattern = compiled.element.data.pattern as string[];
				expect(compiledPattern).toHaveLength(originalPattern.length);
				expect(compiledPattern[0]).toHaveLength(originalPattern[0].length);

				expect(original.data.key).toBeDefined();
				expect(compiled.element.data.key).toBeDefined();
				const originalKey = original.data.key as Record<string, any>;
				const compiledKey = compiled.element.data.key as Record<string, any>;
				const originalIngredient = Object.values(originalKey)[0];
				const compiledIngredient = Object.values(compiledKey)[0];

				const originalItem =
					typeof originalIngredient === "string" ? originalIngredient : originalIngredient.item || originalIngredient.tag;
				const compiledItem =
					typeof compiledIngredient === "string" ? compiledIngredient : compiledIngredient.item || compiledIngredient.tag;
				expect(compiledItem).toBe(originalItem);
				expect(compiled.element.data.result).toEqual(original.data.result);
			});

			it("should maintain data integrity for 2x2 shaped pattern", () => {
				const original = originalRecipes.shaped_two_by_two;
				const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
				const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);
				expect(compiled.element.data.pattern).toBeDefined();

				const compiledPattern = compiled.element.data.pattern as string[];
				expect(compiledPattern).toHaveLength(2);
				expect(compiledPattern[0]).toHaveLength(2);
				expect(compiledPattern[1]).toHaveLength(2);
			});

			it("should preserve complex shaped recipe with tags", () => {
				const original = originalRecipes.shaped_array_item;
				const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
				const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);
				expect(compiled.element.data.type).toBe("minecraft:crafting_shaped");
				expect(compiled.element.data.category).toBe(original.data.category);
				expect(compiled.element.data.pattern).toEqual(original.data.pattern);
				expect(compiled.element.data.key).toEqual(original.data.key);
				expect(compiled.element.data.result).toEqual(original.data.result);
			});

			it("should maintain data integrity with empty lines", () => {
				const original = originalRecipes.shaped_empty_line;
				const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
				const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);
				expect(original.data.pattern).toBeDefined();
				expect(compiled.element.data.pattern).toBeDefined();

				const originalPattern = original.data.pattern as string[];
				const compiledPattern = compiled.element.data.pattern as string[];
				expect(compiledPattern).toHaveLength(originalPattern.length);
				expect(compiledPattern[1]).toBe("   ");
				expect(compiled.element.data.show_notification).toBe(original.data.show_notification);
				expect(compiled.element.data.result).toEqual(original.data.result);
			});

			it("should maintain data integrity with empty rows", () => {
				const original = originalRecipes.shaped_empty_rows;
				const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
				const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);
				expect(original.data.pattern).toBeDefined();
				expect(compiled.element.data.pattern).toBeDefined();

				const originalPattern = original.data.pattern as string[];
				const compiledPattern = compiled.element.data.pattern as string[];
				expect(compiledPattern).toHaveLength(originalPattern.length);
				expect(compiledPattern[2]).toBe("   ");
			});

			it("should maintain data integrity with empty rows and columns", () => {
				const original = originalRecipes.shaped_empty_rows_columns;
				const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
				const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);
				expect(original.data.pattern).toBeDefined();
				expect(compiled.element.data.pattern).toBeDefined();

				const originalPattern = original.data.pattern as string[];
				const compiledPattern = compiled.element.data.pattern as string[];
				expect(compiledPattern).toHaveLength(originalPattern.length);

				const patternArray = Array.isArray(compiledPattern) ? compiledPattern : [compiledPattern as string];
				expect(patternArray.every((row) => row.endsWith(" "))).toBe(true);
			});
		});

		describe("Smelting round-trip", () => {
			it("should maintain blasting data integrity", () => {
				const original = originalRecipes.blasting;
				const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
				const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);
				expect(compiled.element.data.type).toBe(original.data.type);
				expect(compiled.element.data.ingredient).toEqual(original.data.ingredient);
				expect(compiled.element.data.experience).toBe(original.data.experience);
				expect(compiled.element.data.cookingtime).toBe(original.data.cookingtime);
				expect(compiled.element.data.result).toEqual(original.data.result);
			});

			it("should maintain smelting data integrity", () => {
				const original = originalRecipes.smelting;
				const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
				const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);
				expect(compiled.element.data.type).toBe(original.data.type);
				expect(compiled.element.data.ingredient).toEqual(original.data.ingredient);
				expect(compiled.element.data.experience).toBe(original.data.experience);
				expect(compiled.element.data.cookingtime).toBe(original.data.cookingtime);
			});

			it("should maintain smoking data integrity", () => {
				const original = originalRecipes.smoking;
				const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
				const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);
				expect(compiled.element.data.type).toBe(original.data.type);
				expect(compiled.element.data.category).toBe(original.data.category);
				expect(compiled.element.data.experience).toBe(original.data.experience);
				expect(compiled.element.data.cookingtime).toBe(original.data.cookingtime);
			});

			it("should maintain campfire cooking data integrity", () => {
				const original = originalRecipes.campfire_cooking;
				const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
				const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);
				expect(compiled.element.data.type).toBe(original.data.type);
				expect(compiled.element.data.experience).toBe(original.data.experience);
				expect(compiled.element.data.cookingtime).toBe(original.data.cookingtime);
			});
		});

		describe("Stonecutting round-trip", () => {
			it("should maintain data integrity", () => {
				const original = originalRecipes.stonecutting;
				const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
				const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);
				expect(compiled.element.data.type).toBe(original.data.type);
				expect(compiled.element.data.ingredient).toEqual(original.data.ingredient);
				expect(compiled.element.data.result).toEqual(original.data.result);
			});
		});

		describe("Smithing round-trip", () => {
			it("should maintain smithing trim data integrity", () => {
				const original = originalRecipes.smithing_trim;
				const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
				const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);
				expect(compiled.element.data.type).toBe(original.data.type);
				expect(compiled.element.data.base).toEqual(original.data.base);
				expect(compiled.element.data.addition).toEqual(original.data.addition);
				expect(compiled.element.data.template).toEqual(original.data.template);
				expect(compiled.element.data.pattern).toBe(original.data.pattern);
			});

			it("should maintain smithing transform data integrity", () => {
				const original = originalRecipes.transform;
				const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
				const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);
				expect(compiled.element.data.type).toBe(original.data.type);
				expect(compiled.element.data.base).toEqual(original.data.base);
				expect(compiled.element.data.addition).toEqual(original.data.addition);
				expect(compiled.element.data.template).toEqual(original.data.template);
				expect(compiled.element.data.result).toEqual(original.data.result);
			});
		});

		describe("Transmute round-trip", () => {
			it("should maintain data integrity", () => {
				const original = originalRecipes.transmute;
				const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
				const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);
				expect(compiled.element.data.type).toBe(original.data.type);
				expect(compiled.element.data.category).toBe(original.data.category);
				expect(compiled.element.data.input).toEqual(original.data.input);
				expect(compiled.element.data.material).toEqual(original.data.material);
				expect(compiled.element.data.result).toEqual(original.data.result);
			});
		});
	});
});
