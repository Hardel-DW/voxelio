import { describe, it, expect } from "vitest";
import { VoxelToRecipeDataDriven } from "@/core/schema/recipe/Compiler";
import { RecipeDataDrivenToVoxelFormat } from "@/core/schema/recipe/Parser";
import { CoreAction } from "@/core/engine/actions/domains/CoreAction";
import { updateData } from "@/core/engine/actions";
import type { RecipeProps } from "@/core/schema/recipe/types";
import { shapeless } from "@test/mock/recipe/DataDriven";
import { shapelessVoxel } from "@test/mock/recipe/VoxelDriven";

describe("Recipe Compilation - Result Count", () => {
    it("should compile modified count when original data-driven is provided", () => {
        const voxelElement = shapelessVoxel;
        const originalDataDriven = shapeless.data;

        const modifiedCount = 16;
        const setCountAction = CoreAction.setValue("result.count", modifiedCount);
        const modifiedElement = updateData(setCountAction, voxelElement, 48) as RecipeProps;

        expect(modifiedElement.result.count).toBe(modifiedCount);

        const compiled = VoxelToRecipeDataDriven(modifiedElement, "recipe", originalDataDriven);

        expect(compiled.element.data.result).toEqual({
            count: modifiedCount,
            id: "minecraft:acacia_planks"
        });
    });

    it("should compile modified count from parsed data-driven", () => {
        const originalDataDriven = shapeless.data;
        const parsedVoxel = RecipeDataDrivenToVoxelFormat({ element: shapeless });

        expect(parsedVoxel.result.count).toBe(4);

        const modifiedCount = 32;
        const setCountAction = CoreAction.setValue("result.count", modifiedCount);
        const modifiedElement = updateData(setCountAction, parsedVoxel, 48) as RecipeProps;

        expect(modifiedElement.result.count).toBe(modifiedCount);

        const compiled = VoxelToRecipeDataDriven(modifiedElement, "recipe", originalDataDriven);

        expect(compiled.element.data.result).toEqual({
            count: modifiedCount,
            id: "minecraft:acacia_planks"
        });
    });

    it("should compile modified count without original data-driven", () => {
        const voxelElement = shapelessVoxel;

        const modifiedCount = 8;
        const setCountAction = CoreAction.setValue("result.count", modifiedCount);
        const modifiedElement = updateData(setCountAction, voxelElement, 48) as RecipeProps;

        expect(modifiedElement.result.count).toBe(modifiedCount);

        const compiled = VoxelToRecipeDataDriven(modifiedElement, "recipe");

        expect(compiled.element.data.result).toEqual({
            count: modifiedCount,
            id: "minecraft:acacia_planks"
        });
    });
});
