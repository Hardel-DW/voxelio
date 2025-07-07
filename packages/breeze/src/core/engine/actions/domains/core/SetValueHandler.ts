import type { ActionHandler } from "../../types";
import { getValueAtPath, setValueAtPath } from "../../utils";
import type { CoreAction } from "./types";

export class SetValueHandler implements ActionHandler<CoreAction> {
	execute(
		action: Extract<CoreAction, { type: "core.set_value" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		return setValueAtPath(element, action.path, action.value);
	}
}

export class ToggleValueHandler implements ActionHandler<CoreAction> {
	execute(
		action: Extract<CoreAction, { type: "core.toggle_value" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		const currentValue = getValueAtPath(element, action.path);
		const newValue = currentValue === action.value ? undefined : action.value;
		return setValueAtPath(element, action.path, newValue);
	}
}

export class ToggleValueInListHandler implements ActionHandler<CoreAction> {
	execute(
		action: Extract<CoreAction, { type: "core.toggle_value_in_list" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		const currentValue = getValueAtPath(element, action.path);
		const currentArray = Array.isArray(currentValue) ? currentValue : [];

		const valueExists = currentArray.includes(action.value);
		const newArray = valueExists ? currentArray.filter((item) => item !== action.value) : [...currentArray, action.value];

		return setValueAtPath(element, action.path, newArray);
	}
}

export class InvertBooleanHandler implements ActionHandler<CoreAction> {
	execute(
		action: Extract<CoreAction, { type: "core.invert_boolean" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		const currentValue = getValueAtPath(element, action.path);
		if (typeof currentValue !== "boolean") {
			return element;
		}

		return setValueAtPath(element, action.path, !currentValue);
	}
}

export class ToggleAllValuesInListHandler implements ActionHandler<CoreAction> {
	execute(
		action: Extract<CoreAction, { type: "core.toggle_all_values_in_list" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		const currentValue = getValueAtPath(element, action.path);
		const currentArray = Array.isArray(currentValue) ? currentValue : [];

		// Check if any of the values are present in the current array
		const hasAnyValue = action.values.some((value) => currentArray.includes(value));

		if (hasAnyValue) {
			// Remove all values from the array
			const newArray = currentArray.filter((item) => !action.values.includes(item));
			return setValueAtPath(element, action.path, newArray);
		}

		// Add all values to the array (avoiding duplicates)
		const newArray = [...currentArray];
		for (const value of action.values) {
			if (!newArray.includes(value)) {
				newArray.push(value);
			}
		}
		return setValueAtPath(element, action.path, newArray);
	}
}
