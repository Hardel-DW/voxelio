import type { StructureProps, SpawnOverride, DecorationStep } from "@/core/schema/structure/types";
import type { Action } from "@/core/engine/actions/types";
import { EngineAction, extractPayload, type ActionLike, isEngineAction } from "@/core/engine/actions/EngineAction";

abstract class StructureEngineAction<TPayload extends Record<string, unknown>> extends EngineAction<TPayload> {
	protected clone(element: Record<string, unknown>): StructureProps {
		return structuredClone(element) as StructureProps;
	}
}

type SetBiomesPayload = { biomes: string[]; replace?: boolean };

export class SetBiomesAction extends StructureEngineAction<SetBiomesPayload> {
	static readonly type = "structure.set_biomes" as const;
	readonly type = SetBiomesAction.type;

	static create(biomes: string[], replace = false): SetBiomesAction {
		return new SetBiomesAction({ biomes, replace });
	}

	static fromJSON(action: Action): SetBiomesAction {
		if (action.type !== SetBiomesAction.type) {
			throw new Error(`Invalid action type '${action.type}' for SetBiomesAction`);
		}
		return new SetBiomesAction(extractPayload(action) as SetBiomesPayload);
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
	static readonly type = "structure.add_spawn_override" as const;
	readonly type = AddSpawnOverrideAction.type;

	static create(payload: AddSpawnOverridePayload): AddSpawnOverrideAction {
		return new AddSpawnOverrideAction(payload);
	}

	static fromJSON(action: Action): AddSpawnOverrideAction {
		if (action.type !== AddSpawnOverrideAction.type) {
			throw new Error(`Invalid action type '${action.type}' for AddSpawnOverrideAction`);
		}
		return new AddSpawnOverrideAction(extractPayload(action) as AddSpawnOverridePayload);
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
	static readonly type = "structure.remove_spawn_override" as const;
	readonly type = RemoveSpawnOverrideAction.type;

	static create(mobCategory: string): RemoveSpawnOverrideAction {
		return new RemoveSpawnOverrideAction({ mobCategory });
	}

	static fromJSON(action: Action): RemoveSpawnOverrideAction {
		if (action.type !== RemoveSpawnOverrideAction.type) {
			throw new Error(`Invalid action type '${action.type}' for RemoveSpawnOverrideAction`);
		}
		return new RemoveSpawnOverrideAction(extractPayload(action) as RemoveSpawnOverridePayload);
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
	static readonly type = "structure.set_jigsaw_config" as const;
	readonly type = SetJigsawConfigAction.type;

	static create(payload: SetJigsawConfigPayload): SetJigsawConfigAction {
		return new SetJigsawConfigAction(payload);
	}

	static fromJSON(action: Action): SetJigsawConfigAction {
		if (action.type !== SetJigsawConfigAction.type) {
			throw new Error(`Invalid action type '${action.type}' for SetJigsawConfigAction`);
		}
		return new SetJigsawConfigAction(extractPayload(action) as SetJigsawConfigPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = this.clone(element);
		const updates: Record<string, unknown> = {};

		if (this.payload.startPool !== undefined) updates.startPool = this.payload.startPool;
		if (this.payload.size !== undefined) updates.size = this.payload.size;
		if (this.payload.startHeight !== undefined) updates.startHeight = this.payload.startHeight;
		if (this.payload.startJigsawName !== undefined) updates.startJigsawName = this.payload.startJigsawName;
		if (this.payload.maxDistanceFromCenter !== undefined) updates.maxDistanceFromCenter = this.payload.maxDistanceFromCenter;
		if (this.payload.useExpansionHack !== undefined) updates.useExpansionHack = this.payload.useExpansionHack;

		return { structure, ...updates };
	}
}

type AddPoolAliasPayload = {
	aliasType: string;
	alias?: string;
	target?: string;
	targets?: Array<{ weight: number; data: string }>;
};

export class AddPoolAliasAction extends StructureEngineAction<AddPoolAliasPayload> {
	static readonly type = "structure.add_pool_alias" as const;
	readonly type = AddPoolAliasAction.type;

	static create(payload: AddPoolAliasPayload): AddPoolAliasAction {
		return new AddPoolAliasAction(payload);
	}

	static fromJSON(action: Action): AddPoolAliasAction {
		if (action.type !== AddPoolAliasAction.type) {
			throw new Error(`Invalid action type '${action.type}' for AddPoolAliasAction`);
		}
		return new AddPoolAliasAction(extractPayload(action) as AddPoolAliasPayload);
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
	static readonly type = "structure.remove_pool_alias" as const;
	readonly type = RemovePoolAliasAction.type;

	static create(alias: string): RemovePoolAliasAction {
		return new RemovePoolAliasAction({ alias });
	}

	static fromJSON(action: Action): RemovePoolAliasAction {
		if (action.type !== RemovePoolAliasAction.type) {
			throw new Error(`Invalid action type '${action.type}' for RemovePoolAliasAction`);
		}
		return new RemovePoolAliasAction(extractPayload(action) as RemovePoolAliasPayload);
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
	static readonly type = "structure.set_terrain_adaptation" as const;
	readonly type = SetTerrainAdaptationAction.type;

	static create(adaptation: SetTerrainAdaptationPayload["adaptation"]): SetTerrainAdaptationAction {
		return new SetTerrainAdaptationAction({ adaptation });
	}

	static fromJSON(action: Action): SetTerrainAdaptationAction {
		if (action.type !== SetTerrainAdaptationAction.type) {
			throw new Error(`Invalid action type '${action.type}' for SetTerrainAdaptationAction`);
		}
		return new SetTerrainAdaptationAction(extractPayload(action) as SetTerrainAdaptationPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = this.clone(element);
		structure.terrainAdaptation = this.payload.adaptation;
		return structure;
	}
}

type SetDecorationStepPayload = { step: string };

export class SetDecorationStepAction extends StructureEngineAction<SetDecorationStepPayload> {
	static readonly type = "structure.set_decoration_step" as const;
	readonly type = SetDecorationStepAction.type;

	static create(step: string): SetDecorationStepAction {
		return new SetDecorationStepAction({ step });
	}

	static fromJSON(action: Action): SetDecorationStepAction {
		if (action.type !== SetDecorationStepAction.type) {
			throw new Error(`Invalid action type '${action.type}' for SetDecorationStepAction`);
		}
		return new SetDecorationStepAction(extractPayload(action) as SetDecorationStepPayload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structure = this.clone(element);
		structure.step = this.payload.step as DecorationStep;
		return structure;
	}
}

export const STRUCTURE_ACTION_CLASSES = [
	SetBiomesAction,
	AddSpawnOverrideAction,
	RemoveSpawnOverrideAction,
	SetJigsawConfigAction,
	AddPoolAliasAction,
	RemovePoolAliasAction,
	SetTerrainAdaptationAction,
	SetDecorationStepAction
] as const;

export type StructureActionInstance = InstanceType<(typeof STRUCTURE_ACTION_CLASSES)[number]>;

export const StructureActions = {
	setBiomes: (biomes: string[], replace = false) => SetBiomesAction.create(biomes, replace),
	addSpawnOverride: (payload: AddSpawnOverridePayload) => AddSpawnOverrideAction.create(payload),
	removeSpawnOverride: (mobCategory: string) => RemoveSpawnOverrideAction.create(mobCategory),
	setJigsawConfig: (payload: SetJigsawConfigPayload) => SetJigsawConfigAction.create(payload),
	addPoolAlias: (payload: AddPoolAliasPayload) => AddPoolAliasAction.create(payload),
	removePoolAlias: (alias: string) => RemovePoolAliasAction.create(alias),
	setTerrainAdaptation: (adaptation: SetTerrainAdaptationPayload["adaptation"]) => SetTerrainAdaptationAction.create(adaptation),
	setDecorationStep: (step: string) => SetDecorationStepAction.create(step)
};

export function isStructureActionInstance(action: ActionLike): action is StructureActionInstance {
	return isEngineAction(action) && STRUCTURE_ACTION_CLASSES.some((ctor) => action instanceof ctor);
}
