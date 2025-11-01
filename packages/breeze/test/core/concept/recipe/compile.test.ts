import { describe, it, expect } from "vitest";
import { VoxelToRecipeDataDriven } from "@/core/schema/recipe/Compiler";
import { RecipeDataDrivenToVoxelFormat } from "@/core/schema/recipe/Parser";
import { CoreAction } from "@/core/engine/actions/domains/CoreAction";
import { updateData } from "@/core/engine/actions";
import { shapeless } from "@test/mock/concept/recipe";
import type { RecipeProps } from "@/core/schema/recipe/types";

describe("Recipe Compilation - Result Count", () => {
    it("should compile modified count when original data-driven is provided", () => {
        const parsed = RecipeDataDrivenToVoxelFormat({ element: shapeless });
        const modifiedCount = 16;
        const setCountAction = CoreAction.setValue("result.count", modifiedCount);
        const modifiedElement = updateData(setCountAction, parsed, 48) as RecipeProps;
        expect(modifiedElement.result.count).toBe(modifiedCount);
        const compiled = VoxelToRecipeDataDriven(modifiedElement, "recipe", shapeless.data);
        const compiledWithoutOriginal = VoxelToRecipeDataDriven(modifiedElement, "recipe");
        expect(compiled.element.data.result).toEqual({ count: modifiedCount, id: "minecraft:acacia_planks" });
        expect(compiledWithoutOriginal.element.data.result).toEqual({ count: modifiedCount, id: "minecraft:acacia_planks" });
    });
});
