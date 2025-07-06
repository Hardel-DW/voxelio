import type { ActionRegistry } from "../../registry";
import type { ActionHandler } from "../../types";
import type { CoreAction } from "./types";

export class SequentialHandler implements ActionHandler<CoreAction> {
    constructor(private registry?: ActionRegistry) {}

    async execute(
        action: Extract<CoreAction, { type: "core.sequential" }>,
        element: Record<string, unknown>,
        version?: number
    ): Promise<Record<string, unknown> | undefined> {
        let currentElement = structuredClone(element);

        for (const subAction of action.actions) {
            if (!this.registry) {
                throw new Error("Registry not available for sequential action");
            }

            const result = await this.registry.execute(subAction, currentElement, version);
            if (result !== undefined) {
                currentElement = result;
            }
        }

        return currentElement;
    }
}
