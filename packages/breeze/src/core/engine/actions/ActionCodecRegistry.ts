import type { Action } from "@/core/engine/actions/types";
import { type EngineAction, type ActionLike, isEngineAction } from "@/core/engine/actions/EngineAction";

export interface ActionClass<TAction extends EngineAction = EngineAction> {
	readonly type: string;
	new (...args: any[]): TAction;
	fromJSON(json: Action): TAction;
}

export class ActionCodecRegistry {
	private readonly decoders = new Map<string, (json: Action) => EngineAction>();

	register<TAction extends EngineAction>(actionClass: ActionClass<TAction>): void {
		this.decoders.set(actionClass.type, (json: Action) => actionClass.fromJSON(json));
	}

	decode(json: Action): EngineAction {
		const decoder = this.decoders.get(json.type);
		if (!decoder) {
			throw new Error(`No decoder registered for action type '${json.type}'`);
		}
		return decoder(json);
	}

	encode(action: ActionLike): Action {
		return isEngineAction(action) ? action.toJSON() : action;
	}

	has(type: string): boolean {
		return this.decoders.has(type);
	}
}
