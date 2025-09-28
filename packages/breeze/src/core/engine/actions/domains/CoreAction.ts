import { createActions } from "@/core/engine/actions/domain";
import { deleteValueAtPath, getValueAtPath, setValueAtPath } from "@/core/engine/actions/utils";
import { EngineAction } from "@/core/engine/actions/EngineAction";
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

const CORE_DOMAIN = createActions({
	setValue: {
		type: "core.set_value",
		class: SetValueAction,
		create: (path: string, value: unknown) => SetValueAction.create(path, value)
	},
	toggleValue: {
		type: "core.toggle_value",
		class: ToggleValueAction,
		create: (path: string, value: unknown) => ToggleValueAction.create(path, value)
	},
	toggleValueInList: {
		type: "core.toggle_value_in_list",
		class: ToggleValueInListAction,
		create: (path: string, value: unknown) => ToggleValueInListAction.create(path, value)
	},
	toggleAllValuesInList: {
		type: "core.toggle_all_values_in_list",
		class: ToggleAllValuesInListAction,
		create: (path: string, values: unknown[]) => ToggleAllValuesInListAction.create(path, values)
	},
	setUndefined: {
		type: "core.set_undefined",
		class: SetUndefinedAction,
		create: (path: string) => SetUndefinedAction.create(path)
	},
	invertBoolean: {
		type: "core.invert_boolean",
		class: InvertBooleanAction,
		create: (path: string) => InvertBooleanAction.create(path)
	},
	addTags: {
		type: "core.add_tags",
		class: AddTagsAction,
		create: (...tags: string[]) => AddTagsAction.create(tags)
	},
	removeTags: {
		type: "core.remove_tags",
		class: RemoveTagsAction,
		create: (...tags: string[]) => RemoveTagsAction.create(tags)
	}
});

export const CORE_ACTION_CLASSES = CORE_DOMAIN.classes;
export const CoreActions = CORE_DOMAIN.builders;
