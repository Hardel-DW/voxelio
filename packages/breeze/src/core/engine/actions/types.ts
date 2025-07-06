import type { IdentifierObject } from "@/core/Identifier";

export type ActionValue = string | number | boolean | IdentifierObject | unknown;

export interface ActionHandler<T = any> {
    execute(
        action: T,
        element: Record<string, unknown>,
        version?: number
    ): Promise<Record<string, unknown> | undefined> | Record<string, unknown> | undefined;
}

export interface BaseAction {
    type: string;
}

export type Action = BaseAction & Record<string, unknown>;

export type DomainAction<Domain extends string, Actions extends Record<string, unknown>> = {
    [K in keyof Actions]: Actions[K] & { type: `${Domain}.${string}` };
}[keyof Actions];

export type InferActionTypes<T extends Map<string, ActionHandler<any>>> = T extends Map<infer K, ActionHandler<infer A>>
    ? K extends string
        ? A
        : never
    : never;

export type DomainActionKeys<T> = keyof T;
export type ExpectedHandlerKey<Domain extends string, K extends PropertyKey> = `${Domain}.${string & K}`;
export type AllExpectedHandlerKeys<Domain extends string, Actions> = ExpectedHandlerKey<Domain, keyof Actions>;

export type ValidateHandlerRegistry<T, Expected extends PropertyKey> = [Expected] extends [keyof T]
    ? [keyof T] extends [Expected]
        ? T // Perfect match
        : { error: "Extra handlers detected"; got: keyof T; expected: Expected }
    : { error: "Missing handlers"; got: keyof T; expected: Expected };

export function createHandlers<
    Domain extends string,
    Actions extends Record<string, any>,
    Expected extends AllExpectedHandlerKeys<Domain, Actions>,
    T extends Record<Expected, any>
>(handlers: ValidateHandlerRegistry<T, Expected>): T {
    return handlers as T;
}

export type UpdateDataFunction = (
    action: Action,
    element: Record<string, unknown>,
    version?: number
) => Promise<Record<string, unknown> | undefined>;
