import type { ActionLike } from "@/core/engine/actions/EngineAction";
import type { ActionJsonFromClasses, ActionsFromClasses } from "@/core/engine/actions/domain";
import { CORE_ACTION_CLASSES, type Condition } from "@/core/engine/actions/domains/core/actions";

export { CoreActions, CORE_ACTION_CLASSES } from "@/core/engine/actions/domains/core/actions";
export type { Condition };

export type CoreActionInstance = ActionsFromClasses<typeof CORE_ACTION_CLASSES>;
export type CoreAction = ActionJsonFromClasses<typeof CORE_ACTION_CLASSES>;

export function isCoreAction(action: ActionLike): action is CoreAction {
	return typeof action === "object" && action !== null && "type" in action && String(action.type).startsWith("core.");
}

export const coreActionTypes = CORE_ACTION_CLASSES.map((ctor) => ctor.type) as readonly string[];
