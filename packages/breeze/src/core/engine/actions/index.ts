import type { IdentifierObject } from "@/core/Identifier";

export function updateData<T extends Record<string, unknown>>(action: Action, element: T, version?: number): Partial<T> | undefined {
	return action.apply(element, version) as Partial<T> | undefined;
}

export abstract class Action<P = any> {
	constructor(public readonly params: P) {}
	abstract apply(element: Record<string, unknown>, version?: number): Record<string, unknown>;
}

export type ActionValue = string | number | boolean | IdentifierObject | unknown;
