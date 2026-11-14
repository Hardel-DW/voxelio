import type { Route, RouteConfig, RouteId, Search } from "./types";

/** `export const route = defineRoute("/posts/$id", { ... })` next to the default export of a route file. */
export function defineRoute<const Id extends RouteId, Query extends Search = {}>(
	_id: Id,
	config: RouteConfig<Id, Query>
): Route<Id, Query> {
	return config;
}
