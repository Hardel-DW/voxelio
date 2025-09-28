import type { ActionClass } from "@/core/engine/actions/ActionCodecRegistry";

type ActionInstance<T extends ActionClass> = T["prototype"];
export type ActionsFromClasses<T extends readonly ActionClass[]> = ActionInstance<T[number]>;
export type ActionJsonFromClasses<T extends readonly ActionClass[]> = ReturnType<ActionsFromClasses<T>["toJSON"]>;
