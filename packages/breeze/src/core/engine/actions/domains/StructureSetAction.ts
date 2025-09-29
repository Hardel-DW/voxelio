import type {
	FrequencyReductionMethod,
	PlacementType,
	SpreadType,
	StructureSetProps,
	StructureSetStructure
} from "@/core/schema/structure_set/types";
import { Action } from "@/core/engine/actions/Action";

export class AddStructureAction extends Action<{ structure: string; weight: number; position?: number }> {
	readonly type = "structure_set.add_structure" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = structuredClone(element) as StructureSetProps;
		const newStructure: StructureSetStructure = {
			structure: this.params.structure,
			weight: this.params.weight
		};

		const structures = [...structureSet.structures];
		const { position } = this.params;
		if (position !== undefined && position >= 0 && position <= structures.length) {
			structures.splice(position, 0, newStructure);
		} else {
			structures.push(newStructure);
		}

		structureSet.structures = structures;
		return structureSet;
	}
}

export class RemoveStructureAction extends Action<{ structureId: string }> {
	readonly type = "structure_set.remove_structure" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = structuredClone(element) as StructureSetProps;
		structureSet.structures = structureSet.structures.filter((_, index) => `structure_${index}` !== this.params.structureId);
		return structureSet;
	}
}

export class ModifyStructureAction extends Action<{
	structureId: string;
	property: "structure" | "weight";
	value: string | number;
}> {
	readonly type = "structure_set.modify_structure" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = structuredClone(element) as StructureSetProps;
		const index = Number.parseInt(this.params.structureId.replace("structure_", ""), 10);
		if (Number.isNaN(index) || index < 0 || index >= structureSet.structures.length) {
			return structureSet;
		}

		const structures = [...structureSet.structures];
		structures[index] = {
			...structures[index],
			[this.params.property]: this.params.value
		} as StructureSetStructure;

		structureSet.structures = structures;
		return structureSet;
	}
}

export class SetPlacementTypeAction extends Action<{ placementType: PlacementType }> {
	readonly type = "structure_set.set_placement_type" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = structuredClone(element) as StructureSetProps;
		structureSet.placementType = this.params.placementType;
		return structureSet;
	}
}

export class ConfigurePlacementAction extends Action<{
	salt?: number;
	frequencyReductionMethod?: FrequencyReductionMethod;
	frequency?: number;
	locateOffset?: [number, number, number];
}> {
	readonly type = "structure_set.configure_placement" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = structuredClone(element) as StructureSetProps;
		if (this.params.salt !== undefined) structureSet.salt = this.params.salt;
		if (this.params.frequencyReductionMethod !== undefined) {
			structureSet.frequencyReductionMethod = this.params.frequencyReductionMethod;
		}
		if (this.params.frequency !== undefined) structureSet.frequency = this.params.frequency;
		if (this.params.locateOffset !== undefined) structureSet.locateOffset = this.params.locateOffset;
		return structureSet;
	}
}

export class SetExclusionZoneAction extends Action<{ otherSet: string; chunkCount: number }> {
	readonly type = "structure_set.set_exclusion_zone" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = structuredClone(element) as StructureSetProps;
		structureSet.exclusionZone = {
			otherSet: this.params.otherSet,
			chunkCount: this.params.chunkCount
		};
		return structureSet;
	}
}

export class RemoveExclusionZoneAction extends Action<{}> {
	readonly type = "structure_set.remove_exclusion_zone" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = structuredClone(element) as StructureSetProps;
		structureSet.exclusionZone = undefined;
		return structureSet;
	}
}

export class ConfigureConcentricRingsAction extends Action<{
	distance?: number;
	spread?: number;
	count?: number;
	preferredBiomes?: string[];
}> {
	readonly type = "structure_set.configure_concentric_rings" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = structuredClone(element) as StructureSetProps;
		if (this.params.distance !== undefined) structureSet.distance = this.params.distance;
		if (this.params.spread !== undefined) structureSet.spread = this.params.spread;
		if (this.params.count !== undefined) structureSet.count = this.params.count;
		if (this.params.preferredBiomes !== undefined) structureSet.preferredBiomes = this.params.preferredBiomes;
		return structureSet;
	}
}

export class ConfigureRandomSpreadAction extends Action<{
	spacing?: number;
	separation?: number;
	spreadType?: SpreadType;
}> {
	readonly type = "structure_set.configure_random_spread" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = structuredClone(element) as StructureSetProps;
		if (this.params.spacing !== undefined) structureSet.spacing = this.params.spacing;
		if (this.params.separation !== undefined) structureSet.separation = this.params.separation;
		if (this.params.spreadType !== undefined) structureSet.spreadType = this.params.spreadType;
		return structureSet;
	}
}

export class ReorderStructuresAction extends Action<{ structureIds: string[] }> {
	readonly type = "structure_set.reorder_structures" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const structureSet = structuredClone(element) as StructureSetProps;
		const reordered = this.params.structureIds
			.map((id) => {
				const index = Number.parseInt(id.replace("structure_", ""), 10);
				return structureSet.structures[index];
			})
			.filter((structure): structure is StructureSetStructure => Boolean(structure));

		structureSet.structures = reordered;
		return structureSet;
	}
}

// Liste des classes d'actions StructureSet - ajouter ici pour créer une nouvelle action
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
