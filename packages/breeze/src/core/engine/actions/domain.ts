import type { ActionClass } from "@/core/engine/actions/ActionCodecRegistry";
import type { ActionLike } from "@/core/engine/actions/index";

export type ActionInstance<T extends ActionClass> = T["prototype"];
export type ActionsFromClasses<T extends readonly ActionClass[]> = ActionInstance<T[number]>;
export type ActionJsonFromClasses<T extends readonly ActionClass[]> = ReturnType<ActionsFromClasses<T>["toJSON"]>;
export interface ActionHandler<T = ActionLike> {
	execute(action: T, element: Record<string, unknown>, version?: number): Record<string, unknown> | undefined;
}

export type ActionDomainEntry<
	TKey extends string,
	TTypeSuffix extends string,
	TClass extends ActionClass,
	TFactory extends (...args: any[]) => ActionInstance<TClass>
> = readonly [TKey, TTypeSuffix, TClass, TFactory];

type ActionDomainBuilders<
	TEntries extends readonly ActionDomainEntry<string, string, ActionClass, (...args: any[]) => ActionInstance<ActionClass>>[]
> = {
		[K in TEntries[number]as K[0]]: K[3];
	};

function attachActionType(actionClass: ActionClass, type: string) {
	const descriptor = Object.getOwnPropertyDescriptor(actionClass, "type");
	if (descriptor?.value && descriptor.value !== type) {
		throw new Error(`Action already declares type '${descriptor.value}' but expected '${type}'.`);
	}

	Object.defineProperty(actionClass, "type", {
		configurable: false,
		enumerable: true,
		writable: false,
		value: type
	});
}

export function defineActionDomain<
	const TPrefix extends string,
	const TEntries extends readonly ActionDomainEntry<string, string, ActionClass, (...args: any[]) => ActionInstance<ActionClass>>[]
>(prefix: TPrefix, entries: TEntries) {
	const builders = {} as ActionDomainBuilders<TEntries>;

	const classes = entries.map(([builderKey, typeSuffix, actionClass, factory]) => {
		const actionType = `${prefix}.${typeSuffix}`;
		attachActionType(actionClass, actionType);
		builders[builderKey as keyof typeof builders] = factory as (typeof builders)[keyof typeof builders];
		return actionClass;
	}) as {
			[K in keyof TEntries]: TEntries[K] extends ActionDomainEntry<any, any, infer TClass, any> ? TClass : never;
		};

	return {
		classes,
		builders
	} as const;
}

// New simple object-based helper
export function createActions<T extends Record<string, { type: string; class: ActionClass; create: any }>>(
	actions: T
) {
	// Auto-assign types
	Object.values(actions).forEach(config => {
		attachActionType(config.class, config.type);
	});

	const classes = Object.values(actions).map(config => config.class);
	const builders = Object.fromEntries(
		Object.entries(actions).map(([key, config]) => [key, config.create])
	) as { [K in keyof T]: T[K]["create"] };

	return { classes, builders };
}
