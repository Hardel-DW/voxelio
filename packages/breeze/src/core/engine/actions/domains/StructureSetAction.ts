import type {
	FrequencyReductionMethod,
	PlacementType,
	SpreadType,
	StructureSetProps,
	StructureSetStructure
} from "@/core/schema/structure_set/types";
import type { ActionJsonFromClasses } from "@/core/engine/actions/domain";
import { EngineAction } from "@/core/engine/actions/EngineAction";

abstract class StructureSetEngineAction<TPayload extends Record<string, unknown>> extends EngineAction<TPayload> {
	protected clone(element: Record<string, unknown>): StructureSetProps {
		return structuredClone(element) as StructureSetProps;
	}
}

type AddStructurePayload = { structure: string; weight: number; position?: number };

export class AddStructureAction extends StructureSetEngineAction<AddStructurePayload> {
	static readonly type = "structure_set.add_structure" as const;
	readonly type = AddStructureAction.type;

	static create(structure: string, weight: number, position?: number): AddStructureAction {
		return new AddStructureAction({ structure, weight, position });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = this.clone(element);
		const newStructure: StructureSetStructure = {
			structure: this.payload.structure,
			weight: this.payload.weight
		};

		const structures = [...structureSet.structures];
		const { position } = this.payload;
		if (position !== undefined && position >= 0 && position <= structures.length) {
			structures.splice(position, 0, newStructure);
		} else {
			structures.push(newStructure);
		}

		structureSet.structures = structures;
		return structureSet;
	}
}

type RemoveStructurePayload = { structureId: string };

export class RemoveStructureAction extends StructureSetEngineAction<RemoveStructurePayload> {
	static readonly type = "structure_set.remove_structure" as const;
	readonly type = RemoveStructureAction.type;

	static create(structureId: string): RemoveStructureAction {
		return new RemoveStructureAction({ structureId });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = this.clone(element);
		structureSet.structures = structureSet.structures.filter((_, index) => `structure_${index}` !== this.payload.structureId);
		return structureSet;
	}
}

type ModifyStructurePayload = {
	structureId: string;
	property: "structure" | "weight";
	value: string | number;
};

export class ModifyStructureAction extends StructureSetEngineAction<ModifyStructurePayload> {
	static readonly type = "structure_set.modify_structure" as const;
	readonly type = ModifyStructureAction.type;

	static create(payload: ModifyStructurePayload): ModifyStructureAction {
		return new ModifyStructureAction(payload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = this.clone(element);
		const index = Number.parseInt(this.payload.structureId.replace("structure_", ""), 10);
		if (Number.isNaN(index) || index < 0 || index >= structureSet.structures.length) {
			return structureSet;
		}

		const structures = [...structureSet.structures];
		structures[index] = {
			...structures[index],
			[this.payload.property]: this.payload.value
		} as StructureSetStructure;

		structureSet.structures = structures;
		return structureSet;
	}
}

type SetPlacementTypePayload = { placementType: PlacementType };

export class SetPlacementTypeAction extends StructureSetEngineAction<SetPlacementTypePayload> {
	static readonly type = "structure_set.set_placement_type" as const;
	readonly type = SetPlacementTypeAction.type;

	static create(placementType: PlacementType): SetPlacementTypeAction {
		return new SetPlacementTypeAction({ placementType });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = this.clone(element);
		structureSet.placementType = this.payload.placementType;
		return structureSet;
	}
}

type ConfigurePlacementPayload = {
	salt?: number;
	frequencyReductionMethod?: FrequencyReductionMethod;
	frequency?: number;
	locateOffset?: [number, number, number];
};

export class ConfigurePlacementAction extends StructureSetEngineAction<ConfigurePlacementPayload> {
	static readonly type = "structure_set.configure_placement" as const;
	readonly type = ConfigurePlacementAction.type;

	static create(payload: ConfigurePlacementPayload): ConfigurePlacementAction {
		return new ConfigurePlacementAction(payload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = this.clone(element);
		if (this.payload.salt !== undefined) structureSet.salt = this.payload.salt;
		if (this.payload.frequencyReductionMethod !== undefined) {
			structureSet.frequencyReductionMethod = this.payload.frequencyReductionMethod;
		}
		if (this.payload.frequency !== undefined) structureSet.frequency = this.payload.frequency;
		if (this.payload.locateOffset !== undefined) structureSet.locateOffset = this.payload.locateOffset;
		return structureSet;
	}
}

type SetExclusionZonePayload = { otherSet: string; chunkCount: number };

export class SetExclusionZoneAction extends StructureSetEngineAction<SetExclusionZonePayload> {
	static readonly type = "structure_set.set_exclusion_zone" as const;
	readonly type = SetExclusionZoneAction.type;

