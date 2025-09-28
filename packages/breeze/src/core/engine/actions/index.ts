import { ActionRegistry } from "@/core/engine/actions/registry";
import type { ActionLike } from "@/core/engine/actions/EngineAction";

const registry = new ActionRegistry();

export async function updateData<T extends Record<string, unknown>>(
	action: ActionLike,
	element: T,
	version?: number
): Promise<Partial<T> | undefined> {
	return registry.execute(action, element, version);
}
