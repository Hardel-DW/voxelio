import type { StructureProps, SpawnOverride, DecorationStep } from "@/core/schema/structure/types";
import { defineActionDomain, type ActionJsonFromClasses } from "@/core/engine/actions/domain";
import { EngineAction } from "@/core/engine/actions/EngineAction";

abstract class StructureEngineAction<TPayload extends Record<string, unknown>> extends EngineAction<TPayload> {
	protected clone(element: Record<string, unknown>): StructureProps {
		return structuredClone(element) as StructureProps;
	}
}

type SetBiomesPayload = { biomes: string[]; replace?: boolean };

export class SetBiomesAction extends StructureEngineAction<SetBiomesPayload> {
	static create(biomes: string[], replace = false): SetBiomesAction {
		return new SetBiomesAction({ biomes, replace });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = this.clone(element);
		if (this.payload.replace) {
			structure.biomes = [...this.payload.biomes];
		} else {
			const currentBiomes = Array.isArray(structure.biomes) ? structure.biomes : [];
			const existing = new Set(currentBiomes);
			structure.biomes = [...currentBiomes, ...this.payload.biomes.filter((biome) => !existing.has(biome))];
		}
		return structure;
	}
}

type AddSpawnOverridePayload = {
	mobCategory: string;
	boundingBox: "piece" | "full";
	spawns: Array<{ type: string; weight: number; minCount: number; maxCount: number }>;
};

