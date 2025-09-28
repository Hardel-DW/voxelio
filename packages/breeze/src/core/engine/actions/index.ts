import { executeAction } from "@/core/engine/actions/registry";
import type { Action } from "@/core/engine/actions/EngineAction";
import type { IdentifierObject } from "@/core/Identifier";

export function updateData<T extends Record<string, unknown>>(
	action: ActionLike,
	element: T,
	version?: number
): Partial<T> | undefined {
	return executeAction(action, element, version) as Partial<T> | undefined;
}

export type ActionPayload = Record<string, unknown>;
export type ActionLike = Action | { type: string; [key: string]: any };
export type ActionValue = string | number | boolean | IdentifierObject | unknown;
export type ActionJSON = { type: string; [key: string]: any };