import { executeAction } from "@/core/engine/actions/registry";
import type { ActionLike } from "@/core/engine/actions/registry";

export function updateData<T extends Record<string, unknown>>(action: ActionLike, element: T, version?: number): Partial<T> | undefined {
	return executeAction(action, element, version) as Partial<T> | undefined;
}

export abstract class Action<P = any> {
	abstract readonly type: string;

	constructor(public readonly params: P) { }

	/**
	 * Serialize action to JSON for logging/replay
	 */
	toJSON() {
		return { type: this.type, ...this.params };
	}

	/**
	 * Apply the action to an element
	 */
	abstract apply(element: Record<string, unknown>, version?: number): Record<string, unknown>;
}

export function isAction(value: unknown): value is Action {
	return value instanceof Action;
}