	static create(otherSet: string, chunkCount: number): SetExclusionZoneAction {
		return new SetExclusionZoneAction({ otherSet, chunkCount });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = this.clone(element);
		structureSet.exclusionZone = {
			otherSet: this.payload.otherSet,
			chunkCount: this.payload.chunkCount
		};
		return structureSet;
	}
}

export class RemoveExclusionZoneAction extends StructureSetEngineAction<Record<string, never>> {
	static readonly type = "structure_set.remove_exclusion_zone" as const;
	readonly type = RemoveExclusionZoneAction.type;

	constructor() {
		super({});
	}

	static create(): RemoveExclusionZoneAction {
		return new RemoveExclusionZoneAction();
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = this.clone(element);
		structureSet.exclusionZone = undefined;
		return structureSet;
	}
}

type ConfigureConcentricRingsPayload = {
	distance?: number;
	spread?: number;
	count?: number;
	preferredBiomes?: string[];
};

export class ConfigureConcentricRingsAction extends StructureSetEngineAction<ConfigureConcentricRingsPayload> {
	static readonly type = "structure_set.configure_concentric_rings" as const;
	readonly type = ConfigureConcentricRingsAction.type;

	static create(payload: ConfigureConcentricRingsPayload): ConfigureConcentricRingsAction {
		return new ConfigureConcentricRingsAction(payload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = this.clone(element);
		if (this.payload.distance !== undefined) structureSet.distance = this.payload.distance;
		if (this.payload.spread !== undefined) structureSet.spread = this.payload.spread;
		if (this.payload.count !== undefined) structureSet.count = this.payload.count;
		if (this.payload.preferredBiomes !== undefined) structureSet.preferredBiomes = this.payload.preferredBiomes;
		return structureSet;
	}
}

type ConfigureRandomSpreadPayload = {
	spacing?: number;
	separation?: number;
	spreadType?: SpreadType;
};

export class ConfigureRandomSpreadAction extends StructureSetEngineAction<ConfigureRandomSpreadPayload> {
	static readonly type = "structure_set.configure_random_spread" as const;
	readonly type = ConfigureRandomSpreadAction.type;

	static create(payload: ConfigureRandomSpreadPayload): ConfigureRandomSpreadAction {
		return new ConfigureRandomSpreadAction(payload);
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = this.clone(element);
		if (this.payload.spacing !== undefined) structureSet.spacing = this.payload.spacing;
		if (this.payload.separation !== undefined) structureSet.separation = this.payload.separation;
		if (this.payload.spreadType !== undefined) structureSet.spreadType = this.payload.spreadType;
		return structureSet;
	}
}

type ReorderStructuresPayload = { structureIds: string[] };

export class ReorderStructuresAction extends StructureSetEngineAction<ReorderStructuresPayload> {
	static readonly type = "structure_set.reorder_structures" as const;
	readonly type = ReorderStructuresAction.type;

	static create(structureIds: string[]): ReorderStructuresAction {
		return new ReorderStructuresAction({ structureIds });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = this.clone(element);
		const reordered = this.payload.structureIds
			.map((id) => {
				const index = Number.parseInt(id.replace("structure_", ""), 10);
				return structureSet.structures[index];
			})
			.filter((structure): structure is StructureSetStructure => Boolean(structure));

		structureSet.structures = reordered;
		return structureSet;
	}
}

export const STRUCTURE_SET_ACTION_CLASSES = [
	AddStructureAction,
	RemoveStructureAction,
	ModifyStructureAction,
	SetPlacementTypeAction,
	ConfigurePlacementAction,
	SetExclusionZoneAction,
	RemoveExclusionZoneAction,
	ConfigureConcentricRingsAction,
	ConfigureRandomSpreadAction,
	ReorderStructuresAction
] as const;

export type StructureSetAction = ActionJsonFromClasses<typeof STRUCTURE_SET_ACTION_CLASSES>;

export const StructureSetActions = {
	addStructure: (structure: string, weight: number, position?: number) => AddStructureAction.create(structure, weight, position),
	removeStructure: (structureId: string) => RemoveStructureAction.create(structureId),
	modifyStructure: (payload: ModifyStructurePayload) => ModifyStructureAction.create(payload),
	setPlacementType: (placementType: PlacementType) => SetPlacementTypeAction.create(placementType),
	configurePlacement: (payload: ConfigurePlacementPayload) => ConfigurePlacementAction.create(payload),
	setExclusionZone: (otherSet: string, chunkCount: number) => SetExclusionZoneAction.create(otherSet, chunkCount),
	removeExclusionZone: () => RemoveExclusionZoneAction.create(),
	configureConcentricRings: (payload: ConfigureConcentricRingsPayload) => ConfigureConcentricRingsAction.create(payload),
	configureRandomSpread: (payload: ConfigureRandomSpreadPayload) => ConfigureRandomSpreadAction.create(payload),
	reorderStructures: (structureIds: string[]) => ReorderStructuresAction.create(structureIds)
};
