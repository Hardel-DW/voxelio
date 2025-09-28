import type { ActionLike } from "@/core/engine/actions/EngineAction";
import type { ActionJsonFromClasses } from "@/core/engine/actions/domain";
import { ENCHANTMENT_ACTION_CLASSES } from "@/core/engine/actions/domains/enchantment/actions";

export { EnchantmentActions, ENCHANTMENT_ACTION_CLASSES } from "@/core/engine/actions/domains/enchantment/actions";
export type { EnchantmentActionInstance } from "@/core/engine/actions/domains/enchantment/actions";

export type EnchantmentAction = ActionJsonFromClasses<typeof ENCHANTMENT_ACTION_CLASSES>;

export function isEnchantmentAction(action: ActionLike): action is EnchantmentAction {
	return typeof action === "object" && action !== null && "type" in action && String(action.type).startsWith("enchantment.");
}

export const enchantmentActionTypes = ENCHANTMENT_ACTION_CLASSES.map((ctor) => ctor.type) as readonly string[];
