import { type ActionType, executeAction } from "@/core/engine/actions/registry";
import type { Action } from "@/core/engine/actions/EngineAction";
import type { IdentifierObject } from "@/core/Identifier";

export function updateData<T extends Record<string, unknown>>(action: ActionLike, element: T, version?: number): Partial<T> | undefined {
	return executeAction(action, element, version) as Partial<T> | undefined;
}

export type ActionLike = Action | { type: ActionType;[key: string]: any };
export type ActionValue = string | number | boolean | IdentifierObject | unknown;
