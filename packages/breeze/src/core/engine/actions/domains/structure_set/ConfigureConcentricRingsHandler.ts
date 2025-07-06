import type { StructureSetProps } from "@/core/schema/structure_set/types";
import type { ActionHandler } from "../../types";
import type { StructureSetAction } from "./types";

export class ConfigureConcentricRingsHandler implements ActionHandler<StructureSetAction> {
    execute(
        action: Extract<StructureSetAction, { type: "structure_set.configure_concentric_rings" }>,
        element: Record<string, unknown>
    ): Record<string, unknown> {
        const structureSet = structuredClone(element) as StructureSetProps;

        if (action.distance !== undefined) {
            structureSet.distance = action.distance;
        }
        if (action.spread !== undefined) {
            structureSet.spread = action.spread;
        }
        if (action.count !== undefined) {
            structureSet.count = action.count;
        }
        if (action.preferredBiomes !== undefined) {
            structureSet.preferredBiomes = action.preferredBiomes;
        }

        return structureSet;
    }
}
