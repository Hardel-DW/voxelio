import type { ActionLike } from "@/core/engine/actions/EngineAction";
import type { ActionJsonFromClasses } from "@/core/engine/actions/domain";
import { STRUCTURE_SET_ACTION_CLASSES } from "@/core/engine/actions/domains/structure_set/actions";

export { StructureSetActions, STRUCTURE_SET_ACTION_CLASSES } from "@/core/engine/actions/domains/structure_set/actions";
export type { StructureSetActionInstance } from "@/core/engine/actions/domains/structure_set/actions";
export type StructureSetAction = ActionJsonFromClasses<typeof STRUCTURE_SET_ACTION_CLASSES>;

export function isStructureSetAction(action: ActionLike): action is StructureSetAction {
	return typeof action === "object" && action !== null && "type" in action && String(action.type).startsWith("structure_set.");
}

export const structureSetActionTypes = STRUCTURE_SET_ACTION_CLASSES.map((ctor) => ctor.type) as readonly string[];