export class AddSpawnOverrideAction extends StructureEngineAction<AddSpawnOverridePayload> {
	static create(payload: AddSpawnOverridePayload): AddSpawnOverrideAction {
		return new AddSpawnOverrideAction(payload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = this.clone(element);
		const override: SpawnOverride = {
			mobCategory: this.payload.mobCategory as SpawnOverride["mobCategory"],
			boundingBox: this.payload.boundingBox,
			spawns: this.payload.spawns
		};

		const current = Array.isArray(structure.spawnOverrides) ? structure.spawnOverrides : [];
		const filtered = current.filter((item) => item.mobCategory !== this.payload.mobCategory);
		structure.spawnOverrides = [...filtered, override];
		return structure;
	}
}

type RemoveSpawnOverridePayload = { mobCategory: string };

export class RemoveSpawnOverrideAction extends StructureEngineAction<RemoveSpawnOverridePayload> {
	static create(mobCategory: string): RemoveSpawnOverrideAction {
		return new RemoveSpawnOverrideAction({ mobCategory });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = this.clone(element);
		const currentOverrides = Array.isArray(structure.spawnOverrides) ? structure.spawnOverrides : [];
		structure.spawnOverrides = currentOverrides.filter((override) => override.mobCategory !== this.payload.mobCategory);
		return structure;
	}
}

type SetJigsawConfigPayload = {
	startPool?: string;
	size?: number;
	startHeight?: unknown;
	startJigsawName?: string;
	maxDistanceFromCenter?: number;
	useExpansionHack?: boolean;
};

export class SetJigsawConfigAction extends StructureEngineAction<SetJigsawConfigPayload> {
	static create(payload: SetJigsawConfigPayload): SetJigsawConfigAction {
		return new SetJigsawConfigAction(payload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = this.clone(element);
		if (this.payload.startPool !== undefined) structure.startPool = this.payload.startPool;
		if (this.payload.size !== undefined) structure.size = this.payload.size;
		if (this.payload.startHeight !== undefined) structure.startHeight = this.payload.startHeight;
		if (this.payload.startJigsawName !== undefined) structure.startJigsawName = this.payload.startJigsawName;
		if (this.payload.maxDistanceFromCenter !== undefined) structure.maxDistanceFromCenter = this.payload.maxDistanceFromCenter;
		if (this.payload.useExpansionHack !== undefined) structure.useExpansionHack = this.payload.useExpansionHack;
		return structure;
	}
}

type AddPoolAliasPayload = {
	aliasType: string;
	alias?: string;
	target?: string;
	targets?: Array<{ weight: number; data: string }>;
};

export class AddPoolAliasAction extends StructureEngineAction<AddPoolAliasPayload> {
	static create(payload: AddPoolAliasPayload): AddPoolAliasAction {
		return new AddPoolAliasAction(payload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = this.clone(element);
		const alias: Record<string, unknown> = { type: this.payload.aliasType };
		if (this.payload.alias !== undefined) alias.alias = this.payload.alias;
		if (this.payload.target !== undefined) alias.target = this.payload.target;
		if (this.payload.targets !== undefined) alias.targets = this.payload.targets;

		const poolAliases = Array.isArray(structure.poolAliases) ? [...structure.poolAliases] : [];
		poolAliases.push(alias as any);
		structure.poolAliases = poolAliases as StructureProps["poolAliases"];
		return structure;
	}
}

type RemovePoolAliasPayload = { alias: string };

export class RemovePoolAliasAction extends StructureEngineAction<RemovePoolAliasPayload> {
	static create(alias: string): RemovePoolAliasAction {
		return new RemovePoolAliasAction({ alias });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = this.clone(element);
		const poolAliases = Array.isArray(structure.poolAliases) ? structure.poolAliases : [];
		structure.poolAliases = poolAliases.filter((alias) => alias.alias !== this.payload.alias) as StructureProps["poolAliases"];
		return structure;
	}
}

type SetTerrainAdaptationPayload = { adaptation: "none" | "beard_thin" | "beard_box" | "bury" | "encapsulate" };

export class SetTerrainAdaptationAction extends StructureEngineAction<SetTerrainAdaptationPayload> {
	static create(adaptation: SetTerrainAdaptationPayload["adaptation"]): SetTerrainAdaptationAction {
		return new SetTerrainAdaptationAction({ adaptation });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = this.clone(element);
		structure.terrainAdaptation = this.payload.adaptation;
		return structure;
	}
}

type SetDecorationStepPayload = { step: string };

export class SetDecorationStepAction extends StructureEngineAction<SetDecorationStepPayload> {
	static create(step: string): SetDecorationStepAction {
		return new SetDecorationStepAction({ step });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = this.clone(element);
		structure.step = this.payload.step as DecorationStep;
		return structure;
	}
}

const STRUCTURE_ACTION_DOMAIN = defineActionDomain("structure", [
	["setBiomes", "set_biomes", SetBiomesAction, (biomes: string[], replace = false) => SetBiomesAction.create(biomes, replace)],
	[
		"addSpawnOverride",
		"add_spawn_override",
		AddSpawnOverrideAction,
		(payload: AddSpawnOverridePayload) => AddSpawnOverrideAction.create(payload)
	],
	[
		"removeSpawnOverride",
		"remove_spawn_override",
		RemoveSpawnOverrideAction,
		(mobCategory: string) => RemoveSpawnOverrideAction.create(mobCategory)
	],
	[
		"setJigsawConfig",
		"set_jigsaw_config",
		SetJigsawConfigAction,
		(payload: SetJigsawConfigPayload) => SetJigsawConfigAction.create(payload)
	],
	["addPoolAlias", "add_pool_alias", AddPoolAliasAction, (payload: AddPoolAliasPayload) => AddPoolAliasAction.create(payload)],
	["removePoolAlias", "remove_pool_alias", RemovePoolAliasAction, (alias: string) => RemovePoolAliasAction.create(alias)],
	[
		"setTerrainAdaptation",
		"set_terrain_adaptation",
		SetTerrainAdaptationAction,
		(adaptation: SetTerrainAdaptationPayload["adaptation"]) => SetTerrainAdaptationAction.create(adaptation)
	],
	["setDecorationStep", "set_decoration_step", SetDecorationStepAction, (step: string) => SetDecorationStepAction.create(step)]
] as const);

export const STRUCTURE_ACTION_CLASSES = STRUCTURE_ACTION_DOMAIN.classes;
export const StructureActions = STRUCTURE_ACTION_DOMAIN.builders;

export type StructureAction = ActionJsonFromClasses<typeof STRUCTURE_ACTION_CLASSES>;
