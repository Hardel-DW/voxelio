import type { VoxelElement } from "@/core/Element";
import type { ActionRegistry } from "../../registry";
import type { ActionHandler } from "../../types";
import type { CoreAction } from "./types";

export class AlternativeHandler implements ActionHandler<CoreAction> {
	constructor(private registry: ActionRegistry) {}

	async execute(
		action: Extract<CoreAction, { type: "core.alternative" }>,
		element: Record<string, unknown>,
		version?: number
	): Promise<Record<string, unknown> | undefined> {
		const currentElement = structuredClone(element) as VoxelElement;
		if (typeof action.condition === "function" ? action.condition(currentElement) : action.condition) {
			return await this.registry.execute(action.ifTrue, currentElement, version);
		}

		if (action.ifFalse) {
			return await this.registry.execute(action.ifFalse, currentElement, version);
		}

		return currentElement;
	}
}
