import type { Action, ActionPayload } from "@/core/engine/actions/index";

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

	execute(element: Record<string, unknown>, version?: number): Record<string, unknown> | undefined {
		return this.apply(element, version);
	}

	protected abstract apply(element: Record<string, unknown>, version?: number): Record<string, unknown> | undefined;
}

export function isEngineAction(value: unknown): value is EngineAction {
	return value instanceof EngineAction;
}

export function extractPayload<T extends Action>(action: T): Omit<T, "type"> {
	// biome-ignore lint/correctness/noUnusedVariables: type is intentionally destructured and not used to extract payload
	const { type, ...payload } = action;
	return payload;
}
