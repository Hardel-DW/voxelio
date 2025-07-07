import type { Action } from "../types";

/**
 * Base class for all action builders
 * Provides common functionality and ensures type safety
 */
export abstract class ActionBuilder<T extends Action = Action> {
	protected action: Partial<T> = {};

	/**
	 * Build the final action object
	 */
	abstract build(): T;

	/**
	 * Get the JSON representation of the action
	 */
	toJSON(): T {
		return this.build();
	}

	/**
	 * Create action from existing JSON
	 */
	static fromJSON<T extends Action>(json: T): T {
		return json;
	}
}

/**
 * Utility type to extract the action type from a builder
 */
export type ExtractAction<T> = T extends ActionBuilder<infer A> ? A : never;
