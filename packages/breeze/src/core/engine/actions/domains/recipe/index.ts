import type { ActionRegistry } from "@/core/engine/actions/registry";
import type { ActionHandler } from "@/core/engine/actions/types";
import { buildDomainHandlers } from "@/core/engine/actions/domain";
import { RECIPE_ACTION_CLASSES } from "@/core/engine/actions/domains/recipe/actions";

export default function register(registry: ActionRegistry): Map<string, ActionHandler> {
	return buildDomainHandlers(RECIPE_ACTION_CLASSES, (actionClass) => registry.registerClass(actionClass));
}
