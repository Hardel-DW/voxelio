import type { Compiler } from "@/core/engine/Compiler";
import type { Parser } from "@/core/engine/Parser";
import { VoxelToEnchantmentDataDriven } from "@/core/schema/enchant/Compiler";
import { EnchantmentDataDrivenToVoxelFormat } from "@/core/schema/enchant/Parser";
import type { EnchantmentProps } from "@/core/schema/enchant/types";
import { VoxelToRecipeDataDriven } from "@/core/schema/recipe/Compiler";
import { RecipeDataDrivenToVoxelFormat } from "@/core/schema/recipe/Parser";
import type { MinecraftRecipe, RecipeProps } from "@/core/schema/recipe/types";
import type { Enchantment } from "@/core/schema/enchant/types";
import { VoxelToLootDataDriven } from "../schema/loot/Compiler";
import { LootDataDrivenToVoxelFormat } from "../schema/loot/Parser";
import type { LootTableProps, MinecraftLootTable } from "../schema/loot/types";
import { VoxelToStructureDataDriven } from "../schema/structure/Compiler";
import { StructureDataDrivenToVoxelFormat } from "../schema/structure/Parser";
import type { MinecraftStructure, StructureProps } from "../schema/structure/types";
import { VoxelToStructureSetDataDriven } from "../schema/structure_set/Compiler";
import { StructureSetDataDrivenToVoxelFormat } from "../schema/structure_set/Parser";
import type { MinecraftStructureSet, StructureSetProps } from "../schema/structure_set/types";

export type GetAnalyserVoxel<T extends keyof Analysers> = Analysers[T]["voxel"];
export type GetAnalyserMinecraft<T extends keyof Analysers> = Analysers[T]["minecraft"];
export type VoxelTypes = Analysers[keyof Analysers]["voxel"];

export type Analysers = {
	enchantment: {
		voxel: EnchantmentProps;
		minecraft: Enchantment;
	};
	loot_table: {
		voxel: LootTableProps;
		minecraft: MinecraftLootTable;
	};
	recipe: {
		voxel: RecipeProps;
		minecraft: MinecraftRecipe;
	};
	"worldgen/structure": {
		voxel: StructureProps;
		minecraft: MinecraftStructure;
	};
	"worldgen/structure_set": {
		voxel: StructureSetProps;
		minecraft: MinecraftStructureSet;
	};
};

export interface Analyser<T extends keyof Analysers> {
	compiler: Compiler<Analysers[T]["voxel"], Analysers[T]["minecraft"]>;
	parser: Parser<Analysers[T]["voxel"], Analysers[T]["minecraft"]>;
	hasTag: boolean;
}

export type VersionedAnalysers = {
	[Q in keyof Analysers]: Analyser<Q>;
};

export const analyserCollection: VersionedAnalysers = {
	enchantment: {
		compiler: VoxelToEnchantmentDataDriven,
		parser: EnchantmentDataDrivenToVoxelFormat,
		hasTag: true
	},
	loot_table: {
		compiler: VoxelToLootDataDriven,
		parser: LootDataDrivenToVoxelFormat,
		hasTag: false
	},
	recipe: {
		compiler: VoxelToRecipeDataDriven,
		parser: RecipeDataDrivenToVoxelFormat,
		hasTag: false
	},
	"worldgen/structure": {
		compiler: VoxelToStructureDataDriven,
		parser: StructureDataDrivenToVoxelFormat,
		hasTag: false
	},
	"worldgen/structure_set": {
		compiler: VoxelToStructureSetDataDriven,
		parser: StructureSetDataDrivenToVoxelFormat,
		hasTag: true
	}
};

export const conceptWithTag = new Map<keyof Analysers, boolean>(
	Object.entries(analyserCollection).map(([key, analyser]) => [key as keyof Analysers, analyser.hasTag])
);

/**
 * Get all concepts as a Map for iteration
 */
export function getAllConcepts(): Map<keyof Analysers, Analyser<keyof Analysers>> {
	return new Map(Object.entries(analyserCollection) as Array<[keyof Analysers, Analyser<keyof Analysers>]>);
}

export function isVoxel<T extends keyof Analysers>(
	element: Analysers[keyof Analysers]["voxel"],
	registry: T
): element is Analysers[T]["voxel"] {
	return element.identifier.registry === registry;
}
