import { deleteValueAtPath, getValueAtPath, setValueAtPath } from "@/core/engine/actions/utils";
import { Action } from "@/core/engine/actions/Action";

function ensureArray<T>(value: unknown): T[] {
	return Array.isArray(value) ? (value as T[]) : [];
}

export class SetValueAction extends Action<{ path: string; value: unknown }> {
	readonly type = "core.set_value" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		return setValueAtPath(element, this.params.path, this.params.value);
	}
}

export class ToggleValueAction extends Action<{ path: string; value: unknown }> {
	readonly type = "core.toggle_value" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const currentValue = getValueAtPath(element, this.params.path);
		const nextValue = currentValue === this.params.value ? undefined : this.params.value;
		return setValueAtPath(element, this.params.path, nextValue);
	}
}

export class ToggleValueInListAction extends Action<{ path: string; value: unknown }> {
	readonly type = "core.toggle_value_in_list" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const currentArray = ensureArray<unknown>(getValueAtPath(element, this.params.path));
		const exists = currentArray.includes(this.params.value);
		const nextArray = exists ? currentArray.filter((item) => item !== this.params.value) : [...currentArray, this.params.value];

		return setValueAtPath(element, this.params.path, nextArray);
	}
}

export class ToggleAllValuesInListAction extends Action<{ path: string; values: unknown[] }> {
	readonly type = "core.toggle_all_values_in_list" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const currentArray = ensureArray<unknown>(getValueAtPath(element, this.params.path));
		const hasAnyValue = this.params.values.some((value) => currentArray.includes(value));

		if (hasAnyValue) {
			const filtered = currentArray.filter((item) => !this.params.values.includes(item));
			return setValueAtPath(element, this.params.path, filtered);
		}

		const nextArray = [...currentArray];
		for (const value of this.params.values) {
			if (!nextArray.includes(value)) {
				nextArray.push(value);
			}
		}
		return setValueAtPath(element, this.params.path, nextArray);
	}
}

export class SetUndefinedAction extends Action<{ path: string }> {
	readonly type = "core.set_undefined" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		return deleteValueAtPath(element, this.params.path);
	}
}

export class InvertBooleanAction extends Action<{ path: string }> {
	readonly type = "core.invert_boolean" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const currentValue = getValueAtPath(element, this.params.path);
		if (typeof currentValue !== "boolean") {
			return element;
		}
		return setValueAtPath(element, this.params.path, !currentValue);
	}
}

export class AddTagsAction extends Action<{ tags: string[] }> {
	readonly type = "core.add_tags" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const cloned = structuredClone(element);
		if (Array.isArray(cloned.tags)) {
			cloned.tags = [...cloned.tags, ...this.params.tags];
		}
		return cloned;
	}
}

export class RemoveTagsAction extends Action<{ tags: string[] }> {
	readonly type = "core.remove_tags" as const;

	apply(element: Record<string, unknown>): Record<string, unknown> {
		const cloned = structuredClone(element);
		if (Array.isArray(cloned.tags)) {
			cloned.tags = cloned.tags.filter((tag) => !this.params.tags.includes(tag));
		}
		return cloned;
	}
}

// Liste des classes d'actions Core - ajouter ici pour créer une nouvelle action
export const CORE_ACTION_CLASSES = [
	SetValueAction,
	ToggleValueAction,
	ToggleValueInListAction,
	ToggleAllValuesInListAction,
	SetUndefinedAction,
	InvertBooleanAction,
	AddTagsAction,
	RemoveTagsAction
] as const;
