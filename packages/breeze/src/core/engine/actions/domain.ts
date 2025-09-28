import type { ActionClass } from "@/core/engine/actions/ActionCodecRegistry";

export type ActionInstance<T extends ActionClass> = T["prototype"];
export type ActionsFromClasses<T extends readonly ActionClass[]> = ActionInstance<T[number]>;
export type ActionJsonFromClasses<T extends readonly ActionClass[]> = ReturnType<ActionsFromClasses<T>["toJSON"]>;

export type ActionDomainEntry<
	TKey extends string,
	TTypeSuffix extends string,
	TClass extends ActionClass,
	TFactory extends (...args: any[]) => ActionInstance<TClass>
> = readonly [TKey, TTypeSuffix, TClass, TFactory];

type ActionDomainBuilders<
	TEntries extends readonly ActionDomainEntry<string, string, ActionClass, (...args: any[]) => ActionInstance<ActionClass>>[]
> = {
	[K in TEntries[number] as K[0]]: K[3];
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
