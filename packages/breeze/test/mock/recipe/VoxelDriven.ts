import type { RecipeProps } from "@/core/schema/recipe/types";

export const shapelessVoxel: RecipeProps = {
    identifier: { namespace: "test", registry: "recipe", resource: "shapeless_voxel" },
    type: "minecraft:crafting_shapeless",
    category: "building",
    group: "planks",
    slots: {
        "0": "#minecraft:acacia_logs"
    },
    result: {
        item: "minecraft:acacia_planks",
        count: 4
    }
};
