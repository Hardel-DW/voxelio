import type { VoxelElement } from "@/core/Element";
import { defineActionDomain, type ActionJsonFromClasses } from "@/core/engine/actions/domain";
import { deleteValueAtPath, getValueAtPath, setValueAtPath } from "@/core/engine/actions/utils";
import { EngineAction, type ActionExecutionContext, type ActionLike } from "@/core/engine/actions/EngineAction";

export type Condition = (element: VoxelElement) => boolean;
type BasePayload = Record<string, unknown>;

function ensureArray<T>(value: unknown): T[] {
	return Array.isArray(value) ? (value as T[]) : [];
}

abstract class CoreEngineAction<TPayload extends BasePayload> extends EngineAction<TPayload> {
	protected cloneElement<T extends Record<string, unknown>>(element: T): T {
		return structuredClone(element);
	}
}

type SetValuePayload = { path: string; value: unknown };

export class SetValueAction extends CoreEngineAction<SetValuePayload> {
	constructor(payload: SetValuePayload) {
		if (!payload.path) {
			throw new Error("SetValueAction requires a path");
		}
		super(payload);
	}

	static create(path: string, value: unknown): SetValueAction {
		return new SetValueAction({ path, value });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		return setValueAtPath(element, this.payload.path, this.payload.value);
	}
}

type ToggleValuePayload = { path: string; value: unknown };

export class ToggleValueAction extends CoreEngineAction<ToggleValuePayload> {
	constructor(payload: ToggleValuePayload) {
		if (!payload.path) {
			throw new Error("ToggleValueAction requires a path");
		}
		super(payload);
	}

	static create(path: string, value: unknown): ToggleValueAction {
		return new ToggleValueAction({ path, value });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const currentValue = getValueAtPath(element, this.payload.path);
		const nextValue = currentValue === this.payload.value ? undefined : this.payload.value;
		return setValueAtPath(element, this.payload.path, nextValue);
	}
}

type ToggleValueInListPayload = { path: string; value: unknown };

export class ToggleValueInListAction extends CoreEngineAction<ToggleValueInListPayload> {
	constructor(payload: ToggleValueInListPayload) {
		if (!payload.path) {
			throw new Error("ToggleValueInListAction requires a path");
		}
		super(payload);
	}

	static create(path: string, value: unknown): ToggleValueInListAction {
		return new ToggleValueInListAction({ path, value });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const currentArray = ensureArray<unknown>(getValueAtPath(element, this.payload.path));
		const exists = currentArray.includes(this.payload.value);
		const nextArray = exists ? currentArray.filter((item) => item !== this.payload.value) : [...currentArray, this.payload.value];

		return setValueAtPath(element, this.payload.path, nextArray);
	}
}

type ToggleAllValuesPayload = { path: string; values: unknown[] };

export class ToggleAllValuesInListAction extends CoreEngineAction<ToggleAllValuesPayload> {
	constructor(payload: ToggleAllValuesPayload) {
		if (!payload.path) {
			throw new Error("ToggleAllValuesInListAction requires a path");
		}
		if (!Array.isArray(payload.values)) {
			throw new Error("ToggleAllValuesInListAction requires an array of values");
		}
		super(payload);
	}

	static create(path: string, values: unknown[]): ToggleAllValuesInListAction {
		return new ToggleAllValuesInListAction({ path, values });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const currentArray = ensureArray<unknown>(getValueAtPath(element, this.payload.path));
		const hasAnyValue = this.payload.values.some((value) => currentArray.includes(value));

		if (hasAnyValue) {
			const filtered = currentArray.filter((item) => !this.payload.values.includes(item));
			return setValueAtPath(element, this.payload.path, filtered);
		}

		const nextArray = [...currentArray];
		for (const value of this.payload.values) {
			if (!nextArray.includes(value)) {
				nextArray.push(value);
			}
		}
		return setValueAtPath(element, this.payload.path, nextArray);
	}
}

type SetUndefinedPayload = { path: string };

export class SetUndefinedAction extends CoreEngineAction<SetUndefinedPayload> {
	constructor(payload: SetUndefinedPayload) {
		if (!payload.path) {
			throw new Error("SetUndefinedAction requires a path");
		}
		super(payload);
	}

	static create(path: string): SetUndefinedAction {
		return new SetUndefinedAction({ path });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		return deleteValueAtPath(element, this.payload.path);
	}
}

type InvertBooleanPayload = { path: string };

export class InvertBooleanAction extends CoreEngineAction<InvertBooleanPayload> {
	constructor(payload: InvertBooleanPayload) {
		if (!payload.path) {
			throw new Error("InvertBooleanAction requires a path");
		}
		super(payload);
	}

	static create(path: string): InvertBooleanAction {
		return new InvertBooleanAction({ path });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const currentValue = getValueAtPath(element, this.payload.path);
		if (typeof currentValue !== "boolean") {
			return element;
		}
		return setValueAtPath(element, this.payload.path, !currentValue);
	}
}

