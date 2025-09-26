import { ActionBuilder } from "@/core/engine/actions/builders/ActionBuilder";
import type { CoreAction, Condition } from "@/core/engine/actions/domains/core/types";

/**
 * Builder for core actions with fluent API
 */
export class Actions extends ActionBuilder<CoreAction> {
	/**
	 * Set a value at a specific path
	 */
	setValue(path: string, value: unknown): SetValueBuilder {
		return new SetValueBuilder(path, value);
	}

	/**
	 * Toggle a value at a specific path
	 */
	toggleValue(path: string, value: unknown): ToggleValueBuilder {
		return new ToggleValueBuilder(path, value);
	}

	/**
	 * Toggle a value in a list/array at a specific path
	 */
	toggleValueInList(path: string, value: unknown): ToggleValueInListBuilder {
		return new ToggleValueInListBuilder(path, value);
	}

	/**
	 * Toggle all values in a list/array at a specific path
	 */
	toggleAllValuesInList(path: string, values: any[]): ToggleAllValuesInListBuilder {
		return new ToggleAllValuesInListBuilder(path, values);
	}

	/**
	 * Set a path to undefined
	 */
	setUndefined(path: string): UndefinedBuilder {
		return new UndefinedBuilder(path);
	}

	/**
	 * Invert a boolean value at a specific path
	 */
	invertBoolean(path: string): InvertBooleanBuilder {
		return new InvertBooleanBuilder(path);
	}

	/**
	 * Execute actions sequentially
	 */
	sequential(...actions: (CoreAction | ActionBuilder<CoreAction>)[]): SequentialBuilder {
		return new SequentialBuilder(actions);
	}

	/**
	 * Execute actions conditionally
	 */
	alternative(condition: boolean | Condition): AlternativeBuilder {
		return new AlternativeBuilder(condition);
	}

	build(): CoreAction {
		throw new Error("Use specific builder methods to create actions");
	}
}

class SetValueBuilder extends ActionBuilder<Extract<CoreAction, { type: "core.set_value" }>> {
	constructor(
		private path: string,
		private value: unknown
	) {
		super();
	}

	build() {
		return {
			type: "core.set_value" as const,
			path: this.path,
			value: this.value
		};
	}
}

class ToggleValueBuilder extends ActionBuilder<Extract<CoreAction, { type: "core.toggle_value" }>> {
	constructor(
		private path: string,
		private value: unknown
	) {
		super();
	}

	build() {
		return {
			type: "core.toggle_value" as const,
			path: this.path,
			value: this.value
		};
	}
}

class ToggleValueInListBuilder extends ActionBuilder<Extract<CoreAction, { type: "core.toggle_value_in_list" }>> {
	constructor(
		private path: string,
		private value: unknown
	) {
		super();
	}

	build() {
		return {
			type: "core.toggle_value_in_list" as const,
			path: this.path,
			value: this.value
		};
	}
}

class ToggleAllValuesInListBuilder extends ActionBuilder<Extract<CoreAction, { type: "core.toggle_all_values_in_list" }>> {
	constructor(
		private path: string,
		private values: any[]
	) {
		super();
	}

	build() {
		return {
			type: "core.toggle_all_values_in_list" as const,
			path: this.path,
			values: this.values
		};
	}
}

class UndefinedBuilder extends ActionBuilder<Extract<CoreAction, { type: "core.set_undefined" }>> {
	constructor(private path: string) {
		super();
	}

	build() {
		return {
			type: "core.set_undefined" as const,
			path: this.path
		};
	}
}

class InvertBooleanBuilder extends ActionBuilder<Extract<CoreAction, { type: "core.invert_boolean" }>> {
	constructor(private path: string) {
		super();
	}

	build() {
		return {
			type: "core.invert_boolean" as const,
			path: this.path
		};
	}
}

class SequentialBuilder extends ActionBuilder<Extract<CoreAction, { type: "core.sequential" }>> {
	constructor(private actions: (CoreAction | ActionBuilder<CoreAction>)[]) {
		super();
	}

	build() {
		return {
			type: "core.sequential" as const,
			actions: this.actions.map((action) => (action instanceof ActionBuilder ? action.build() : action))
		};
	}
}

class AlternativeBuilder extends ActionBuilder<Extract<CoreAction, { type: "core.alternative" }>> {
	private ifTrueAction?: CoreAction | ActionBuilder<CoreAction>;
	private ifFalseAction?: CoreAction | ActionBuilder<CoreAction>;

	constructor(private condition: boolean | Condition) {
		super();
	}

	/**
	 * Set the action to execute if condition is true
	 */
	ifTrue(action: CoreAction | ActionBuilder<CoreAction>): this {
		this.ifTrueAction = action;
		return this;
	}

	/**
	 * Set the action to execute if condition is false
	 */
	ifFalse(action: CoreAction | ActionBuilder<CoreAction>): this {
		this.ifFalseAction = action;
		return this;
	}

	build() {
		if (!this.ifTrueAction) {
			throw new Error("Alternative action requires an 'ifTrue' action");
		}

		const result: Extract<CoreAction, { type: "core.alternative" }> = {
			type: "core.alternative" as const,
			condition: this.condition,
			ifTrue: this.ifTrueAction instanceof ActionBuilder ? this.ifTrueAction.build() : this.ifTrueAction
		};

		if (this.ifFalseAction) {
			result.ifFalse = this.ifFalseAction instanceof ActionBuilder ? this.ifFalseAction.build() : this.ifFalseAction;
		}

		return result;
	}
}
