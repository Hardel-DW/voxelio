import { RecipeDataDrivenToVoxelFormat } from "@/core/schema/recipe/Parser";
import { VoxelToRecipeDataDriven } from "@/core/schema/recipe/Compiler";
import type { RecipeProps } from "@/core/schema/recipe/types";
import {
    shapeless,
    shaped,
    ShapedWithEmptyLine,
    ShapedWithEmptyRows,
    shapedTwoByTwo,
    ShapedWithEmptyRowsAndColumns,
    stonecutting,
    blasting,
    smelting,
    smoking,
    campfire_cooking,
    smithing_transform,
    transmute,
    transform
} from "@test/template/concept/recipe/DataDriven";
import { describe, it, expect, beforeEach } from "vitest";

describe("Recipe Schema", () => {
    describe("Data Driven to Voxel Element", () => {
        describe("Shapeless Crafting", () => {
            let parsed: RecipeProps;

            beforeEach(() => {
                parsed = RecipeDataDrivenToVoxelFormat({ element: shapeless });
            });

            it("should parse shapeless recipe correctly", () => {
                expect(parsed).toBeDefined();
                expect(parsed.type).toBe("minecraft:crafting_shapeless");
                expect(parsed.group).toBe("planks");
                expect(parsed.category).toBe("building");
            });

            it("should have correct slots", () => {
                expect(parsed.slots).toBeDefined();
                expect(parsed.slots["0"]).toBe("#minecraft:acacia_logs");
                expect(Object.keys(parsed.slots)).toHaveLength(1);
            });

            it("should have correct result", () => {
                expect(parsed.result.item).toBe("minecraft:acacia_planks");
                expect(parsed.result.count).toBe(4);
            });

            it("should not have type-specific data", () => {
                expect(parsed.typeSpecific).toBeUndefined();
            });
        });

        describe("Shaped Crafting", () => {
            let parsed: RecipeProps;

            beforeEach(() => {
                parsed = RecipeDataDrivenToVoxelFormat({ element: shaped });
            });

            it("should parse shaped recipe correctly", () => {
                expect(parsed).toBeDefined();
                expect(parsed.type).toBe("minecraft:crafting_shaped");
                expect(parsed.group).toBe("wooden_slab");
                expect(parsed.category).toBe("building");
            });

            it("should have correct slots with grid layout", () => {
                expect(parsed.slots).toBeDefined();
                expect(parsed.slots["0"]).toEqual(["minecraft:acacia_planks"]);
                expect(parsed.slots["1"]).toEqual(["minecraft:acacia_planks"]);
                expect(parsed.slots["2"]).toEqual(["minecraft:acacia_planks"]);
                expect(parsed.gridSize).toEqual({ width: 3, height: 1 });
            });

            it("should not have legacy type-specific data", () => {
                expect(parsed.typeSpecific).toBeUndefined();
            });
        });

        describe("Shaped Crafting with Empty Lines", () => {
            let parsed: RecipeProps;

            beforeEach(() => {
                parsed = RecipeDataDrivenToVoxelFormat({ element: ShapedWithEmptyLine });
            });

            it("should parse complex shaped recipe", () => {
                expect(parsed.type).toBe("minecraft:crafting_shaped");
                expect(parsed.showNotification).toBe(true);
            });

            it("should handle pattern with spaces in slots", () => {
                expect(parsed.slots["0"]).toEqual(["minecraft:chicken"]);
                expect(parsed.slots["1"]).toEqual(["minecraft:chicken"]);
                expect(parsed.slots["2"]).toEqual(["minecraft:chicken"]);
                expect(parsed.slots["3"]).toBeUndefined(); // Empty space
                expect(parsed.slots["4"]).toBeUndefined(); // Empty space
                expect(parsed.slots["5"]).toBeUndefined(); // Empty space
                expect(parsed.slots["6"]).toEqual(["minecraft:chicken"]);
                expect(parsed.slots["7"]).toEqual(["minecraft:chicken"]);
                expect(parsed.slots["8"]).toEqual(["minecraft:chicken"]);
                expect(parsed.gridSize).toEqual({ width: 3, height: 3 });
            });

            it("should parse result with components", () => {
                expect(parsed.result.item).toBe("minecraft:acacia_button");
                expect(parsed.result.count).toBe(1);
                expect(parsed.result.components).toEqual({
                    "minecraft:damage": 10,
                    "!minecraft:block_entity_data": {}
                });
            });
        });

        describe("Smelting Recipes", () => {
            let blastingParsed: RecipeProps;
            let smeltingParsed: RecipeProps;
            let smokingParsed: RecipeProps;
            let campfireParsed: RecipeProps;

            beforeEach(() => {
                blastingParsed = RecipeDataDrivenToVoxelFormat({ element: blasting });
                smeltingParsed = RecipeDataDrivenToVoxelFormat({ element: smelting });
                smokingParsed = RecipeDataDrivenToVoxelFormat({ element: smoking });
                campfireParsed = RecipeDataDrivenToVoxelFormat({ element: campfire_cooking });
            });

            it("should parse blasting recipe", () => {
                expect(blastingParsed.type).toBe("minecraft:blasting");
                expect(blastingParsed.group).toBe("iron_ingot");
                expect(blastingParsed.category).toBe("misc");

                const smeltingData = blastingParsed.typeSpecific as any;
                expect(smeltingData.experience).toBe(0.7);
                expect(smeltingData.cookingTime).toBe(100);
            });

            it("should parse smelting recipe", () => {
                expect(smeltingParsed.type).toBe("minecraft:smelting");

                const smeltingData = smeltingParsed.typeSpecific as any;
                expect(smeltingData.experience).toBe(0.7);
                expect(smeltingData.cookingTime).toBe(200);
            });

            it("should parse smoking recipe", () => {
                expect(smokingParsed.type).toBe("minecraft:smoking");
                expect(smokingParsed.category).toBe("food");

                const smeltingData = smokingParsed.typeSpecific as any;
                expect(smeltingData.experience).toBe(0.35);
                expect(smeltingData.cookingTime).toBe(100);
            });

            it("should parse campfire cooking recipe", () => {
                expect(campfireParsed.type).toBe("minecraft:campfire_cooking");

                const smeltingData = campfireParsed.typeSpecific as any;
                expect(smeltingData.experience).toBe(0.35);
                expect(smeltingData.cookingTime).toBe(600);
            });
        });

        describe("Stonecutting", () => {
            let parsed: RecipeProps;

            beforeEach(() => {
                parsed = RecipeDataDrivenToVoxelFormat({ element: stonecutting });
            });

            it("should parse stonecutting recipe", () => {
                expect(parsed.type).toBe("minecraft:stonecutting");
                expect(parsed.slots["0"]).toEqual(["minecraft:andesite"]);
                expect(parsed.result.item).toBe("minecraft:andesite_slab");
                expect(parsed.result.count).toBe(2);
            });
        });

        describe("Smithing Recipes", () => {
            let transformParsed: RecipeProps;

            beforeEach(() => {
                transformParsed = RecipeDataDrivenToVoxelFormat({ element: transform });
            });

            it("should parse smithing transform recipe", () => {
                expect(transformParsed.type).toBe("minecraft:smithing_transform");
                expect(transformParsed.slots["0"]).toEqual(["minecraft:wayfinder_armor_trim_smithing_template"]);
                expect(transformParsed.slots["1"]).toBe("#minecraft:trimmable_armor");
                expect(transformParsed.slots["2"]).toBe("#minecraft:trim_materials");

                const smithingData = transformParsed.typeSpecific as any;
                expect(smithingData.templateSlot).toBe("0");
                expect(smithingData.baseSlot).toBe("1");
                expect(smithingData.additionSlot).toBe("2");
            });
        });

        describe("Transmute Crafting", () => {
            let parsed: RecipeProps;

            beforeEach(() => {
                parsed = RecipeDataDrivenToVoxelFormat({ element: transmute });
            });

            it("should parse transmute recipe", () => {
                expect(parsed.type).toBe("minecraft:crafting_transmute");
                expect(parsed.category).toBe("misc");
                expect(parsed.slots["0"]).toBe("#minecraft:acacia_logs");
                expect(parsed.slots["1"]).toEqual(["minecraft:acacia_door", "minecraft:acacia_fence_gate"]);

                const transmuteData = parsed.typeSpecific as any;
                expect(transmuteData.inputSlot).toBe("0");
                expect(transmuteData.materialSlot).toBe("1");
            });

            it("should handle array ingredients in slots", () => {
                expect(parsed.slots["1"]).toEqual(["minecraft:acacia_door", "minecraft:acacia_fence_gate"]);
            });
        });
    });

    describe("Round-trip conversion", () => {
        describe("Shapeless round-trip", () => {
            it("should maintain data integrity", () => {
                const original = shapeless;
                const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
                const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);

                expect(compiled.element.data.type).toBe(original.data.type);
                expect(compiled.element.data.group).toBe(original.data.group);
                expect(compiled.element.data.category).toBe(original.data.category);
                expect(compiled.element.data.ingredients).toEqual(original.data.ingredients);
                expect(compiled.element.data.result).toEqual(original.data.result);
            });
        });

        describe("Shaped round-trip", () => {
            it("should maintain data integrity", () => {
                const original = shaped;
                const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
                const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);

                expect(compiled.element.data.type).toBe(original.data.type);
                // Test functional equivalence: same grid size and ingredient mapping
                expect(original.data.pattern).toBeDefined();
                expect(compiled.element.data.pattern).toBeDefined();
                const originalPattern = original.data.pattern as string[];
                const compiledPattern = compiled.element.data.pattern as string[];
                expect(compiledPattern).toHaveLength(originalPattern.length);
                expect(compiledPattern[0]).toHaveLength(originalPattern[0].length);

                // Check that ingredients are preserved (should map back to same item)
                expect(original.data.key).toBeDefined();
                expect(compiled.element.data.key).toBeDefined();
                const originalKey = original.data.key as Record<string, any>;
                const compiledKey = compiled.element.data.key as Record<string, any>;
                const originalIngredient = Object.values(originalKey)[0];
                const compiledIngredient = Object.values(compiledKey)[0];

                // Check functional equivalence: both should reference the same item
                const originalItem =
                    typeof originalIngredient === "string" ? originalIngredient : originalIngredient.item || originalIngredient.tag;
                const compiledItem =
                    typeof compiledIngredient === "string" ? compiledIngredient : compiledIngredient.item || compiledIngredient.tag;
                expect(compiledItem).toBe(originalItem);

                expect(compiled.element.data.result).toEqual(original.data.result);
            });
        });

        describe("Complex shaped round-trip", () => {
            it("should maintain data integrity with empty lines", () => {
                const original = ShapedWithEmptyLine;
                const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
                const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);

                // Test pattern structure is preserved (same dimensions and empty spaces)
                expect(original.data.pattern).toBeDefined();
                expect(compiled.element.data.pattern).toBeDefined();
                const originalPattern = original.data.pattern as string[];
                const compiledPattern = compiled.element.data.pattern as string[];
                expect(compiledPattern).toHaveLength(originalPattern.length);
                expect(compiledPattern[1]).toBe("   "); // Empty middle row preserved
                expect(compiled.element.data.show_notification).toBe(original.data.show_notification);
                expect(compiled.element.data.result).toEqual(original.data.result);
            });

            it("should maintain data integrity with empty rows", () => {
                const original = ShapedWithEmptyRows;
                const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
                const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);

                // Test pattern structure is preserved
                expect(original.data.pattern).toBeDefined();
                expect(compiled.element.data.pattern).toBeDefined();
                const originalPattern = original.data.pattern as string[];
                const compiledPattern = compiled.element.data.pattern as string[];
                expect(compiledPattern).toHaveLength(originalPattern.length);
                expect(compiledPattern[2]).toBe("   "); // Empty last row preserved
            });

            it("should maintain data integrity for 2x2 pattern", () => {
                const original = shapedTwoByTwo;
                const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
                const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);

                // Test 2x2 pattern structure
                expect(compiled.element.data.pattern).toBeDefined();
                const compiledPattern = compiled.element.data.pattern as string[];
                expect(compiledPattern).toHaveLength(2);
                expect(compiledPattern[0]).toHaveLength(2);
                expect(compiledPattern[1]).toHaveLength(2);
            });

            it("should maintain data integrity with empty rows and columns", () => {
                const original = ShapedWithEmptyRowsAndColumns;
                const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
                const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);

                // Test pattern structure with empty spaces
                expect(original.data.pattern).toBeDefined();
                expect(compiled.element.data.pattern).toBeDefined();
                const originalPattern = original.data.pattern as string[];
                const compiledPattern = compiled.element.data.pattern as string[];
                expect(compiledPattern).toHaveLength(originalPattern.length);
                const patternArray = Array.isArray(compiledPattern) ? compiledPattern : [compiledPattern as string];
                expect(patternArray.every((row) => row.endsWith(" "))).toBe(true); // All rows end with space
            });
        });

        describe("Smelting round-trip", () => {
            it("should maintain blasting data integrity", () => {
                const original = blasting;
                const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
                const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);

                expect(compiled.element.data.type).toBe(original.data.type);
                expect(compiled.element.data.ingredient).toEqual(original.data.ingredient);
                expect(compiled.element.data.experience).toBe(original.data.experience);
                expect(compiled.element.data.cookingtime).toBe(original.data.cookingtime);
                expect(compiled.element.data.result).toEqual(original.data.result);
            });

            it("should maintain smelting data integrity", () => {
                const original = smelting;
                const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
                const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);

                expect(compiled.element.data.type).toBe(original.data.type);
                expect(compiled.element.data.ingredient).toEqual(original.data.ingredient);
                expect(compiled.element.data.experience).toBe(original.data.experience);
                expect(compiled.element.data.cookingtime).toBe(original.data.cookingtime);
            });

            it("should maintain smoking data integrity", () => {
                const original = smoking;
                const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
                const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);

                expect(compiled.element.data.type).toBe(original.data.type);
                expect(compiled.element.data.category).toBe(original.data.category);
                expect(compiled.element.data.experience).toBe(original.data.experience);
                expect(compiled.element.data.cookingtime).toBe(original.data.cookingtime);
            });

            it("should maintain campfire cooking data integrity", () => {
                const original = campfire_cooking;
                const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
                const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);

                expect(compiled.element.data.type).toBe(original.data.type);
                expect(compiled.element.data.experience).toBe(original.data.experience);
                expect(compiled.element.data.cookingtime).toBe(original.data.cookingtime);
            });
        });

        describe("Stonecutting round-trip", () => {
            it("should maintain data integrity", () => {
                const original = stonecutting;
                const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
                const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);

                expect(compiled.element.data.type).toBe(original.data.type);
                expect(compiled.element.data.ingredient).toEqual(original.data.ingredient);
                expect(compiled.element.data.result).toEqual(original.data.result);
            });
        });

        describe("Smithing round-trip", () => {
            it("should maintain smithing trim data integrity", () => {
                const original = smithing_transform; // This is actually smithing_trim in the data
                const voxel = RecipeDataDrivenToVoxelFormat({ element: original });
                const compiled = VoxelToRecipeDataDriven(voxel, "recipe", original.data);

                expect(compiled.element.data.type).toBe(original.data.type);
                expect(compiled.element.data.base).toEqual(original.data.base);
                expect(compiled.element.data.addition).toEqual(original.data.addition);
                expect(compiled.element.data.template).toEqual(original.data.template);
                expect(compiled.element.data.pattern).toBe(original.data.pattern);
            });

            it("should maintain smithing transform data integrity", () => {
                const original = transform;
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
                const original = transmute;
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

    describe("Edge cases and error handling", () => {
        it("should handle missing optional fields", () => {
            const minimalRecipe = {
                identifier: { namespace: "test", registry: "recipe", resource: "minimal" },
                data: {
                    type: "minecraft:crafting_shapeless",
                    ingredients: ["minecraft:dirt"],
                    result: "minecraft:stone"
                }
            };

            const voxel = RecipeDataDrivenToVoxelFormat({ element: minimalRecipe });
            expect(voxel).toBeDefined();
            expect(voxel.group).toBeUndefined();
            expect(voxel.category).toBeUndefined();
        });

        it("should handle unknown recipe types", () => {
            const unknownRecipe = {
                identifier: { namespace: "test", registry: "recipe", resource: "unknown" },
                data: {
                    type: "modname:custom_recipe",
                    custom_field: "value",
                    ingredients: ["minecraft:dirt"],
                    result: "minecraft:stone"
                }
            };

            const voxel = RecipeDataDrivenToVoxelFormat({ element: unknownRecipe });
            expect(voxel).toBeDefined();
            expect(voxel.type).toBe("modname:custom_recipe");
            expect(voxel.unknownFields?.custom_field).toBe("value");
        });

        it("should preserve unknown fields in round-trip", () => {
            const modRecipe = {
                identifier: { namespace: "test", registry: "recipe", resource: "mod_recipe" },
                data: {
                    type: "minecraft:crafting_shapeless",
                    ingredients: ["minecraft:dirt"],
                    result: "minecraft:stone",
                    mod_field: "preserved",
                    mod_complex: { nested: true, value: 42 }
                }
            };

            const voxel = RecipeDataDrivenToVoxelFormat({ element: modRecipe });
            const compiled = VoxelToRecipeDataDriven(voxel, "recipe", modRecipe.data);

            expect(compiled.element.data.mod_field).toBe("preserved");
            expect(compiled.element.data.mod_complex).toEqual({ nested: true, value: 42 });
        });
    });
});
