import type { StructureSetProps } from "@/core/schema/structure_set/types";
import type { ActionHandler } from "../../types";
import type { StructureSetAction } from "./types";

export class SetPlacementConfigHandler implements ActionHandler<StructureSetAction> {
    execute(
        action: Extract<StructureSetAction, { type: "structure_set.configure_placement" }>,
        element: Record<string, unknown>
    ): Record<string, unknown> {
        const structureSet = structuredClone(element) as StructureSetProps;

        if (action.salt !== undefined) {
            structureSet.salt = action.salt;
        }
        if (action.frequencyReductionMethod !== undefined) {
            structureSet.frequencyReductionMethod = action.frequencyReductionMethod;
        }
        if (action.frequency !== undefined) {
            structureSet.frequency = action.frequency;
        }
        if (action.locateOffset !== undefined) {
            structureSet.locateOffset = action.locateOffset;
        }

        return structureSet;
    }
}
