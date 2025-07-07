import type { ActionHandler } from "../../types";
import { deleteValueAtPath } from "../../utils";
import type { CoreAction } from "./types";

export class UndefinedHandler implements ActionHandler<CoreAction> {
	execute(
		action: Extract<CoreAction, { type: "core.set_undefined" }>,
		element: Record<string, unknown>
	): Record<string, unknown> | undefined {
		return deleteValueAtPath(element, action.path);
	}
}
