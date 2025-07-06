import { ActionRegistry } from "./registry";
import type { Action } from "./types";

const registry = new ActionRegistry();

export async function updateData<T extends Record<string, unknown>>(
    action: Action,
    element: T,
    version?: number
): Promise<Partial<T> | undefined> {
    return registry.execute(action, element, version);
}
