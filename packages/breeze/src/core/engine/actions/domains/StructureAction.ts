import type { StructureProps, SpawnOverride, DecorationStep } from "@/core/schema/structure/types";
import { Action } from "@/core/engine/actions/index";

type Adaptation = "none" | "beard_thin" | "beard_box" | "bury" | "encapsulate";
type BoundingBox = "piece" | "full";
type PoolAlias = { weight: number; data: string };
type AddPoolAliasParams = {
	aliasType: string;
	alias?: string;
	target?: string;
	targets?: Array<PoolAlias>;
};

export class StructureAction<P = any> extends Action<P> {
	constructor(
		params: P,
		private applyFn: (element: Record<string, unknown>, params: P) => Record<string, unknown>
	) {
		super(params);
	}

	apply(element: Record<string, unknown>): Record<string, unknown> {
		return this.applyFn(element, this.params);
	}

	static setBiomes(biomes: string[], replace?: boolean): StructureAction<{ biomes: string[]; replace?: boolean }> {
		return new StructureAction({ biomes, replace }, (el, p: { biomes: string[]; replace?: boolean }) => {
			const structure = structuredClone(el) as StructureProps;
			if (p.replace) {
				structure.biomes = [...p.biomes];
			} else {
				const currentBiomes = Array.isArray(structure.biomes) ? structure.biomes : [];
				const existing = new Set(currentBiomes);
				structure.biomes = [...currentBiomes, ...p.biomes.filter((biome) => !existing.has(biome))];
			}
			return structure;
		});
	}

	static addSpawnOverride(
		mobCategory: string,
		boundingBox: BoundingBox,
		spawns: Array<{ type: string; weight: number; minCount: number; maxCount: number }>
	): StructureAction<{
		mobCategory: string;
		boundingBox: BoundingBox;
		spawns: Array<(typeof spawns)[number]>;
	}> {
		return new StructureAction(
			{ mobCategory, boundingBox, spawns },
			(
				el,
				p: {
					mobCategory: string;
					boundingBox: BoundingBox;
					spawns: Array<{ type: string; weight: number; minCount: number; maxCount: number }>;
				}
			) => {
				const structure = structuredClone(el) as StructureProps;
				const override: SpawnOverride = {
					mobCategory: p.mobCategory as SpawnOverride["mobCategory"],
					boundingBox: p.boundingBox,
					spawns: p.spawns
				};

				const current = Array.isArray(structure.spawnOverrides) ? structure.spawnOverrides : [];
				const filtered = current.filter((item) => item.mobCategory !== p.mobCategory);
				structure.spawnOverrides = [...filtered, override];
				return structure;
			}
		);
	}

	static removeSpawnOverride(mobCategory: string): StructureAction<{ mobCategory: string }> {
		return new StructureAction({ mobCategory }, (el, p: { mobCategory: string }) => {
			const structure = structuredClone(el) as StructureProps;
			const currentOverrides = Array.isArray(structure.spawnOverrides) ? structure.spawnOverrides : [];
			structure.spawnOverrides = currentOverrides.filter((override) => override.mobCategory !== p.mobCategory);
			return structure;
		});
	}

	static setJigsawConfig(config: {
		startPool?: string;
		size?: number;
		startHeight?: unknown;
		startJigsawName?: string;
		maxDistanceFromCenter?: number;
		useExpansionHack?: boolean;
	}): StructureAction<typeof config> {
		return new StructureAction(config, (el, p: typeof config) => {
			const structure = structuredClone(el) as StructureProps;
			if (p.startPool !== undefined) structure.startPool = p.startPool;
			if (p.size !== undefined) structure.size = p.size;
			if (p.startHeight !== undefined) structure.startHeight = p.startHeight;
			if (p.startJigsawName !== undefined) structure.startJigsawName = p.startJigsawName;
			if (p.maxDistanceFromCenter !== undefined) structure.maxDistanceFromCenter = p.maxDistanceFromCenter;
			if (p.useExpansionHack !== undefined) structure.useExpansionHack = p.useExpansionHack;
			return structure;
		});
	}

	static addPoolAlias(
		aliasType: string,
		alias?: string,
		target?: string,
		targets?: Array<PoolAlias>
	): StructureAction<AddPoolAliasParams> {
		return new StructureAction({ aliasType, alias, target, targets }, (el, p: AddPoolAliasParams) => {
			const structure = structuredClone(el) as StructureProps;
			const aliasObj: Record<string, unknown> = { type: p.aliasType };
			if (p.alias !== undefined) aliasObj.alias = p.alias;
			if (p.target !== undefined) aliasObj.target = p.target;
			if (p.targets !== undefined) aliasObj.targets = p.targets;

			const poolAliases = Array.isArray(structure.poolAliases) ? [...structure.poolAliases] : [];
			poolAliases.push(aliasObj as any);
			structure.poolAliases = poolAliases as StructureProps["poolAliases"];
			return structure;
		});
	}

	static removePoolAlias(alias: string): StructureAction<{ alias: string }> {
		return new StructureAction({ alias }, (el, p: { alias: string }) => {
			const structure = structuredClone(el) as StructureProps;
			const poolAliases = Array.isArray(structure.poolAliases) ? structure.poolAliases : [];
			structure.poolAliases = poolAliases.filter((a) => a.alias !== p.alias) as StructureProps["poolAliases"];
			return structure;
		});
	}

	static setTerrainAdaptation(adaptation: Adaptation): StructureAction<{ adaptation: Adaptation }> {
		return new StructureAction({ adaptation }, (el, p: { adaptation: Adaptation }) => {
			const structure = structuredClone(el) as StructureProps;
			structure.terrainAdaptation = p.adaptation;
			return structure;
		});
	}

	static setDecorationStep(step: string): StructureAction<{ step: string }> {
		return new StructureAction({ step }, (el, p: { step: string }) => {
			const structure = structuredClone(el) as StructureProps;
			structure.step = p.step as DecorationStep;
			return structure;
		});
	}
}
