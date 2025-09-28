import type { Action } from "@/core/engine/actions/types";

export type ActionPayload = Record<string, unknown>;

export interface ActionExecutionContext {
	readonly version?: number;
	invoke(action: ActionLike, element: Record<string, unknown>): Promise<Record<string, unknown> | undefined>;
}

export abstract class EngineAction<TPayload extends ActionPayload = ActionPayload> {
	static readonly type: string;

	readonly payload: Readonly<TPayload>;

	protected constructor(payload: TPayload) {
		this.payload = payload;
	}

	get type(): string {
		const ctor = this.constructor as typeof EngineAction & { type?: string };
		if (!ctor.type) {
			const name = ctor.name && ctor.name !== "Function" ? ctor.name : "<anonymous>";
			throw new Error(`Action class ${name} is missing a static 'type'.`);
		}
		return ctor.type;
	}

	toJSON(): Action {
		return { type: this.type, ...this.payload } as Action;
	}

	execute(
		element: Record<string, unknown>,
		context: ActionExecutionContext
	): Promise<Record<string, unknown> | undefined> | Record<string, unknown> | undefined {
		return this.apply(element, context);
	}

	protected abstract apply(
		element: Record<string, unknown>,
		context: ActionExecutionContext
	): Promise<Record<string, unknown> | undefined> | Record<string, unknown> | undefined;
}

export type ActionLike = Action | EngineAction;

export function isEngineAction(value: unknown): value is EngineAction {
	return value instanceof EngineAction;
}

export function extractPayload<T extends Action>(action: T): Omit<T, "type"> {
	// biome-ignore lint/correctness/noUnusedVariables: type is intentionally destructured and not used to extract payload
	const { type, ...payload } = action;
	return payload;
}
