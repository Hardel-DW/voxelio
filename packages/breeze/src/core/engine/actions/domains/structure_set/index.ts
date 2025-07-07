import type { StructureSetProps } from "@/core/schema/structure_set/types";
import type { ActionHandler } from "../../types";
import { AddStructureHandler } from "./AddStructureHandler";
import { ConfigureConcentricRingsHandler } from "./ConfigureConcentricRingsHandler";
import { SetPlacementConfigHandler } from "./SetPlacementConfigHandler";
import type { StructureSetAction } from "./types";
import { createStructureSetHandlers } from "./types";

export default function register(): Map<string, ActionHandler<StructureSetAction>> {
	const handlerDefinitions = createStructureSetHandlers({
		"structure_set.add_structure": new AddStructureHandler(),
		"structure_set.remove_structure": new RemoveStructureHandler(),
		"structure_set.modify_structure": new ModifyStructureHandler(),
		"structure_set.set_placement_type": new SetPlacementTypeHandler(),
		"structure_set.configure_placement": new SetPlacementConfigHandler(),
		"structure_set.set_exclusion_zone": new SetExclusionZoneHandler(),
		"structure_set.remove_exclusion_zone": new RemoveExclusionZoneHandler(),
		"structure_set.configure_concentric_rings": new ConfigureConcentricRingsHandler(),
		"structure_set.configure_random_spread": new ConfigureRandomSpreadHandler(),
		"structure_set.reorder_structures": new ReorderStructuresHandler()
	});

	return new Map(Object.entries(handlerDefinitions));
}

class RemoveStructureHandler implements ActionHandler<StructureSetAction> {
	execute(
		action: Extract<StructureSetAction, { type: "structure_set.remove_structure" }>,
		element: Record<string, unknown>
	): Record<string, unknown> {
		const structureSet = structuredClone(element) as StructureSetProps;

		const updatedStructures = structureSet.structures.filter((_: any, index: number) => `structure_${index}` !== action.structureId);

		structureSet.structures = updatedStructures;
		return structureSet;
	}
}

class ModifyStructureHandler implements ActionHandler<StructureSetAction> {
	execute(
		action: Extract<StructureSetAction, { type: "structure_set.modify_structure" }>,
		element: Record<string, unknown>
	): Record<string, unknown> {
		const structureSet = structuredClone(element) as StructureSetProps;
		const structureIndex = Number.parseInt(action.structureId.replace("structure_", ""));

		if (structureIndex < 0 || structureIndex >= structureSet.structures.length) {
			return structureSet;
		}

		const updatedStructures = [...structureSet.structures];
		updatedStructures[structureIndex] = {
			...updatedStructures[structureIndex],
			[action.property]: action.value
		};

		structureSet.structures = updatedStructures;
		return structureSet;
	}
}

class SetPlacementTypeHandler implements ActionHandler<StructureSetAction> {
	execute(
		action: Extract<StructureSetAction, { type: "structure_set.set_placement_type" }>,
		element: Record<string, unknown>
	): Record<string, unknown> {
		const structureSet = structuredClone(element) as StructureSetProps;
		structureSet.placementType = action.placementType;
		return structureSet;
	}
}

class SetExclusionZoneHandler implements ActionHandler<StructureSetAction> {
	execute(
		action: Extract<StructureSetAction, { type: "structure_set.set_exclusion_zone" }>,
		element: Record<string, unknown>
	): Record<string, unknown> {
		const structureSet = structuredClone(element) as StructureSetProps;
		structureSet.exclusionZone = {
			otherSet: action.otherSet,
			chunkCount: action.chunkCount
		};
		return structureSet;
	}
}

class RemoveExclusionZoneHandler implements ActionHandler<StructureSetAction> {
	execute(
		_action: Extract<StructureSetAction, { type: "structure_set.remove_exclusion_zone" }>,
		element: Record<string, unknown>
	): Record<string, unknown> {
		const structureSet = structuredClone(element) as StructureSetProps;
		const { ...rest } = structureSet;
		return { ...rest };
	}
}

class ConfigureRandomSpreadHandler implements ActionHandler<StructureSetAction> {
	execute(
		action: Extract<StructureSetAction, { type: "structure_set.configure_random_spread" }>,
		element: Record<string, unknown>
	): Record<string, unknown> {
		const structureSet = structuredClone(element) as StructureSetProps;

		if (action.spacing !== undefined) {
			structureSet.spacing = action.spacing;
		}
		if (action.separation !== undefined) {
			structureSet.separation = action.separation;
		}
		if (action.spreadType !== undefined) {
			structureSet.spreadType = action.spreadType;
		}

		return structureSet;
	}
}

class ReorderStructuresHandler implements ActionHandler<StructureSetAction> {
	execute(
		action: Extract<StructureSetAction, { type: "structure_set.reorder_structures" }>,
		element: Record<string, unknown>
	): Record<string, unknown> {
		const structureSet = structuredClone(element) as StructureSetProps;

		const reorderedStructures = action.structureIds
			.map((id) => {
				const index = Number.parseInt(id.replace("structure_", ""));
				return structureSet.structures[index];
			})
			.filter(Boolean);

		structureSet.structures = reorderedStructures;
		return structureSet;
	}
}