type SequentialPayload = { actions: ActionLike[] };

export class SequentialAction extends CoreEngineAction<SequentialPayload> {
	constructor(payload: SequentialPayload) {
		if (!Array.isArray(payload.actions)) {
			throw new Error("SequentialAction requires an array of actions");
		}
		super({ actions: [...payload.actions] });
	}

	static create(...actions: ActionLike[]): SequentialAction {
		return new SequentialAction({ actions });
	}

	protected async apply(element: Record<string, unknown>, context: ActionExecutionContext): Promise<Record<string, unknown>> {
		let currentElement = this.cloneElement(element);

		for (const action of this.payload.actions) {
			const result = await context.invoke(action, currentElement);
			if (result !== undefined) {
				currentElement = result;
			}
		}

		return currentElement;
	}
}

type AlternativePayload = { condition: boolean | Condition; ifTrue?: ActionLike; ifFalse?: ActionLike };

export class AlternativeAction extends CoreEngineAction<AlternativePayload> {
	static create(condition: boolean | Condition, ifTrue: ActionLike, ifFalse?: ActionLike): AlternativeAction {
		return new AlternativeAction({ condition, ifTrue, ifFalse });
	}

	protected async apply(element: Record<string, unknown>, context: ActionExecutionContext): Promise<Record<string, unknown> | undefined> {
		const cloned = this.cloneElement(element) as VoxelElement;
		const condition = this.payload.condition;
		const isTrue = typeof condition === "function" ? condition(cloned) : Boolean(condition);

		if (isTrue) {
			if (!this.payload.ifTrue) {
				throw new Error("AlternativeAction requires an 'ifTrue' action when condition is true");
			}
			return context.invoke(this.payload.ifTrue, cloned);
		}

		if (this.payload.ifFalse) {
			return context.invoke(this.payload.ifFalse, cloned);
		}

		return cloned;
	}
}

type TagsPayload = { tags: string[] };

export class AddTagsAction extends CoreEngineAction<TagsPayload> {
	constructor(payload: TagsPayload) {
		super({ tags: [...payload.tags] });
	}

	static create(tags: string[]): AddTagsAction {
		return new AddTagsAction({ tags });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const cloned = this.cloneElement(element);
		if (Array.isArray(cloned.tags)) {
			cloned.tags = [...cloned.tags, ...this.payload.tags];
		}
		return cloned;
	}
}

export class RemoveTagsAction extends CoreEngineAction<TagsPayload> {
	constructor(payload: TagsPayload) {
		super({ tags: [...payload.tags] });
	}

	static create(tags: string[]): RemoveTagsAction {
		return new RemoveTagsAction({ tags });
	}

	protected apply(element: Record<string, unknown>): Record<string, unknown> {
		const cloned = this.cloneElement(element);
		if (Array.isArray(cloned.tags)) {
			cloned.tags = cloned.tags.filter((tag) => !this.payload.tags.includes(tag));
		}
		return cloned;
	}
}

const CORE_ACTION_DOMAIN = defineActionDomain("core", [
	["setValue", "set_value", SetValueAction, (path: string, value: unknown) => SetValueAction.create(path, value)],
	["toggleValue", "toggle_value", ToggleValueAction, (path: string, value: unknown) => ToggleValueAction.create(path, value)],
	[
		"toggleValueInList",
		"toggle_value_in_list",
		ToggleValueInListAction,
		(path: string, value: unknown) => ToggleValueInListAction.create(path, value)
	],
	[
		"toggleAllValuesInList",
		"toggle_all_values_in_list",
		ToggleAllValuesInListAction,
		(path: string, values: unknown[]) => ToggleAllValuesInListAction.create(path, values)
	],
	["setUndefined", "set_undefined", SetUndefinedAction, (path: string) => SetUndefinedAction.create(path)],
	["invertBoolean", "invert_boolean", InvertBooleanAction, (path: string) => InvertBooleanAction.create(path)],
	["sequential", "sequential", SequentialAction, (...actions: ActionLike[]) => SequentialAction.create(...actions)],
	[
		"alternative",
		"alternative",
		AlternativeAction,
		(condition: boolean | Condition, ifTrue: ActionLike, ifFalse?: ActionLike) => AlternativeAction.create(condition, ifTrue, ifFalse)
	],
	["addTags", "add_tags", AddTagsAction, (...tags: string[]) => AddTagsAction.create(tags)],
	["removeTags", "remove_tags", RemoveTagsAction, (...tags: string[]) => RemoveTagsAction.create(tags)]
] as const);

export const CORE_ACTION_CLASSES = CORE_ACTION_DOMAIN.classes;
export const CoreActions = CORE_ACTION_DOMAIN.builders;
export type CoreAction = ActionJsonFromClasses<typeof CORE_ACTION_CLASSES>;
