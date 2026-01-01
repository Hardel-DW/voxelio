import type { ActionValue } from "@/core/engine/actions/index";

/**
 * Get the field value from the action value
 */
export function getFieldValue(value: ActionValue): ActionValue {
	if (typeof value === "object" && value !== null && "type" in value && value.type === "get_value_from_field" && "field" in value) {
		return value.field;
	}
	return value;
}

/**
 * Set a value at a given path in an object
 * @param obj - The object to modify
 * @param path - Dot-separated path (e.g., "minecraft.difficulty")
 * @param value - Value to set
 * @returns New object with the value set
 */
export function setValueAtPath(obj: Record<string, unknown>, path: string, value: unknown): Record<string, unknown> {
	const result = { ...obj };
	const pathParts = path.split(".");
	let current = result;

	for (let i = 0; i < pathParts.length - 1; i++) {
		const part = pathParts[i];
		if (!(part in current)) {
			current[part] = {};
		} else {
			if (Array.isArray(current[part])) {
				current[part] = [...(current[part] as unknown[])];
			} else if (typeof current[part] === "object" && current[part] !== null) {
				current[part] = { ...(current[part] as Record<string, unknown>) };
			}
		}
		current = current[part] as Record<string, unknown>;
	}

	const lastKey = pathParts[pathParts.length - 1];
	current[lastKey] = value;

	return result;
}

/**
 * Get a value at a given path in an object
 * @param obj - The object to read from
 * @param path - Dot-separated path
 * @returns The value at the path, or undefined if not found
 */
export function getValueAtPath(obj: Record<string, unknown>, path: string): unknown {
	const pathParts = path.split(".");
	let current: unknown = obj;

	for (const part of pathParts) {
		if (typeof current !== "object" || current === null || !(part in current)) {
			return undefined;
		}
		current = (current as Record<string, unknown>)[part];
	}

	return current;
}

/**
 * Delete a value at a given path in an object
 * @param obj - The object to modify
 * @param path - Dot-separated path
 * @returns New object with the key removed
 */
export function deleteValueAtPath(obj: Record<string, unknown>, path: string): Record<string, unknown> {
	const result = { ...obj };
	const pathParts = path.split(".");
	let current = result;

	for (let i = 0; i < pathParts.length - 1; i++) {
		const part = pathParts[i];
		if (!(part in current)) {
			return result;
		}
		current[part] = { ...(current[part] as Record<string, unknown>) };
		current = current[part] as Record<string, unknown>;
	}

	const lastKey = pathParts[pathParts.length - 1];
	delete current[lastKey];

	return result;
}
