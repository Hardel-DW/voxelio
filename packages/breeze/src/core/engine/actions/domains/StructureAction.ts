import type { StructureProps, SpawnOverride, DecorationStep } from "@/core/schema/structure/types";
import { Action } from "@/core/engine/actions/EngineAction";

export class SetBiomesAction extends Action<{ biomes: string[]; replace?: boolean }> {
	readonly type = "structure.set_biomes" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = structuredClone(element) as StructureProps;
		if (this.params.replace) {
			structure.biomes = [...this.params.biomes];
		} else {
			const currentBiomes = Array.isArray(structure.biomes) ? structure.biomes : [];
			const existing = new Set(currentBiomes);
			structure.biomes = [...currentBiomes, ...this.params.biomes.filter((biome) => !existing.has(biome))];
		}
		return structure;
	}
}

export class AddSpawnOverrideAction extends Action<{
	mobCategory: string;
	boundingBox: "piece" | "full";
	spawns: Array<{ type: string; weight: number; minCount: number; maxCount: number }>;
}> {
	readonly type = "structure.add_spawn_override" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = structuredClone(element) as StructureProps;
		const override: SpawnOverride = {
			mobCategory: this.params.mobCategory as SpawnOverride["mobCategory"],
			boundingBox: this.params.boundingBox,
			spawns: this.params.spawns
		};

		const current = Array.isArray(structure.spawnOverrides) ? structure.spawnOverrides : [];
		const filtered = current.filter((item) => item.mobCategory !== this.params.mobCategory);
		structure.spawnOverrides = [...filtered, override];
		return structure;
	}
}

export class RemoveSpawnOverrideAction extends Action<{ mobCategory: string }> {
	readonly type = "structure.remove_spawn_override" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = structuredClone(element) as StructureProps;
		const currentOverrides = Array.isArray(structure.spawnOverrides) ? structure.spawnOverrides : [];
		structure.spawnOverrides = currentOverrides.filter((override) => override.mobCategory !== this.params.mobCategory);
		return structure;
	}
}

export class SetJigsawConfigAction extends Action<{
	startPool?: string;
	size?: number;
	startHeight?: unknown;
	startJigsawName?: string;
	maxDistanceFromCenter?: number;
	useExpansionHack?: boolean;
}> {
	readonly type = "structure.set_jigsaw_config" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = structuredClone(element) as StructureProps;
		if (this.params.startPool !== undefined) structure.startPool = this.params.startPool;
		if (this.params.size !== undefined) structure.size = this.params.size;
		if (this.params.startHeight !== undefined) structure.startHeight = this.params.startHeight;
		if (this.params.startJigsawName !== undefined) structure.startJigsawName = this.params.startJigsawName;
		if (this.params.maxDistanceFromCenter !== undefined) structure.maxDistanceFromCenter = this.params.maxDistanceFromCenter;
		if (this.params.useExpansionHack !== undefined) structure.useExpansionHack = this.params.useExpansionHack;
		return structure;
	}
}

export class AddPoolAliasAction extends Action<{
	aliasType: string;
	alias?: string;
	target?: string;
	targets?: Array<{ weight: number; data: string }>;
}> {
	readonly type = "structure.add_pool_alias" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = structuredClone(element) as StructureProps;
		const alias: Record<string, unknown> = { type: this.params.aliasType };
		if (this.params.alias !== undefined) alias.alias = this.params.alias;
		if (this.params.target !== undefined) alias.target = this.params.target;
		if (this.params.targets !== undefined) alias.targets = this.params.targets;

		const poolAliases = Array.isArray(structure.poolAliases) ? [...structure.poolAliases] : [];
		poolAliases.push(alias as any);
		structure.poolAliases = poolAliases as StructureProps["poolAliases"];
		return structure;
	}
}

export class RemovePoolAliasAction extends Action<{ alias: string }> {
	readonly type = "structure.remove_pool_alias" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = structuredClone(element) as StructureProps;
		const poolAliases = Array.isArray(structure.poolAliases) ? structure.poolAliases : [];
		structure.poolAliases = poolAliases.filter((alias) => alias.alias !== this.params.alias) as StructureProps["poolAliases"];
		return structure;
	}
}

export class SetTerrainAdaptationAction extends Action<{ adaptation: "none" | "beard_thin" | "beard_box" | "bury" | "encapsulate" }> {
	readonly type = "structure.set_terrain_adaptation" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = structuredClone(element) as StructureProps;
		structure.terrainAdaptation = this.params.adaptation;
		return structure;
	}
}

export class SetDecorationStepAction extends Action<{ step: string }> {
	readonly type = "structure.set_decoration_step" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = structuredClone(element) as StructureProps;
		structure.step = this.params.step as DecorationStep;
		return structure;
	}
}

// Liste des classes d'actions Structure - ajouter ici pour créer une nouvelle action
export const STRUCTURE_ACTION_CLASSES = [
	SetBiomesAction,
	AddSpawnOverrideAction,
	RemoveSpawnOverrideAction,
	SetJigsawConfigAction,
	AddPoolAliasAction,
	RemovePoolAliasAction,
	SetTerrainAdaptationAction,
	SetDecorationStepAction,
] as const;
