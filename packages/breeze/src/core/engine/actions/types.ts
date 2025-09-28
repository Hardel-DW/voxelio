import type { IdentifierObject } from "@/core/Identifier";
import type { ActionLike } from "./EngineAction";

export type ActionValue = string | number | boolean | IdentifierObject | unknown;

export interface ActionHandler<T = ActionLike> {
	execute(
		action: T,
		element: Record<string, unknown>,
		version?: number
	): Promise<Record<string, unknown> | undefined> | Record<string, unknown> | undefined;
}

export interface BaseAction {
	type: string;
}

export type Action = BaseAction & Record<string, unknown>;

export type UpdateDataFunction = (
	action: ActionLike,
	element: Record<string, unknown>,
	version?: number
) => Promise<Record<string, unknown> | undefined>;

export type { ActionLike };
