import type { Action } from "@/core/engine/actions/types";
import { extractPayload, type EngineAction, type ActionLike, isEngineAction } from "@/core/engine/actions/EngineAction";

export type ActionClass<TAction extends EngineAction = EngineAction> = {
	readonly type: string;
	readonly prototype: TAction;
};

export class ActionCodecRegistry {
	private readonly classes = new Map<string, ActionClass>();

	register<TAction extends EngineAction>(actionClass: ActionClass<TAction>): void {
		this.classes.set(actionClass.type, actionClass);
	}

	decode(json: Action): EngineAction {
		const actionClass = this.classes.get(json.type);
		if (!actionClass) {
			throw new Error(`No decoder registered for action type '${json.type}'`);
		}
		const payload = extractPayload(json);
		const ctor = actionClass as unknown as new (payload: any) => EngineAction;
		return new ctor(payload);
	}

	encode(action: ActionLike): Action {
		return isEngineAction(action) ? action.toJSON() : action;
	}

	has(type: string): boolean {
		return this.classes.has(type);
	}
}
