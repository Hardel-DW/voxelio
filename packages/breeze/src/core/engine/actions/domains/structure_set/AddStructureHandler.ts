import type { StructureSetProps, StructureSetStructure } from "@/core/schema/structure_set/types";
import type { ActionHandler } from "../../types";
import type { StructureSetAction } from "./types";

export class AddStructureHandler implements ActionHandler<StructureSetAction> {
    execute(
        action: Extract<StructureSetAction, { type: "structure_set.add_structure" }>,
        element: Record<string, unknown>
    ): Record<string, unknown> {
        const structureSet = structuredClone(element) as StructureSetProps;

        const newStructure: StructureSetStructure = {
            structure: action.structure,
            weight: action.weight
        };

        const updatedStructures = [...structureSet.structures];

        if (action.position !== undefined && action.position >= 0 && action.position <= updatedStructures.length) {
            updatedStructures.splice(action.position, 0, newStructure);
        } else {
            updatedStructures.push(newStructure);
        }

        structureSet.structures = updatedStructures;
        return structureSet;
    }
}
