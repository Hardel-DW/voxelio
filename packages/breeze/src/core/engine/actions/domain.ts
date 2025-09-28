import type { ActionHandler } from "@/core/engine/actions/types";
import type { ActionClass } from "@/core/engine/actions/ActionCodecRegistry";

export type RegisterClassFn = <TAction extends ActionClass>(actionClass: TAction) => ActionHandler;

export function buildDomainHandlers(actionClasses: readonly ActionClass[], register: RegisterClassFn): Map<string, ActionHandler> {
	const handlers = new Map<string, ActionHandler>();
	for (const actionClass of actionClasses) {
		handlers.set(actionClass.type, register(actionClass));
	}
	return handlers;
}

export type ActionsFromClasses<T extends readonly ActionClass[]> = InstanceType<T[number]>;
export type ActionJsonFromClasses<T extends readonly ActionClass[]> = ReturnType<ActionsFromClasses<T>["toJSON"]>;
