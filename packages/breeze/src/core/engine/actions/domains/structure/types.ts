import { type AllExpectedHandlerKeys, type ValidateHandlerRegistry, createHandlers } from "../../types";

export interface StructureActions {
	set_biomes: {
		biomes: string[];
		replace?: boolean;
	};
	add_spawn_override: {
		mobCategory: string;
		boundingBox: "piece" | "full";
		spawns: Array<{
			type: string;
			weight: number;
			minCount: number;
			maxCount: number;
		}>;
	};
	remove_spawn_override: {
		mobCategory: string;
	};
	set_jigsaw_config: {
		startPool?: string;
		size?: number;
		startHeight?: any;
		startJigsawName?: string;
		maxDistanceFromCenter?: number;
		useExpansionHack?: boolean;
	};
	add_pool_alias: {
		aliasType: string;
		alias?: string;
		target?: string;
		targets?: Array<{ weight: number; data: string }>;
	};
	remove_pool_alias: {
		alias: string;
	};
	set_terrain_adaptation: {
		adaptation: "none" | "beard_thin" | "beard_box" | "bury" | "encapsulate";
	};
	set_decoration_step: {
		step: string;
	};
}

export type StructureAction = {
	[K in keyof StructureActions]: StructureActions[K] & { type: `structure.${K}` };
}[keyof StructureActions];

export type StructureHandlerKeys = AllExpectedHandlerKeys<"structure", StructureActions>;
export const createStructureHandlers = <T extends Record<StructureHandlerKeys, any>>(
	handlers: ValidateHandlerRegistry<T, StructureHandlerKeys>
): T => createHandlers(handlers);
