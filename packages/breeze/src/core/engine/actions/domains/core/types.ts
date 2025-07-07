import type { Condition } from "@/core/engine/Condition";
import { type AllExpectedHandlerKeys, type ValidateHandlerRegistry, createHandlers } from "../../types";

export interface CoreActions {
	set_value: {
		path: string;
		value: unknown;
	};
	toggle_value: {
		path: string;
		value: unknown;
	};
	toggle_value_in_list: {
		path: string;
		value: unknown;
	};
	toggle_all_values_in_list: {
		path: string;
		values: any[];
	};
	set_undefined: {
		path: string;
	};
	invert_boolean: {
		path: string;
	};
	sequential: {
		actions: Array<any>;
	};
	alternative: {
		condition: boolean | Condition;
		ifTrue: any;
		ifFalse?: any;
	};
}

export type CoreAction = {
	[K in keyof CoreActions]: CoreActions[K] & { type: `core.${K}` };
}[keyof CoreActions];

export type CoreHandlerKeys = AllExpectedHandlerKeys<"core", CoreActions>;
export const createCoreHandlers = <T extends Record<CoreHandlerKeys, any>>(handlers: ValidateHandlerRegistry<T, CoreHandlerKeys>): T =>
	createHandlers(handlers);
