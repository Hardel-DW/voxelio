import { ActionRegistry } from "@/core/engine/actions/registry";
import type { EngineAction } from "@/core/engine/actions/EngineAction";
import type { IdentifierObject } from "@/core/Identifier";

const registry = new ActionRegistry();

export function updateData<T extends Record<string, unknown>>(
	action: ActionLike,
	element: T,
	version?: number
): Partial<T> | undefined {
	return registry.execute(action, element, version);
}

export type ActionPayload = Record<string, unknown>;
export type ActionLike = Action | EngineAction;
export type ActionValue = string | number | boolean | IdentifierObject | unknown;
export type Action = BaseAction & Record<string, unknown>;
export interface BaseAction {
	type: string;
}