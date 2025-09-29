import { executeAction } from "@/core/engine/actions/registry";
import type { ActionLike } from "@/core/engine/actions/registry";

export function updateData<T extends Record<string, unknown>>(action: ActionLike, element: T, version?: number): Partial<T> | undefined {
	return executeAction(action, element, version) as Partial<T> | undefined;
}
