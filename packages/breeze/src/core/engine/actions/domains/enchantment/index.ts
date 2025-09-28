import type { ActionRegistry } from "../../registry";
import type { ActionHandler } from "../../types";
import { buildDomainHandlers } from "../../domain";
import { ENCHANTMENT_ACTION_CLASSES } from "./actions";

export default function register(registry: ActionRegistry): Map<string, ActionHandler> {
	return buildDomainHandlers(ENCHANTMENT_ACTION_CLASSES, (actionClass) => registry.registerClass(actionClass));
}
