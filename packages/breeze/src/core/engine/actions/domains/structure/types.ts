import type { ActionLike } from "@/core/engine/actions/EngineAction";
import type { ActionJsonFromClasses } from "@/core/engine/actions/domain";
import { STRUCTURE_ACTION_CLASSES } from "@/core/engine/actions/domains/structure/actions";

export { StructureActions, STRUCTURE_ACTION_CLASSES } from "@/core/engine/actions/domains/structure/actions";
export type { StructureActionInstance } from "@/core/engine/actions/domains/structure/actions";
export type StructureAction = ActionJsonFromClasses<typeof STRUCTURE_ACTION_CLASSES>;

export function isStructureAction(action: ActionLike): action is StructureAction {
	return typeof action === "object" && action !== null && "type" in action && String(action.type).startsWith("structure.");
}

export const structureActionTypes = STRUCTURE_ACTION_CLASSES.map((ctor) => ctor.type) as readonly string[];
